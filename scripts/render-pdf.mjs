#!/usr/bin/env node
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const input = resolve(root, process.argv[2] || "data/example-pango.json");
const output = resolve(root, process.argv[3] || "output/example-pango.pdf");

const quote = JSON.parse(readFileSync(input, "utf8"));
const encoded = Buffer.from(JSON.stringify(quote), "utf8").toString("base64url");
const indexUrl = `${pathToFileURL(resolve(root, "index.html")).href}#pdf=1&data=${encoded}`;
const chrome = findChrome();

mkdirSync(dirname(output), { recursive: true });

const result = spawnSync(
  chrome,
  [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--allow-file-access-from-files",
    "--run-all-compositor-stages-before-draw",
    "--virtual-time-budget=3000",
    "--print-to-pdf-no-header",
    `--print-to-pdf=${output}`,
    indexUrl,
  ],
  { stdio: "inherit" }
);

if (result.error) {
  throw result.error;
}

if (result.status !== 0) {
  process.exit(result.status || 1);
}

const linkResult = spawnSync("python3", [resolve(root, "scripts/fix-pdf-links.py"), output], {
  encoding: "utf8",
});

if (linkResult.stdout) process.stdout.write(linkResult.stdout);
if (linkResult.stderr) process.stderr.write(linkResult.stderr);

if (linkResult.error) {
  throw linkResult.error;
}

const convertedLinks = Number((linkResult.stdout || "").match(/converted_links=(\d+)/)?.[1] || 0);

if (linkResult.status === 0 && convertedLinks === 0) {
  console.error("PDF rendering did not produce active table-of-contents links.");
  process.exit(1);
}

process.exit(linkResult.status || 0);

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "google-chrome",
    "chromium",
  ].filter(Boolean);

  for (const candidate of candidates) {
    const probe = spawnSync(candidate, ["--version"], { stdio: "ignore" });
    if (!probe.error && probe.status === 0) {
      return candidate;
    }
  }

  throw new Error("Chrome was not found. Set CHROME_PATH to a Chrome-compatible browser executable.");
}
