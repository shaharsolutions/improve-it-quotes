#!/usr/bin/env node
import { createServer } from "node:http";
import { createReadStream, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, normalize, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const port = Number(process.env.PORT || 4173);
const maxBodySize = 12 * 1024 * 1024;
const signedArchivePath = resolve(root, "output", "signed-archive.local.json");

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
};

const server = createServer(async (request, response) => {
  try {
    if (request.method === "OPTIONS" && request.url?.startsWith("/api/")) {
      sendCors(response, 204, {});
      return;
    }

    if (request.method === "POST" && request.url === "/api/render-pdf") {
      await renderPdf(request, response);
      return;
    }

    if (request.url?.startsWith("/api/signed-archive")) {
      await handleSignedArchiveRequest(request, response);
      return;
    }

    if ((request.method === "GET" || request.method === "HEAD") && request.url?.startsWith("/api/render-pdf")) {
      const url = new URL(request.url || "", `http://localhost:${port}`);
      if (url.searchParams.has("z")) {
        await renderPdfFromQuery(url, response);
        return;
      }

      sendHtml(
        response,
        200,
        `<!doctype html>
<html lang="he" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <title>יצירת PDF</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 40px; color: #073a3a; line-height: 1.6; }
      a { color: #0072ce; }
    </style>
  </head>
  <body>
    <h1>יצירת PDF</h1>
    <p>כתובת זו מקבלת נתוני הצעה מהמחולל ויוצרת PDF עם קישורים פעילים בתוכן העניינים.</p>
    <p>כדי ליצור PDF, פתחו את <a href="/">המחולל</a> ולחצו על <strong>הדפסה / PDF</strong>.</p>
  </body>
</html>`
      );
      return;
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      sendText(response, 405, "Method not allowed");
      return;
    }

    serveStatic(request, response);
  } catch (error) {
    console.error(error);
    sendText(response, 500, "Internal server error");
  }
});

server.listen(port, () => {
  console.log(`Serving Improve-IT quote generator at http://localhost:${port}/`);
});

async function handleSignedArchiveRequest(request, response) {
  if (request.method === "GET") {
    sendJson(response, 200, readLocalSignedArchive());
    return;
  }

  if (request.method === "POST") {
    const record = JSON.parse(await readBody(request) || "{}");
    if (!record?.id || !record?.quote || typeof record.quote !== "object") {
      sendJson(response, 400, { error: "Missing signed quote record" });
      return;
    }

    const archive = readLocalSignedArchive().filter((item) => item.id !== record.id);
    archive.unshift(record);
    writeLocalSignedArchive(archive);
    sendJson(response, 200, { ok: true });
    return;
  }

  if (request.method === "DELETE") {
    const url = new URL(request.url || "", `http://localhost:${port}`);
    const id = url.searchParams.get("id");
    if (!id) {
      sendJson(response, 400, { error: "Missing id" });
      return;
    }

    writeLocalSignedArchive(readLocalSignedArchive().filter((item) => item.id !== id));
    sendJson(response, 200, { ok: true });
    return;
  }

  sendJson(response, 405, { error: "Method not allowed" });
}

function readLocalSignedArchive() {
  try {
    const archive = JSON.parse(readFileSync(signedArchivePath, "utf8"));
    return Array.isArray(archive) ? archive : [];
  } catch {
    return [];
  }
}

function writeLocalSignedArchive(archive) {
  mkdirSync(dirname(signedArchivePath), { recursive: true });
  writeFileSync(signedArchivePath, JSON.stringify(archive, null, 2), "utf8");
}

async function renderPdf(request, response) {
  const body = await readBody(request);
  const payload = parsePdfPayload(request, body);
  await renderPdfPayload(payload, response);
}

async function renderPdfFromQuery(url, response) {
  const payload = {
    filename: url.searchParams.get("filename") || "",
    download: url.searchParams.get("download") === "1",
    open: url.searchParams.get("open") === "1",
    save: url.searchParams.get("save") === "1",
    quote: JSON.parse(decodeQuotePayload(url.searchParams.get("z") || "")),
  };
  await renderPdfPayload(payload, response);
}

async function renderPdfPayload(payload, response) {
  const quote = payload.quote;

  if (!quote || typeof quote !== "object") {
    sendText(response, 400, "Missing quote payload");
    return;
  }

  const tempDir = resolve(root, "output", ".tmp");
  mkdirSync(tempDir, { recursive: true });

  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const inputPath = resolve(tempDir, `${stamp}.json`);
  const outputPath = resolve(tempDir, `${stamp}.pdf`);

  try {
    writeFileSync(inputPath, JSON.stringify(quote), "utf8");

    const result = spawnSync(process.execPath, [resolve(root, "scripts/render-pdf.mjs"), inputPath, outputPath], {
      cwd: root,
      encoding: "utf8",
    });

    if (result.error) throw result.error;
    if (result.status !== 0) {
      throw new Error(result.stderr || result.stdout || "PDF rendering failed");
    }

    const pdf = readFileSync(outputPath);
    const filename = safePdfFilename(payload.filename || quote.quoteNumber || "quote");
    if (payload.save) {
      const savePath = choosePdfSavePath(filename);

      if (!savePath) {
        sendHtml(response, 200, renderPdfResultPage("שמירת PDF בוטלה", "לא נשמר קובץ.", ""));
        return;
      }

      writeFileSync(savePath, pdf);
      sendHtml(response, 200, renderPdfResultPage("ה-PDF נשמר", "הקובץ נשמר במיקום שבחרתם, עם קישורים פעילים בתוכן העניינים.", savePath));
      return;
    }

    if (payload.open) {
      const finalPath = resolve(root, "output", filename);
      writeFileSync(finalPath, pdf);
      const openResult = spawnSync("open", [finalPath], { stdio: "ignore" });
      const fileUrl = `/output/${encodeURIComponent(filename)}`;

      sendHtml(
        response,
        openResult.status === 0 ? 200 : 500,
        `<!doctype html>
<html lang="he" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <title>PDF נוצר</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 40px; color: #073a3a; line-height: 1.6; }
      a { color: #0072ce; }
      code { direction: ltr; unicode-bidi: plaintext; }
    </style>
  </head>
  <body>
    <h1>${openResult.status === 0 ? "ה-PDF נוצר ונפתח" : "ה-PDF נוצר"}</h1>
    <p>הקובץ נשמר כאן:</p>
    <p><code>${escapeHtml(finalPath)}</code></p>
    <p><a href="${escapeAttr(fileUrl)}">פתיחת הקובץ בדפדפן</a></p>
    ${openResult.status === 0 ? "" : "<p>לא הצלחנו לפתוח את הקובץ אוטומטית. אפשר לפתוח אותו מהנתיב שמופיע למעלה.</p>"}
    <p><a href="/">חזרה למחולל</a></p>
  </body>
</html>`
      );
      return;
    }

    response.writeHead(200, {
      "Content-Type": "application/pdf",
      "Content-Length": pdf.length,
      "Content-Disposition": `${payload.download ? "attachment" : "inline"}; filename="${filename}"`,
      "Cache-Control": "no-store",
    });
    response.end(pdf);
  } finally {
    rmSync(inputPath, { force: true });
    rmSync(outputPath, { force: true });
  }
}

function choosePdfSavePath(defaultName) {
  const script = [
    `set chosenFile to choose file name with prompt "בחרו היכן לשמור את קובץ ה-PDF" default name "${escapeAppleScript(defaultName)}"`,
    "POSIX path of chosenFile",
  ].join("\n");
  const result = spawnSync("osascript", ["-e", script], { encoding: "utf8" });

  if (result.error || result.status !== 0) {
    return "";
  }

  const selectedPath = result.stdout.trim();
  if (!selectedPath) return "";
  return selectedPath.toLowerCase().endsWith(".pdf") ? selectedPath : `${selectedPath}.pdf`;
}

function renderPdfResultPage(title, message, filePath) {
  return `<!doctype html>
<html lang="he" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 40px; color: #073a3a; line-height: 1.6; }
      a { color: #0072ce; }
      code { direction: ltr; unicode-bidi: plaintext; }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(message)}</p>
    ${filePath ? `<p><code>${escapeHtml(filePath)}</code></p>` : ""}
    <p><a href="/">חזרה למחולל</a></p>
  </body>
</html>`;
}

function escapeAppleScript(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function decodeQuotePayload(value) {
  const bytes = Buffer.from(value.replace(/-/g, "+").replace(/_/g, "/"), "base64");

  try {
    return gunzipSync(bytes).toString("utf8");
  } catch {
    return bytes.toString("utf8");
  }
}

function parsePdfPayload(request, body) {
  const contentType = request.headers["content-type"] || "";

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const params = new URLSearchParams(body);
    return {
      filename: params.get("filename") || "",
      quote: JSON.parse(params.get("quote") || "{}"),
    };
  }

  return JSON.parse(body || "{}");
}

function serveStatic(request, response) {
  const url = new URL(request.url || "/", `http://localhost:${port}`);
  const pathname = decodeURIComponent(url.pathname);
  const requestedPath = pathname === "/" ? "index.html" : pathname.slice(1);
  const filePath = resolve(root, normalize(requestedPath));

  if (!filePath.startsWith(root)) {
    sendText(response, 403, "Forbidden");
    return;
  }

  let stat;
  try {
    stat = statSync(filePath);
  } catch {
    sendText(response, 404, "Not found");
    return;
  }

  if (!stat.isFile()) {
    sendText(response, 404, "Not found");
    return;
  }

  response.writeHead(200, {
    "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream",
    "Content-Length": stat.size,
    "Cache-Control": cacheControl(filePath),
  });

  if (request.method === "HEAD") {
    response.end();
    return;
  }

  createReadStream(filePath).pipe(response);
}

function readBody(request) {
  return new Promise((resolveBody, reject) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > maxBodySize) {
        reject(new Error("Request body too large"));
        request.destroy();
      }
    });
    request.on("end", () => resolveBody(body));
    request.on("error", reject);
  });
}

function sendText(response, status, message) {
  response.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
  response.end(message);
}

function sendJson(response, status, payload) {
  sendCors(response, status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(payload));
}

function sendHtml(response, status, html) {
  response.writeHead(status, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
  response.end(html);
}

function sendCors(response, status, headers) {
  response.writeHead(status, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    ...headers,
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}

function cacheControl(filePath) {
  return [".html", ".css", ".js"].includes(extname(filePath)) ? "no-cache" : "public, max-age=3600";
}

function safePdfFilename(value) {
  const base = String(value || "quote")
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/\.pdf$/i, "")
    .slice(0, 80);
  return `${base || "quote"}.pdf`;
}
