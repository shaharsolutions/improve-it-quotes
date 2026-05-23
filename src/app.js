(function () {
  const STORAGE_KEY = "improve-it-quote-generator";
  const SIGNED_ARCHIVE_KEY = "improve-it-signed-quotes";
  const TEMPLATE_SETTINGS_KEY = "improve-it-template-settings";
  const memoryStorage = new Map();
  let supabaseClient = null;
  const TEMPLATE_DEFINITIONS = {
    lmsShelfRental: {
      label: "השכרת LMS עם לומדות מדף",
      description: "פורמט מלא להצעת השכרה שנתית של מערכת LMS עם לומדות מדף.",
      defaults: {
        includeLms: true,
        showCompanyProfile: true,
        showClients: true,
        showBackground: true,
        showSolution: true,
        showWorkProcess: true,
        showPricing: true,
        showTerms: true,
        showCancellation: true,
        pricingPlanLabel: "השכרה - מסלול שנתי",
      },
      sectionDefinitions: [
        ["showCompanyProfile", "profile", "פרופיל חברה"],
        ["showBackground", "background", "רקע"],
        ["showSolution", "solution", "הפתרון המוצע - כללי"],
        ["showWorkProcess", "work", "תהליך העבודה המוצע"],
        ["showPricing", "pricing", "תמחור ותכולת הלומדה"],
      ],
    },
    shelfCoursesOnly: {
      label: "לומדות מדף ללא LMS",
      description: "פורמט להצעת שימוש בלומדות מדף, ללא הקמה וניהול של מערכת LMS.",
      defaults: {
        includeLms: false,
        showCompanyProfile: true,
        showClients: true,
        showBackground: true,
        showSolution: true,
        showWorkProcess: true,
        showPricing: true,
        showTerms: true,
        showCancellation: true,
        pricingPlanLabel: "רכישת / שימוש בלומדות מדף",
      },
      sectionDefinitions: [
        ["showCompanyProfile", "profile", "פרופיל חברה"],
        ["showBackground", "background", "רקע"],
        ["showSolution", "solution", "הפתרון המוצע - כללי"],
        ["showWorkProcess", "work", "תהליך העבודה המוצע"],
        ["showPricing", "pricing", "תמחור ותכולת הלומדה"],
      ],
    },
    shortCommercial: {
      label: "הצעה מקוצרת",
      description: "פורמט קצר שמציג רק רקע, פתרון, תמחור ותנאים.",
      defaults: {
        includeLms: true,
        showCompanyProfile: false,
        showClients: false,
        showBackground: true,
        showSolution: true,
        showWorkProcess: false,
        showPricing: true,
        showTerms: true,
        showCancellation: false,
        pricingPlanLabel: "תמחור מסחרי",
      },
      sectionDefinitions: [
        ["showBackground", "background", "רקע"],
        ["showSolution", "solution", "הפתרון המוצע"],
        ["showPricing", "pricing", "תמחור"],
      ],
    },
  };
  const DEFAULT_TEMPLATE_ID = "lmsShelfRental";
  const DEFAULT_TEMPLATE_SETTINGS = JSON.parse(JSON.stringify(TEMPLATE_DEFINITIONS));
  const TEMPLATE_SECTION_OPTIONS = [
    ["showCompanyProfile", "profile", "פרופיל חברה"],
    ["showClients", "clients", "לקוחות"],
    ["showBackground", "background", "רקע"],
    ["showSolution", "solution", "הפתרון המוצע"],
    ["showWorkProcess", "work", "תהליך העבודה"],
    ["showPricing", "pricing", "תמחור"],
    ["showTerms", "terms", "תנאים"],
    ["showCancellation", "cancellation", "ביטולים"],
  ];
  const DEFAULT_SECTION_TEXTS = {
    companyProfileText:
      "את Improve-IT ייסד בשנת 2010 זיו גלבוע, המביא עימו שנים רבות של ניסיון בניהול בכיר בחברות מובילות בשוק בארץ, כמו גם ייעוץ לארגונים והיכרות רחבה עם מגוון הצרכים והפתרונות לשיפור ביצועים באמצעות תהליכי למידה ארגוניים.\n\nצוות החברה מונה מפתחי הדרכה מנוסים בביצוע של עשרות רבות של פרויקטים בתחום ההדרכה והלמידה הדיגיטלית. בין השאר הצוות כולל מפיקים, גרפיקאים, מנחים ויועצים מקשת רחבה של התמחויות התורמים להצלחת התהליך בארגונים.\n\nהצוות הרב מקצועי מביא עמו יכולות של פיתוח הדרכה, פיצוח תוכן, הפקת לומדות, סטודיו לצילום ודיבוב, וכן מיומנויות של ייעוץ ואימון אישי.",
    clientsText: "מבין לקוחותינו",
    workProcessText:
      "התאמת התוכן: התוכן מבוסס על לומדות מדף, ויותאם בהתאם לדף ההערות אשר יועבר אלינו. ההתאמות כוללות שינויי טקסט, הוספת לוגו ושם לקוח בלבד.\nשלב 1: הטמעת ההתאמות הנדרשות בלומדות המדף.\nתיקוף ראשון: הלומדה המעודכנת תועבר אליכם לתיקוף ראשון.\nשלב 2: הטמעת התיקונים בלומדה לאחר תיקוף ראשון.\nתיקוף שני: תיקוף ואישור סופי של הלומדה שהופקה.",
    lmsServiceText:
      "הכנה להקמת סביבה: יועברו אלינו רשימת משתמשים, מספר זיהוי לכל משתמש ולוגו הארגון באיכות טובה עם רקע שקוף.\nהקמת סביבת עבודה במערכת ה-LMS עבור הארגון.\nהעלאת הלומדות והמשתמשים לסביבת העבודה שהוקמה במערכת.\nהפקת דו\"חות: דו\"ח ביצוע יועבר אליכם אחת לחודש.",
    pricingFinePrintText:
      "המחיר כולל סבב תיקוף אחד בלבד בכל שלב; כל ההערות לתיקון הלומדה יועברו בפעם אחת.\nלאחר אישור שלב על ידי הלקוח, חזרה אחורה לשינוי ותיקון תוכן השלב תהיה בעלות נוספת.\nהמחיר אינו כולל מע\"מ כחוק.\nהמחיר אינו כולל תרגום הלומדה לשפות.\nהמחיר כולל התאמה למובייל במצב אופקי בלבד; התאמה למצב אנכי בתוספת תשלום.\nלא תתאפשר מחיקת משתמשים לאחר עליית הפרויקט לאוויר. במסלול השנתי ניתן לעדכן משתמשים אחת לחודש קלנדרי.\nטרם תחילת העבודה המזמין יחתום על הזמנת עבודה רשמית.\nכל חריגה או שעות עדכון ותחזוקה של הלומדה יהיו לפי עלות של 300 ₪ לשעה.",
    termsText:
      "כלל התוצרים יימסרו בפורמטים דיגיטליים בלבד; הצעת המחיר אינה כוללת הוצאה לאור.\nכלל ההתנהלות בפרויקט תהיה מול גורם אחד אשר יוגדר כ-POC וינהל את תחום העברת הידע מולנו.\nהעבודה מותנית בקבלת הזמנת עבודה רשמית לפחות 20 ימי עסקים טרם תחילת העבודה בפועל.\nImprove-IT אינה אחראית בגין כל אי התאמה או נזק, בין ישיר ובין עקיף, שייגרם כתוצאה משימוש בתוכנה או בתוכן על ידי הלקוח.\nסך החבות המצטברת לתשלום פיצויים בגין נזקים, מכל עילה שהיא, לא יעלה על סכום התמורה.\nהחברה רשאית לעשות שימוש בתוצרים ובחומריהם לצורכי הצגה ושיווק, אלא אם סוכם אחרת בכתב.",
    cancellationText:
      "על תכולה אשר תבוטל לפני תחילת העבודה הרשמית ייגבו 30% מסך המחיר המוזמן, למעט אם הועברו חומרים כלשהם למזמין; במקרה כזה תשולם העלות המלאה.\nתכולת עבודה אשר נכנסה לעבודה תשולם בהתאם לאבן הדרך הבאה בתוספת 20% מסך שארית ההזמנה.\nלא יתקיימו החזרים מאבני דרך ששולמו.\nכלל תכולות העבודה משפיעות האחת על השנייה; ביטול של תכולות עלול לגרור שינוי במחירים ליחידה של שאר התכולות המוזמנות, בכפוף להצעה זו ולשיקול דעתה הבלעדי של Improve-IT.",
  };
  const EDITABLE_SECTIONS = {
    profile: { title: "פרופיל חברה", field: "companyProfileText" },
    clients: { title: "לקוחות", field: "clientsText" },
    background: { title: "רקע", field: "backgroundText" },
    solution: { title: "פתרון", field: "solutionText" },
    work: { title: "תהליך עבודה", field: "workProcessText", extraField: "lmsServiceText" },
    pricing: { title: "תמחור - הערות", field: "pricingFinePrintText" },
    terms: { title: "תנאים", field: "termsText" },
    cancellation: { title: "ביטולים", field: "cancellationText" },
  };

  const sampleQuote = {
    templateId: DEFAULT_TEMPLATE_ID,
    quoteNumber: "VER1",
    quoteDate: "2024-07-08",
    validDays: 30,
    clientCompany: "אל-הר",
    contactName: "אייל בן דיין",
    contactTitle: "יועץ משפטי",
    subject: "הצעת מחיר עבור שימוש במערכת LMS ובלומדות מדף עבור אל-הר",
    signatoryName: "שחר כהן",
    signatoryTitle: "יועץ פיתוח ומכירות למידה דיגיטלית, Improve-IT",
    clientSignerName: "",
    clientSignerTitle: "",
    clientSignerCompany: "",
    clientSignatureDate: "",
    clientSignatureData: "",
    pricingItems: [],
    pricingItemsEdited: false,
    users: 100,
    courseCount: 4,
    courseNames: [],
    pricingPlanLabel: "השכרה - מסלול שנתי",
    pricingIntroText: "",
    additionalUserPrice: 60,
    showTotals: false,
    includeLms: true,
    bilingualCourse: false,
    includeHebrewVoiceover: true,
    includeEnglishVoiceover: false,
    includeTranslation: false,
    pricingOptionLabels: {
      includeLms: "מערכת LMS בענן",
      bilingualCourse: "עברית ואנגלית",
      includeHebrewVoiceover: "קריינות בעברית כלולה",
      includeEnglishVoiceover: "קריינות באנגלית",
      includeTranslation: "תרגום",
    },
    discountPercent: 5,
    discountTitle: "הנחות",
    discountValidUntil: "2024-07-25",
    backgroundText:
      "אל-הר בוחנים בימים אלה את האפשרות לשילוב של לומדות מדף עבור עובדי הארגון, כולל שימוש במערכת LMS.",
    solutionText:
      "הפתרון המוצע מתבסס על לומדות מדף אשר פונה למכנה הרחב של עובדי אל-הר.\n\nכל לומדה תכלול סימולציות ותרגולים במרבית הפרקים אשר יאפשרו לכל לומד להתקדם בקצב שלו תוך יצירת אינטראקציה ועניין במהלך הלימוד, כמו גם תרגום של נהלי העבודה להתמודדויות היומיומיות במידה ואלה נדרשות מן העובד, ופתרון סימולטיבי של מצבים אשר עשויים להתרחש במהלך יום העבודה.\n\nהאתגר המרכזי של תהליך הלימוד הנדרש נמצא ביכולת של העובדים לנתח בעצמם מקרים ודילמות בהתאם לתהליכי העבודה במידה והם נדרשים מעובדי אל-הר ובהתאם להנחיות הארגון.\n\nתהליך בניית הלומדה, סיפור המסגרת המלווה את תהליך הלמידה, החלקים הוויזואליים, כמו גם האינטראקציות האינטראקטיביות של הלומדה מהווים כלי תומך להתמודדות עם האתגר וליישום וביצוע ההתנהגות הנדרשת מן העובדים כאשר הם נדרשים לטפל בבעיות או באירועים באל-הר.",
    ...DEFAULT_SECTION_TEXTS,
    customItems: [],
    showCompanyProfile: true,
    showClients: true,
    showBackground: true,
    showSolution: true,
    showWorkProcess: true,
    showPricing: true,
    showTerms: true,
    showCancellation: true,
  };

  let quote = normalizeQuote(sampleQuote);
  const isClientMode = getHashParam("mode") === "client";

  const form = document.getElementById("quoteForm");
  const preview = document.getElementById("proposalPreview");
  const pricingItems = document.getElementById("pricingItems");
  const courseNamesList = document.getElementById("courseNamesList");
  const sharePanel = document.getElementById("sharePanel");
  const clientLinkOutput = document.getElementById("clientLinkOutput");
  const copyClientLinkButton = document.getElementById("copyClientLink");
  const signedArchivePanel = document.getElementById("signedArchivePanel");
  const signedArchiveList = document.getElementById("signedArchiveList");
  const settingsPanel = document.getElementById("settingsPanel");
  const templateSettingsList = document.getElementById("templateSettingsList");
  const sectionEditor = document.getElementById("sectionEditor");
  const sectionEditorTitle = document.getElementById("sectionEditorTitle");
  const sectionEditorText = document.getElementById("sectionEditorText");
  const closeSectionEditorButton = document.getElementById("closeSectionEditor");
  const resetSectionTextButton = document.getElementById("resetSectionText");
  const appDialog = document.getElementById("appDialog");
  const appDialogTitle = document.getElementById("appDialogTitle");
  const appDialogMessage = document.getElementById("appDialogMessage");
  const appDialogConfirm = document.getElementById("appDialogConfirm");
  const appDialogCancel = document.getElementById("appDialogCancel");
  const signatureCanvas = document.getElementById("clientSignaturePad");
  const clearSignatureButton = document.getElementById("clearSignature");
  let signatureContext = null;
  let signatureIsDrawing = false;
  let signatureLastPoint = null;
  let signatureResizeTimer = null;
  let activeSectionEditorKey = "";

  init();

  async function init() {
    setupSupabase();
    applyTemplateSettings(await readTemplateSettings());
    quote = normalizeQuote(await readInitialQuote());
    document.body.classList.toggle("client-mode", isClientMode);
    populateTemplateOptions();
    renderTemplateSettings();
    populateForm();
    renderCourseNameInputs();
    renderPricingItems();
    setupSignaturePad();
    renderPreview();

    form.addEventListener("input", handleFormInput);
    form.addEventListener("change", handleFormInput);
    courseNamesList.addEventListener("input", handleCourseNameInput);
    document.querySelectorAll("[data-pricing-option-label]").forEach((field) => {
      field.addEventListener("input", handlePricingOptionLabelInput);
    });
    sectionEditorText.addEventListener("input", handleSectionEditorInput);
    closeSectionEditorButton.addEventListener("click", closeSectionEditor);
    resetSectionTextButton.addEventListener("click", resetActiveSectionText);
    document.querySelectorAll("[data-section-edit]").forEach((button) => {
      button.addEventListener("click", () => openSectionEditor(button.dataset.sectionEdit));
    });

    document.getElementById("addPricingItem").addEventListener("click", () => {
      quote.pricingItems.push({ title: "רכיב חדש", price: 0, notes: "", included: false });
      quote.pricingItemsEdited = true;
      renderPricingItems();
      renderPreview();
    });

    document.getElementById("resetPricingItems").addEventListener("click", () => {
      resetPricingItems();
      renderPricingItems();
      renderPreview();
    });

    document.getElementById("resetSample").addEventListener("click", () => {
      quote = normalizeQuote(sampleQuote);
      storageRemove(STORAGE_KEY);
      populateForm();
      renderCourseNameInputs();
      renderPricingItems();
      redrawSignaturePad();
      renderPreview();
    });

    document.getElementById("saveData").addEventListener("click", () => {
      storageSet(STORAGE_KEY, JSON.stringify(quote));
    });

    document.getElementById("createClientLink").addEventListener("click", showClientLink);
    copyClientLinkButton.addEventListener("click", copyClientLink);
    document.getElementById("closeSharePanel").addEventListener("click", () => {
      sharePanel.hidden = true;
    });
    document.getElementById("showSignedArchive").addEventListener("click", showSignedArchive);
    signedArchiveList.addEventListener("click", handleSignedArchiveClick);
    document.getElementById("showSettings").addEventListener("click", showSettings);
    document.getElementById("closeSettings").addEventListener("click", () => {
      settingsPanel.hidden = true;
    });
    document.getElementById("resetTemplateSettings").addEventListener("click", resetTemplateSettings);
    document.getElementById("addTemplateSettings").addEventListener("click", addTemplateSettings);
    templateSettingsList.addEventListener("input", handleTemplateSettingsInput);
    templateSettingsList.addEventListener("change", handleTemplateSettingsInput);
    templateSettingsList.addEventListener("click", handleTemplateSettingsClick);
    document.getElementById("closeSignedArchive").addEventListener("click", () => {
      signedArchivePanel.hidden = true;
    });
    document.getElementById("sendSignedQuote").addEventListener("click", sendSignedQuote);
    document.getElementById("printQuote").addEventListener("click", () => window.print());
    clearSignatureButton.addEventListener("click", clearSignature);
  }

  async function readInitialQuote() {
    const compressedHashData = getHashParam("z");
    if (compressedHashData) {
      try {
        return JSON.parse(await decompressQuotePayload(compressedHashData));
      } catch (error) {
        console.warn("Could not parse compressed quote data from URL hash", error);
      }
    }

    const hashData = getHashParam("data");
    if (hashData) {
      try {
        return JSON.parse(decodeBase64Url(hashData));
      } catch (error) {
        console.warn("Could not parse quote data from URL hash", error);
      }
    }

    try {
      const stored = storageGet(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn("Could not parse stored quote", error);
    }

    return sampleQuote;
  }

  function getHashParam(name) {
    return new URLSearchParams(window.location.hash.replace(/^#/, "")).get(name);
  }

  function normalizeQuote(raw) {
    const hasManualPricingItems = Array.isArray(raw?.pricingItems);
    const merged = { ...sampleQuote, ...(raw || {}) };
    merged.templateId = TEMPLATE_DEFINITIONS[merged.templateId] ? merged.templateId : getFallbackTemplateId();
    merged.validDays = numberOr(merged.validDays, sampleQuote.validDays);
    merged.users = numberOr(merged.users, sampleQuote.users);
    merged.courseCount = Math.max(0, Math.round(numberOr(merged.courseCount, 0)));
    merged.additionalUserPrice = numberOr(merged.additionalUserPrice, sampleQuote.additionalUserPrice);
    merged.discountPercent = numberOr(merged.discountPercent, 0);
    merged.pricingPlanLabel = merged.pricingPlanLabel || sampleQuote.pricingPlanLabel;
    merged.pricingIntroText = merged.pricingIntroText || "";
    merged.pricingOptionLabels = {
      ...sampleQuote.pricingOptionLabels,
      ...(merged.pricingOptionLabels || {}),
    };
    Object.entries(sampleQuote.pricingOptionLabels).forEach(([key, defaultValue]) => {
      if (!String(merged.pricingOptionLabels[key] || "").trim()) {
        merged.pricingOptionLabels[key] = defaultValue;
      }
    });
    Object.entries(DEFAULT_SECTION_TEXTS).forEach(([key, defaultValue]) => {
      merged[key] = typeof merged[key] === "string" ? merged[key] : defaultValue;
    });
    merged.contactTitle = merged.contactTitle || "";
    merged.clientSignerName = merged.clientSignerName || "";
    merged.clientSignerTitle = merged.clientSignerTitle || "";
    merged.clientSignerCompany = merged.clientSignerCompany || "";
    merged.clientSignatureDate = merged.clientSignatureDate || "";
    merged.clientSignatureData = sanitizeSignatureData(merged.clientSignatureData);
    merged.courseNames = Array.isArray(merged.courseNames)
      ? merged.courseNames.map((name) => String(name || "").trim())
      : String(merged.courseNames || "")
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean);
    merged.courseCount = Math.max(merged.courseCount, merged.courseNames.length);
    merged.customItems = Array.isArray(merged.customItems)
      ? merged.customItems.map((item) => ({
          title: item.title || "",
          price: numberOr(item.price, 0),
          notes: item.notes || "",
          included: Boolean(item.included),
        }))
      : [];
    merged.pricingItemsEdited = Boolean(raw?.pricingItemsEdited && hasManualPricingItems);
    merged.pricingItems = hasManualPricingItems
      ? raw.pricingItems.map(normalizePricingItem).filter((item) => item.title)
      : buildDefaultPricingItems(merged).concat(merged.customItems.map(normalizePricingItem));

    [
      "includeLms",
      "bilingualCourse",
      "includeHebrewVoiceover",
      "includeEnglishVoiceover",
      "includeTranslation",
      "showTotals",
      "showCompanyProfile",
      "showClients",
      "showBackground",
      "showSolution",
      "showWorkProcess",
      "showPricing",
      "showTerms",
      "showCancellation",
    ].forEach((key) => {
      merged[key] = toBoolean(merged[key]);
    });

    return merged;
  }

  function populateForm() {
    const fields = form.querySelectorAll("[name]");
    fields.forEach((field) => {
      const value = quote[field.name];
      if (field.type === "checkbox") {
        field.checked = Boolean(value);
      } else if (field.name === "showTotals") {
        field.value = String(Boolean(value));
      } else {
        field.value = value ?? "";
      }
    });
    populatePricingOptionLabels();
  }

  function renderCourseNameInputs() {
    const count = Math.max(0, Math.round(numberOr(quote.courseCount, 0)));
    courseNamesList.innerHTML = count
      ? Array.from({ length: count }, (_, index) => {
          const value = quote.courseNames[index] || "";
          return `
            <label>
              לומדה ${index + 1}
              <input data-course-name-index="${index}" type="text" value="${escapeAttr(value)}" />
            </label>
          `;
        }).join("")
      : `<p class="empty-note">לא הוגדרו לומדות.</p>`;
  }

  function populatePricingOptionLabels() {
    document.querySelectorAll("[data-pricing-option-label]").forEach((field) => {
      field.value = quote.pricingOptionLabels[field.dataset.pricingOptionLabel] || "";
    });
  }

  function populateTemplateOptions() {
    const templateSelect = form.elements.templateId;
    if (!templateSelect) return;

    templateSelect.innerHTML = Object.entries(TEMPLATE_DEFINITIONS)
      .map(
        ([id, template]) =>
          `<option value="${escapeAttr(id)}" title="${escapeAttr(template.description || "")}">${escapeHtml(template.label)}</option>`
      )
      .join("");
  }

  function showSettings() {
    renderTemplateSettings();
    settingsPanel.hidden = false;
    sharePanel.hidden = true;
    signedArchivePanel.hidden = true;
  }

  function renderTemplateSettings() {
    templateSettingsList.innerHTML = Object.entries(TEMPLATE_DEFINITIONS)
      .map(([id, template]) => {
        const sectionDefinitions = template.sectionDefinitions || [];
        return `
          <article class="template-settings-card" data-template-id="${escapeAttr(id)}">
            <div class="template-settings-card-head">
              <h3>${escapeHtml(template.label)}</h3>
              <button type="button" class="compact danger" data-delete-template="${escapeAttr(id)}">מחיקה</button>
            </div>
            <label>
              שם הפורמט
              <input data-template-field="label" type="text" value="${escapeAttr(template.label)}" />
            </label>
            <label>
              תיאור
              <textarea data-template-field="description" rows="2">${escapeHtml(template.description || "")}</textarea>
            </label>
            <label>
              תיאור מסלול ברירת מחדל
              <input data-template-default-text="pricingPlanLabel" type="text" value="${escapeAttr(template.defaults?.pricingPlanLabel || "")}" />
            </label>
            <div class="template-section-settings">
              <div class="template-section-header">
                <span>כותרת הסעיף</span>
                <span>מופיע במסמך</span>
                <span>בתוכן העניינים</span>
              </div>
              ${TEMPLATE_SECTION_OPTIONS.map(([flag, key, defaultTitle]) => {
                const definition = sectionDefinitions.find(([definitionFlag]) => definitionFlag === flag);
                const isShownByDefault = Boolean(template.defaults?.[flag]);
                const isShownInToc = Boolean(isShownByDefault && definition);
                return `
                  <div class="template-section-row">
                    <label>
                      <span class="template-section-title">${escapeHtml(defaultTitle)}</span>
                      <input data-template-section-title="${flag}" type="text" value="${escapeAttr(definition?.[2] || defaultTitle)}" />
                    </label>
                    <label class="template-section-check">
                      <input data-template-default-flag="${flag}" type="checkbox" ${isShownByDefault ? "checked" : ""} />
                      <span>מסמך</span>
                    </label>
                    <label class="template-section-check">
                      <input data-template-toc-flag="${flag}" type="checkbox" ${isShownInToc ? "checked" : ""} ${isShownByDefault ? "" : "disabled"} />
                      <span>תוכן</span>
                    </label>
                  </div>
                `;
              }).join("")}
            </div>
            <button type="button" class="compact" data-apply-template="${escapeAttr(id)}">החל פורמט</button>
          </article>
        `;
      })
      .join("");
  }

  function handleTemplateSettingsInput(event) {
    const card = event.target.closest("[data-template-id]");
    if (!card) return;

    updateTemplateFromSettingsCard(card);
    saveTemplateSettings();
    populateTemplateOptions();
    form.elements.templateId.value = quote.templateId;
    renderPreview();
  }

  function handleTemplateSettingsClick(event) {
    const deleteButton = event.target.closest("[data-delete-template]");
    if (deleteButton) {
      deleteTemplateSettings(deleteButton.dataset.deleteTemplate);
      return;
    }

    const applyButton = event.target.closest("[data-apply-template]");
    if (!applyButton) return;

    quote.templateId = applyButton.dataset.applyTemplate;
    applyTemplateDefaults();
    resetPricingItems();
    populateTemplateOptions();
    populateForm();
    renderCourseNameInputs();
    renderPricingItems();
    renderPreview();
  }

  function addTemplateSettings() {
    const base = JSON.parse(JSON.stringify(getTemplate(quote)));
    const id = `customTemplate${Date.now()}`;
    TEMPLATE_DEFINITIONS[id] = {
      ...base,
      label: "פורמט חדש",
      description: "פורמט מותאם אישית.",
      defaults: { ...(base.defaults || {}) },
      sectionDefinitions: (base.sectionDefinitions || []).map((section) => [...section]),
    };
    quote.templateId = id;
    saveTemplateSettings();
    populateTemplateOptions();
    populateForm();
    renderTemplateSettings();
    renderPreview();
  }

  async function deleteTemplateSettings(id) {
    if (!TEMPLATE_DEFINITIONS[id]) return;
    if (Object.keys(TEMPLATE_DEFINITIONS).length <= 1) {
      await showAppAlert("לא ניתן למחוק", "חייב להישאר לפחות פורמט אחד במחולל.");
      return;
    }

    const confirmed = await showAppConfirm("מחיקת פורמט", `למחוק את הפורמט "${TEMPLATE_DEFINITIONS[id].label}"?`, "מחיקה");
    if (!confirmed) return;

    delete TEMPLATE_DEFINITIONS[id];
    if (quote.templateId === id) {
      quote.templateId = getFallbackTemplateId();
      applyTemplateDefaults();
      resetPricingItems();
    }
    saveTemplateSettings();
    populateTemplateOptions();
    populateForm();
    renderTemplateSettings();
    renderPricingItems();
    renderPreview();
  }

  function updateTemplateFromSettingsCard(card) {
    const id = card.dataset.templateId;
    const template = TEMPLATE_DEFINITIONS[id];
    if (!template) return;

    template.label = card.querySelector('[data-template-field="label"]').value.trim() || DEFAULT_TEMPLATE_SETTINGS[id]?.label || "פורמט";
    template.description = card.querySelector('[data-template-field="description"]').value.trim();
    template.defaults = { ...(template.defaults || {}) };

    card.querySelectorAll("[data-template-default-text]").forEach((field) => {
      template.defaults[field.dataset.templateDefaultText] = field.value;
    });
    card.querySelectorAll("[data-template-default-flag]").forEach((field) => {
      template.defaults[field.dataset.templateDefaultFlag] = field.checked;
      const tocField = card.querySelector(`[data-template-toc-flag="${field.dataset.templateDefaultFlag}"]`);
      if (tocField) {
        tocField.disabled = !field.checked;
        if (!field.checked) tocField.checked = false;
      }
    });

    template.sectionDefinitions = TEMPLATE_SECTION_OPTIONS.reduce((definitions, [flag, key, defaultTitle]) => {
      const includeSection = card.querySelector(`[data-template-default-flag="${flag}"]`)?.checked;
      const includeInToc = card.querySelector(`[data-template-toc-flag="${flag}"]`)?.checked;
      template.defaults[flag] = Boolean(includeSection);
      if (includeSection && includeInToc) {
        const title = card.querySelector(`[data-template-section-title="${flag}"]`)?.value.trim() || defaultTitle;
        definitions.push([flag, key, title]);
      }
      return definitions;
    }, []);
  }

  async function readTemplateSettings() {
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from("template_settings")
          .select("settings")
          .eq("id", "default")
          .maybeSingle();
        if (error) throw error;
        if (data?.settings) {
          storageSet(TEMPLATE_SETTINGS_KEY, JSON.stringify(data.settings));
          return data.settings;
        }
      } catch (error) {
        console.warn("Could not load template settings from Supabase", error);
      }
    }

    try {
      const stored = storageGet(TEMPLATE_SETTINGS_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn("Could not parse template settings", error);
      return null;
    }
  }

  function saveTemplateSettings() {
    storageSet(TEMPLATE_SETTINGS_KEY, JSON.stringify(TEMPLATE_DEFINITIONS));
    saveTemplateSettingsToSupabase(TEMPLATE_DEFINITIONS);
  }

  function applyTemplateSettings(settings) {
    Object.keys(TEMPLATE_DEFINITIONS).forEach((id) => delete TEMPLATE_DEFINITIONS[id]);
    Object.entries(DEFAULT_TEMPLATE_SETTINGS).forEach(([id, defaults]) => {
      const saved = settings?.[id] || {};
      TEMPLATE_DEFINITIONS[id] = {
        ...defaults,
        ...saved,
        defaults: {
          ...(defaults.defaults || {}),
          ...(saved.defaults || {}),
        },
        sectionDefinitions: Array.isArray(saved.sectionDefinitions)
          ? saved.sectionDefinitions
          : defaults.sectionDefinitions,
      };
    });
    Object.entries(settings || {}).forEach(([id, saved]) => {
      if (TEMPLATE_DEFINITIONS[id]) return;
      TEMPLATE_DEFINITIONS[id] = {
        label: saved.label || "פורמט",
        description: saved.description || "",
        defaults: { ...(saved.defaults || {}) },
        sectionDefinitions: Array.isArray(saved.sectionDefinitions) ? saved.sectionDefinitions : [],
      };
    });
  }

  async function resetTemplateSettings() {
    const confirmed = await showAppConfirm("איפוס פורמטים", "להחזיר את הגדרות הפורמטים לברירת המחדל?", "איפוס");
    if (!confirmed) return;

    storageRemove(TEMPLATE_SETTINGS_KEY);
    await resetTemplateSettingsInSupabase();
    applyTemplateSettings(DEFAULT_TEMPLATE_SETTINGS);
    populateTemplateOptions();
    populateForm();
    renderTemplateSettings();
    renderPreview();
  }

  function handleFormInput(event) {
    const field = event.target;
    if (!field.name || field.closest(".custom-item") || field.dataset.pricingOptionLabel) return;
    const shouldRefreshPricingItems = [
      "users",
      "courseCount",
      "includeLms",
      "bilingualCourse",
      "includeHebrewVoiceover",
      "includeEnglishVoiceover",
      "additionalUserPrice",
    ].includes(field.name);

    if (field.name === "templateId") {
      quote.templateId = TEMPLATE_DEFINITIONS[field.value] ? field.value : DEFAULT_TEMPLATE_ID;
      applyTemplateDefaults();
      resetPricingItems();
      populateForm();
      renderCourseNameInputs();
    } else if (field.type === "checkbox") {
      quote[field.name] = field.checked;
    } else if (field.name === "showTotals") {
      quote[field.name] = field.value === "true";
    } else if (field.type === "number") {
      quote[field.name] = numberOr(field.value, 0);
      if (field.name === "courseCount") {
        quote.courseNames = quote.courseNames.slice(0, Math.max(0, Math.round(numberOr(quote.courseCount, 0))));
        renderCourseNameInputs();
      }
    } else {
      quote[field.name] = field.value;
    }

    if (shouldRefreshPricingItems && !quote.pricingItemsEdited) {
      resetPricingItems();
    }

    renderPricingItems();
    renderPreview();
  }

  function handleCourseNameInput(event) {
    const index = Number(event.target.dataset.courseNameIndex);
    if (!Number.isInteger(index)) return;

    const names = Array.from({ length: Math.max(0, Math.round(numberOr(quote.courseCount, 0))) }, (_, itemIndex) => {
      const field = courseNamesList.querySelector(`[data-course-name-index="${itemIndex}"]`);
      return field ? field.value.trim() : quote.courseNames[itemIndex] || "";
    });
    quote.courseNames = names;
    if (!quote.pricingItemsEdited) {
      resetPricingItems();
      renderPricingItems();
    } else if (quote.pricingItems[index]) {
      quote.pricingItems[index].title = buildDefaultCourseTitle(quote, index);
      renderPricingItems();
    }
    renderPreview();
  }

  function handlePricingOptionLabelInput(event) {
    const key = event.target.dataset.pricingOptionLabel;
    if (!key) return;

    quote.pricingOptionLabels[key] = event.target.value;
    if (!quote.pricingItemsEdited) {
      resetPricingItems();
      renderPricingItems();
    }
    renderPreview();
  }

  function openSectionEditor(sectionKey) {
    const config = EDITABLE_SECTIONS[sectionKey];
    if (!config) return;

    activeSectionEditorKey = sectionKey;
    sectionEditorTitle.textContent = `עריכת סעיף: ${config.title}`;
    sectionEditorText.value = getSectionEditorValue(config);
    sectionEditor.hidden = false;
    sectionEditorText.focus();
  }

  function closeSectionEditor() {
    sectionEditor.hidden = true;
    activeSectionEditorKey = "";
  }

  function handleSectionEditorInput() {
    const config = EDITABLE_SECTIONS[activeSectionEditorKey];
    if (!config) return;

    setSectionEditorValue(config, sectionEditorText.value);
    populateSectionFormFields(config);
    renderPreview();
  }

  function resetActiveSectionText() {
    const config = EDITABLE_SECTIONS[activeSectionEditorKey];
    if (!config) return;

    setSectionEditorValue(config, defaultSectionEditorValue(config));
    sectionEditorText.value = getSectionEditorValue(config);
    populateSectionFormFields(config);
    renderPreview();
  }

  function getSectionEditorValue(config) {
    const value = quote[config.field] || "";
    if (!config.extraField) return value;
    return `${value}\n\n--- שירות LMS ---\n${quote[config.extraField] || ""}`.trim();
  }

  function setSectionEditorValue(config, value) {
    if (!config.extraField) {
      quote[config.field] = value;
      return;
    }

    const marker = "--- שירות LMS ---";
    const [main, extra] = value.split(marker);
    quote[config.field] = (main || "").trim();
    quote[config.extraField] = (extra || "").trim();
  }

  function defaultSectionEditorValue(config) {
    const value = DEFAULT_SECTION_TEXTS[config.field] || "";
    if (!config.extraField) return value;
    return `${value}\n\n--- שירות LMS ---\n${DEFAULT_SECTION_TEXTS[config.extraField] || ""}`;
  }

  function populateSectionFormFields(config) {
    [config.field, config.extraField].filter(Boolean).forEach((fieldName) => {
      const field = form.elements[fieldName];
      if (field) field.value = quote[fieldName] || "";
    });
  }

  function applyTemplateDefaults() {
    const template = getTemplate(quote);
    const defaults = template.defaults || {};
    Object.entries(defaults).forEach(([key, value]) => {
      quote[key] = value;
    });
  }

  function renderPricingItems() {
    pricingItems.innerHTML = quote.pricingItems
      .map(
        (item, index) => `
          <div class="custom-item" data-index="${index}">
            <label>
              שם רכיב
              <input data-pricing-field="title" type="text" value="${escapeAttr(item.title)}" />
            </label>
            <label>
              עלות
              <input data-pricing-field="price" type="number" step="1" value="${escapeAttr(item.price)}" />
            </label>
            <button type="button" data-remove="${index}">מחיקה</button>
            <label class="item-notes">
              הערות
              <textarea data-pricing-field="notes" rows="2">${escapeHtml(item.notes)}</textarea>
            </label>
            <label class="item-notes inline-checkbox">
              <input data-pricing-field="included" type="checkbox" ${item.included ? "checked" : ""} />
              <span>כלול במחיר</span>
            </label>
          </div>
        `
      )
      .join("");

    pricingItems.querySelectorAll("[data-pricing-field]").forEach((field) => {
      field.addEventListener("input", updatePricingItem);
      field.addEventListener("change", updatePricingItem);
    });

    pricingItems.querySelectorAll("[data-remove]").forEach((button) => {
      button.addEventListener("click", () => {
        quote.pricingItems.splice(Number(button.dataset.remove), 1);
        quote.pricingItemsEdited = true;
        renderPricingItems();
        renderPreview();
      });
    });
  }

  function updatePricingItem(event) {
    const row = event.target.closest(".custom-item");
    const item = quote.pricingItems[Number(row.dataset.index)];
    const field = event.target.dataset.pricingField;
    if (!item || !field) return;

    if (field === "included") {
      item.included = event.target.checked;
    } else if (field === "price") {
      item.price = numberOr(event.target.value, 0);
    } else {
      item[field] = event.target.value;
    }

    quote.pricingItemsEdited = true;
    renderPreview();
  }

  function resetPricingItems() {
    quote.pricingItems = buildDefaultPricingItems(quote);
    quote.pricingItemsEdited = false;
  }

  async function showClientLink() {
    const createButton = document.getElementById("createClientLink");
    createButton.disabled = true;
    createButton.textContent = "יוצר קישור...";
    resetCopyFeedback();

    try {
      const link = await buildClientLink();
      clientLinkOutput.value = link;
      sharePanel.hidden = false;
      signedArchivePanel.hidden = true;
      const copied = await copyText(link);
      setCopyFeedback(copied ? "הקישור הועתק" : "הקישור מוכן להעתקה");
    } finally {
      createButton.disabled = false;
      createButton.textContent = "קישור ללקוח";
    }
  }

  async function buildClientLink() {
    const encoded = await compressQuotePayload(JSON.stringify(buildShareQuotePayload()));
    return `${getShareBaseUrl()}#mode=client&z=${encoded}`;
  }

  function buildShareQuotePayload() {
    const cleanQuote = normalizeQuote({
      ...quote,
      clientSignatureData: "",
      clientSignerName: "",
      clientSignerTitle: "",
      clientSignerCompany: "",
      clientSignatureDate: "",
    });

    if (!cleanQuote.pricingItemsEdited) {
      delete cleanQuote.pricingItems;
    }

    const payload = {};
    Object.entries(cleanQuote).forEach(([key, value]) => {
      if (!sameShareValue(value, sampleQuote[key])) {
        payload[key] = value;
      }
    });

    return payload;
  }

  function sameShareValue(value, defaultValue) {
    return JSON.stringify(value ?? null) === JSON.stringify(defaultValue ?? null);
  }

  function getShareBaseUrl() {
    if (window.location.protocol === "file:") {
      return window.location.href.split("#")[0];
    }

    return `${window.location.origin}${window.location.pathname}`;
  }

  async function copyClientLink() {
    const copied = await copyText(clientLinkOutput.value);
    setCopyFeedback(copied ? "הועתק!" : "לא הועתק אוטומטית");
  }

  async function copyText(text) {
    if (!text) return false;

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (error) {
        // Fall back to selecting the textarea below.
      }
    }

    if (clientLinkOutput) {
      clientLinkOutput.focus();
      clientLinkOutput.select();
      try {
        return document.execCommand("copy");
      } catch (error) {
        return false;
      }
    }

    return false;
  }

  function setCopyFeedback(message) {
    copyClientLinkButton.textContent = message;
    copyClientLinkButton.classList.add("is-confirmed");
    window.clearTimeout(copyClientLinkButton.feedbackTimer);
    copyClientLinkButton.feedbackTimer = window.setTimeout(resetCopyFeedback, 1800);
  }

  function resetCopyFeedback() {
    window.clearTimeout(copyClientLinkButton.feedbackTimer);
    copyClientLinkButton.textContent = "העתקת קישור";
    copyClientLinkButton.classList.remove("is-confirmed");
  }

  async function sendSignedQuote() {
    if (!quote.clientSignerName.trim()) {
      await showAppAlert("חסרים פרטי חתימה", "יש למלא שם חותם לפני שליחת ההצעה החתומה.");
      return;
    }

    if (!quote.clientSignatureData) {
      await showAppAlert("חסרה חתימה", "יש לחתום דיגיטלית לפני שליחת ההצעה החתומה.");
      return;
    }

    if (!quote.clientSignatureDate) {
      quote.clientSignatureDate = todayIsoDate();
      const dateField = form.elements.clientSignatureDate;
      if (dateField) dateField.value = quote.clientSignatureDate;
    }

    const archive = readSignedArchive();
    const signedRecord = {
      id: `${quote.quoteNumber || "quote"}-${Date.now()}`,
      signedAt: new Date().toISOString(),
      quote: normalizeQuote(quote),
    };
    archive.unshift(signedRecord);
    storageSet(SIGNED_ARCHIVE_KEY, JSON.stringify(archive));
    await saveSignedQuoteToSupabase(signedRecord);
    renderPreview();
    await showAppAlert("ההצעה נשמרה", "ההצעה החתומה נשמרה במאגר ההצעות החתומות המקומי.");
  }

  async function showSignedArchive() {
    await syncSignedArchiveFromSupabase();
    renderSignedArchive();
    signedArchivePanel.hidden = false;
    sharePanel.hidden = true;
  }

  function renderSignedArchive() {
    const archive = readSignedArchive();
    signedArchiveList.innerHTML = archive.length
      ? archive
          .map((record, index) => {
            const signedQuote = record.quote || {};
            return `
              <div class="signed-archive-row">
                <div class="signed-archive-details">
                  <strong>${escapeHtml(signedQuote.clientCompany || "ללא חברה")} - ${escapeHtml(signedQuote.quoteNumber || "ללא מספר")}</strong>
                  <span>חותם: ${escapeHtml(signedQuote.clientSignerName || "לא צוין")}</span>
                  <span>נחתם: ${escapeHtml(formatDateTime(record.signedAt))}</span>
                </div>
                <div class="signed-archive-actions">
                  <button type="button" class="compact" data-open-signed-index="${index}">פתיחה</button>
                  <button type="button" class="compact" data-download-signed-index="${index}">הורדה</button>
                  <button type="button" class="compact danger" data-delete-signed-index="${index}">מחיקה</button>
                </div>
              </div>
            `;
          })
          .join("")
      : `<p class="empty-note">עדיין אין הצעות חתומות במאגר המקומי.</p>`;
  }

  async function handleSignedArchiveClick(event) {
    const deleteButton = event.target.closest("[data-delete-signed-index]");
    if (deleteButton) {
      await deleteSignedArchiveRecord(Number(deleteButton.dataset.deleteSignedIndex));
      return;
    }

    const downloadButton = event.target.closest("[data-download-signed-index]");
    if (downloadButton) {
      loadSignedArchiveRecord(Number(downloadButton.dataset.downloadSignedIndex));
      window.setTimeout(() => window.print(), 250);
      return;
    }

    const openButton = event.target.closest("[data-open-signed-index]");
    if (!openButton) return;

    loadSignedArchiveRecord(Number(openButton.dataset.openSignedIndex));
  }

  function loadSignedArchiveRecord(index) {
    const archive = readSignedArchive();
    const record = archive[index];
    if (!record?.quote) return false;

    quote = normalizeQuote(record.quote);
    storageSet(STORAGE_KEY, JSON.stringify(quote));
    populateForm();
    renderCourseNameInputs();
    renderPricingItems();
    redrawSignaturePad();
    renderPreview();
    signedArchivePanel.hidden = true;
    sharePanel.hidden = true;
    preview.scrollIntoView({ block: "start" });
    return true;
  }

  async function deleteSignedArchiveRecord(index) {
    const archive = readSignedArchive();
    const record = archive[index];
    if (!record) return;

    const signedQuote = record.quote || {};
    const label = `${signedQuote.clientCompany || "ללא חברה"} - ${signedQuote.quoteNumber || "ללא מספר"}`;
    const shouldDelete = await showAppConfirm(
      "מחיקת הצעה חתומה",
      `למחוק את ההצעה החתומה "${label}" מהמאגר?`,
      "מחיקה"
    );
    if (!shouldDelete) return;

    archive.splice(index, 1);
    storageSet(SIGNED_ARCHIVE_KEY, JSON.stringify(archive));
    await deleteSignedQuoteFromSupabase(record.id);
    renderSignedArchive();
  }

  function showAppAlert(title, message) {
    return showAppDialog({ title, message, confirmText: "אישור", showCancel: false });
  }

  function showAppConfirm(title, message, confirmText = "אישור") {
    return showAppDialog({ title, message, confirmText, showCancel: true });
  }

  function showAppDialog({ title, message, confirmText, showCancel }) {
    appDialogTitle.textContent = title;
    appDialogMessage.innerHTML = `<p>${escapeHtml(message)}</p>`;
    appDialogConfirm.textContent = confirmText;
    appDialogCancel.hidden = !showCancel;
    appDialog.hidden = false;
    appDialogConfirm.focus();

    return new Promise((resolve) => {
      const close = (result) => {
        appDialog.hidden = true;
        appDialogConfirm.removeEventListener("click", onConfirm);
        appDialogCancel.removeEventListener("click", onCancel);
        appDialog.removeEventListener("click", onBackdrop);
        document.removeEventListener("keydown", onKeydown);
        resolve(result);
      };
      const onConfirm = () => close(true);
      const onCancel = () => close(false);
      const onBackdrop = (event) => {
        if (event.target === appDialog && showCancel) close(false);
      };
      const onKeydown = (event) => {
        if (event.key === "Escape") close(false);
      };

      appDialogConfirm.addEventListener("click", onConfirm);
      appDialogCancel.addEventListener("click", onCancel);
      appDialog.addEventListener("click", onBackdrop);
      document.addEventListener("keydown", onKeydown);
    });
  }

  function readSignedArchive() {
    try {
      const stored = storageGet(SIGNED_ARCHIVE_KEY);
      const archive = stored ? JSON.parse(stored) : [];
      return Array.isArray(archive) ? archive : [];
    } catch (error) {
      console.warn("Could not parse signed archive", error);
      return [];
    }
  }

  function setupSupabase() {
    const config = window.IMPROVE_IT_SUPABASE || {};
    if (!config.url || !config.anonKey || !window.supabase?.createClient) return;

    supabaseClient = window.supabase.createClient(config.url, config.anonKey);
  }

  async function syncSignedArchiveFromSupabase() {
    if (!supabaseClient) return;

    try {
      const { data, error } = await supabaseClient
        .from("signed_quotes")
        .select("id,signed_at,quote")
        .order("signed_at", { ascending: false });
      if (error) throw error;

      const archive = (data || []).map((record) => ({
        id: record.id,
        signedAt: record.signed_at,
        quote: record.quote,
      }));
      storageSet(SIGNED_ARCHIVE_KEY, JSON.stringify(archive));
    } catch (error) {
      console.warn("Could not load signed archive from Supabase", error);
    }
  }

  async function saveSignedQuoteToSupabase(record) {
    if (!supabaseClient) return;

    try {
      const { error } = await supabaseClient.from("signed_quotes").upsert({
        id: record.id,
        signed_at: record.signedAt,
        quote: record.quote,
      });
      if (error) throw error;
    } catch (error) {
      console.warn("Could not save signed quote to Supabase", error);
    }
  }

  async function deleteSignedQuoteFromSupabase(id) {
    if (!supabaseClient || !id) return;

    try {
      const { error } = await supabaseClient.from("signed_quotes").delete().eq("id", id);
      if (error) throw error;
    } catch (error) {
      console.warn("Could not delete signed quote from Supabase", error);
    }
  }

  async function saveTemplateSettingsToSupabase(settings) {
    if (!supabaseClient) return;

    try {
      const { error } = await supabaseClient.from("template_settings").upsert({
        id: "default",
        settings,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
    } catch (error) {
      console.warn("Could not save template settings to Supabase", error);
    }
  }

  async function resetTemplateSettingsInSupabase() {
    if (!supabaseClient) return;

    try {
      const { error } = await supabaseClient.from("template_settings").delete().eq("id", "default");
      if (error) throw error;
    } catch (error) {
      console.warn("Could not reset template settings in Supabase", error);
    }
  }

  function storageGet(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      return memoryStorage.get(key) || null;
    }
  }

  function storageSet(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (error) {
      memoryStorage.set(key, value);
    }
  }

  function storageRemove(key) {
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      memoryStorage.delete(key);
    }
  }

  function setupSignaturePad() {
    if (!signatureCanvas) return;

    signatureContext = signatureCanvas.getContext("2d");
    resizeSignatureCanvas();
    window.addEventListener("resize", queueSignatureResize);

    signatureCanvas.addEventListener("pointerdown", beginSignatureStroke);
    signatureCanvas.addEventListener("pointermove", continueSignatureStroke);
    signatureCanvas.addEventListener("pointerup", endSignatureStroke);
    signatureCanvas.addEventListener("pointercancel", endSignatureStroke);
  }

  function queueSignatureResize() {
    window.clearTimeout(signatureResizeTimer);
    signatureResizeTimer = window.setTimeout(resizeSignatureCanvas, 120);
  }

  function resizeSignatureCanvas() {
    if (!signatureCanvas || !signatureContext) return;

    const rect = signatureCanvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const dpr = window.devicePixelRatio || 1;
    signatureCanvas.width = Math.round(rect.width * dpr);
    signatureCanvas.height = Math.round(rect.height * dpr);
    signatureContext.setTransform(dpr, 0, 0, dpr, 0, 0);
    signatureContext.lineWidth = 2.4;
    signatureContext.lineCap = "round";
    signatureContext.lineJoin = "round";
    signatureContext.strokeStyle = "#111820";
    redrawSignaturePad();
  }

  function redrawSignaturePad() {
    if (!signatureCanvas || !signatureContext) return;

    const rect = signatureCanvas.getBoundingClientRect();
    signatureContext.clearRect(0, 0, rect.width, rect.height);

    if (!quote.clientSignatureData) return;

    const signatureImage = new Image();
    signatureImage.onload = () => {
      signatureContext.clearRect(0, 0, rect.width, rect.height);
      signatureContext.drawImage(signatureImage, 0, 0, rect.width, rect.height);
    };
    signatureImage.src = quote.clientSignatureData;
  }

  function beginSignatureStroke(event) {
    if (!signatureContext) return;

    event.preventDefault();
    signatureCanvas.setPointerCapture(event.pointerId);
    signatureIsDrawing = true;
    signatureLastPoint = getSignaturePoint(event);
    signatureContext.beginPath();
    signatureContext.moveTo(signatureLastPoint.x, signatureLastPoint.y);
  }

  function continueSignatureStroke(event) {
    if (!signatureIsDrawing || !signatureLastPoint) return;

    event.preventDefault();
    const point = getSignaturePoint(event);
    signatureContext.beginPath();
    signatureContext.moveTo(signatureLastPoint.x, signatureLastPoint.y);
    signatureContext.lineTo(point.x, point.y);
    signatureContext.stroke();
    signatureLastPoint = point;
  }

  function endSignatureStroke(event) {
    if (!signatureIsDrawing) return;

    event.preventDefault();
    signatureIsDrawing = false;
    signatureLastPoint = null;
    quote.clientSignatureData = signatureCanvas.toDataURL("image/png");

    if (!quote.clientSignatureDate) {
      quote.clientSignatureDate = todayIsoDate();
      const dateField = form.elements.clientSignatureDate;
      if (dateField) dateField.value = quote.clientSignatureDate;
    }

    renderPreview();
  }

  function getSignaturePoint(event) {
    const rect = signatureCanvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function clearSignature() {
    quote.clientSignatureData = "";
    redrawSignaturePad();
    renderPreview();
  }

  function renderPreview() {
    preview.innerHTML = renderQuote(quote);
    window.requestAnimationFrame(fitPagesToFooter);
  }

  function renderQuote(data) {
    const q = normalizeQuote(data);
    const sections = buildSectionIndex(q);
    const pages = [renderCoverPage(q, sections)];

    if (q.showCompanyProfile) pages.push(renderCompanyPage(q, sections));
    if (q.showClients) pages.push(renderClientsPage(q));
    if (q.showBackground || q.showSolution) pages.push(renderBackgroundSolutionPage(q, sections));
    if (q.showWorkProcess) pages.push(renderWorkProcessPage(q, sections));
    if (q.showPricing) pages.push(renderPricingPage(q, sections));
    if (q.showTerms || q.showCancellation) pages.push(renderTermsPage(q, sections));

    return pages.join("");
  }

  function renderCoverPage(q, sections) {
    const serviceDescription = buildServiceDescription(q);
    const greetingName = (q.contactName || "").split(/\s+/)[0] || q.contactName || "שלום";
    const contactTitle = q.contactTitle ? `<br />${escapeHtml(q.contactTitle)}` : "";
    const toc = sections
      .map(
        (section) => `
          <tr>
            <td>${section.number}</td>
            <td><a href="#${sectionId(section.key)}">${escapeHtml(section.title)}</a></td>
          </tr>
        `
      )
      .join("");

    return page(`
      <p class="date-line">${formatDate(q.quoteDate)}</p>
      <p class="recipient">לכבוד<br />${escapeHtml(q.contactName)}${contactTitle}<br />${escapeHtml(q.clientCompany)}</p>
      <p>${escapeHtml(greetingName)} שלום רב,</p>
      <div class="subject">הנדון: ${escapeHtml(q.subject)}</div>
      <p>תודה על פנייתך לקבלת הצעת מחיר ל${escapeHtml(serviceDescription)} עבור ${escapeHtml(q.clientCompany)}, להלן הצעתנו:</p>
      <p>המסמך שלהלן כולל את:</p>
      <table class="toc"><tbody>${toc}</tbody></table>
      <div class="signature-block">
        <p>בברכה,</p>
        <strong>${escapeHtml(q.signatoryName)}</strong>
        <span>${escapeHtml(q.signatoryTitle)}</span>
      </div>
    `, "cover-page");
  }

  function renderCompanyPage(q, sections) {
    return page(`
      <section class="content-section" id="${sectionId("profile")}">
        <h1 class="page-title">${sectionTitle(sections, "profile")}</h1>
        ${paragraphs(q.companyProfileText)}
        <div class="accent-band">
          <strong>Improve-IT משלבת מתודולוגיה וטכנולוגיה לשיפור ביצועים בארגונים.</strong>
          <span>אנו מלווים ארגונים ואת מחלקות ההדרכה ביצירת הקשר שבין תשתיות הפיתוח הארגוני וההדרכה לבין התוצאות העסקיות, בכלים ובפרקטיקות שעובדות בארגונים.</span>
        </div>
        <img class="method-diagram" src="assets/brand/method-diagram.png" alt="" />
      </section>
    `);
  }

  function renderClientsPage(q) {
    return page(`
      <section class="content-section" id="${sectionId("clients")}">
        <h1 class="page-title">${escapeHtml(q.clientsText || "מבין לקוחותינו")}</h1>
        <img class="clients-image" src="assets/brand/client-logos.png" alt="לקוחות Improve-IT" />
      </section>
    `);
  }

  function renderBackgroundSolutionPage(q, sections) {
    const blocks = [];
    if (q.showBackground) {
      blocks.push(`
        <section class="content-section" id="${sectionId("background")}">
          <h1 class="page-title">${sectionTitle(sections, "background")}</h1>
          ${paragraphs(q.backgroundText)}
        </section>
      `);
    }

    if (q.showSolution) {
      blocks.push(`
        <section class="content-section" id="${sectionId("solution")}">
          <h1 class="page-title">${sectionTitle(sections, "solution")}</h1>
          ${paragraphs(q.solutionText)}
        </section>
      `);
    }

    return page(blocks.join(""));
  }

  function renderWorkProcessPage(q, sections) {
    const processBullets = lines(q.workProcessText);

    if (q.includeHebrewVoiceover || q.includeEnglishVoiceover) {
      processBullets.push("קריינות: לאחר אישור הלומדה הסופית תצא הלומדה לקריינות ולהטמעת הקריינות.");
      processBullets.push("תיקוף הקריינות: תיקוף ואישור הקריינות.");
    }

    if (q.includeTranslation) {
      processBullets.push("תרגום: לאחר אישור הלומדה הסופית תצא הלומדה לתרגום ולהטמעת התרגום.");
      processBullets.push("תיקוף התרגום: תיקוף ואישור התרגום.");
    }

    const lmsBlock = q.includeLms
      ? `
        <section class="content-section">
          <h2>שירות LMS</h2>
          <ul class="bullet-list">
            ${lines(q.lmsServiceText).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
          </ul>
        </section>
      `
      : "";

    return page(`
      <section class="content-section" id="${sectionId("work")}">
        <h1 class="page-title">${sectionTitle(sections, "work")}</h1>
        <ul class="bullet-list">
          ${processBullets.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
      </section>
      ${lmsBlock}
    `);
  }

  function renderPricingPage(q, sections) {
    const pricing = buildPricing(q);
    const planRow = q.pricingPlanLabel
      ? `<tr class="pricing-plan-row"><td colspan="3">${escapeHtml(q.pricingPlanLabel)}</td></tr>`
      : "";
    const rows = pricing.rows
      .map(
        (row) => `
          <tr>
            <td>${escapeHtml(row.title)}</td>
            <td class="price">${row.included ? "כלול" : formatCurrency(row.price)}</td>
            <td class="notes">${formatNotes(row.notes || "")}</td>
          </tr>
        `
      )
      .join("");

    const discountRow = pricing.discount
      ? `
        <tr class="discount-row">
          <td>${escapeHtml(q.discountTitle || "הנחה")}</td>
          <td class="price">${q.showTotals ? `-${formatCurrency(pricing.discount)}` : ""}</td>
          <td class="notes">${formatNotes(buildDiscountNote(q))}</td>
        </tr>
      `
      : "";
    const totalTable = q.showTotals
      ? `
        <table class="total-table">
          <tbody>
            <tr>
              <td>סה"כ לפני הנחות</td>
              <td>${formatCurrency(pricing.subtotal)}</td>
            </tr>
            ${
              pricing.discount
                ? `<tr><td>הנחה</td><td>-${formatCurrency(pricing.discount)}</td></tr>`
                : ""
            }
            <tr>
              <td>סה"כ לתשלום</td>
              <td>${formatCurrency(pricing.total)}</td>
            </tr>
          </tbody>
        </table>
      `
      : "";

    return page(`
      <section class="content-section" id="${sectionId("pricing")}">
        <h1 class="page-title">${sectionTitle(sections, "pricing")}</h1>
        <div class="pricing-intro">${formatNotes(buildPricingIntro(q))}</div>
        <table class="pricing-table">
          <thead>
            <tr>
              <th>הרכיב</th>
              <th>עלות</th>
              <th>הערות</th>
            </tr>
          </thead>
          <tbody>
            ${planRow}
            ${rows}
            ${discountRow}
          </tbody>
        </table>
        ${totalTable}
        <ul class="fine-print">
          ${buildPricingFinePrint(q).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
      </section>
    `, "pricing-page");
  }

  function fitPagesToFooter() {
    preview.querySelectorAll(".quote-page").forEach((pageElement) => {
      const content = pageElement.querySelector(".quote-content");
      const footer = pageElement.querySelector(".quote-footer");
      if (!content || !footer) return;

      pageElement.classList.remove("quote-page--compact", "quote-page--dense");

      if (isContentOverFooter(content, footer)) {
        pageElement.classList.add("quote-page--compact");
      }

      if (isContentOverFooter(content, footer)) {
        pageElement.classList.add("quote-page--dense");
      }
    });
  }

  function isContentOverFooter(content, footer) {
    const contentRect = content.getBoundingClientRect();
    const footerRect = footer.getBoundingClientRect();
    return contentRect.bottom > footerRect.top - 16;
  }

  function renderTermsPage(q, sections) {
    const termsTitle = sectionTitle(sections, "terms") || "תנאים כלליים";
    const cancellationTitle = sectionTitle(sections, "cancellation") || "נהלי ביטולים ועיכובים";

    const payment = q.showTerms
      ? `
        <section class="content-section" id="${sectionId("terms")}">
          <h1 class="page-title">${termsTitle}</h1>
          <p><strong>תנאי תשלום לשירות לומדה בענן:</strong> שוטף + 30.</p>
          ${q.includeLms ? "<p>מסלול שנתי: תשלום מראש לשנה עם העברת הזמנת עבודה.</p>" : ""}
          <p>הצעת המחיר תהיה בתוקף למשך ${escapeHtml(q.validDays)} ימים מהוצאתה.</p>
          <ol class="terms-list">
            ${lines(q.termsText).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
          </ol>
        </section>
      `
      : "";

    const cancellation = q.showCancellation
      ? `
        <section class="content-section" id="${sectionId("cancellation")}">
          <h2>${cancellationTitle}</h2>
          <ol class="terms-list">
            ${lines(q.cancellationText).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
          </ol>
        </section>
      `
      : "";

    return page(`
      ${payment}
      ${cancellation}
      <div class="approval-line">אני מאשר/ת את הסכמתי לתנאים המצוינים במסמך זה</div>
      ${renderClientApproval(q)}
    `);
  }

  function renderClientApproval(q) {
    const signature = q.clientSignatureData
      ? `<img src="${escapeAttr(q.clientSignatureData)}" alt="חתימת לקוח" />`
      : "<strong>&nbsp;</strong>";
    const signerTitle = q.clientSignerTitle ? `<span>${escapeHtml(q.clientSignerTitle)}</span>` : "";
    const signerCompany = q.clientSignerCompany ? `<span>${escapeHtml(q.clientSignerCompany)}</span>` : "";
    const signatureDate = q.clientSignatureDate ? formatShortDate(q.clientSignatureDate) : "";

    return `
      <div class="client-approval">
        <div class="approval-field">
          <span>שם</span>
          <strong>${escapeHtml(q.clientSignerName) || "&nbsp;"}</strong>
          ${signerTitle}
          ${signerCompany}
        </div>
        <div class="approval-field signature">
          <span>חתימה</span>
          ${signature}
        </div>
        <div class="approval-field">
          <span>תאריך</span>
          <strong>${escapeHtml(signatureDate) || "&nbsp;"}</strong>
        </div>
      </div>
      <p class="approval-note">החתימה הדיגיטלית נשמרת כחלק מנתוני ההצעה ותופיע בקובץ ה-PDF.</p>
    `;
  }

  function page(content, pageClass = "") {
    const className = ["quote-page", pageClass].filter(Boolean).join(" ");
    return `<article class="${className}">${renderHeader()}<main class="quote-content">${content}</main>${renderFooter()}</article>`;
  }

  function renderHeader() {
    return `
      <header class="quote-header">
        <img src="assets/brand/improve-it-logo.png" alt="Improve-IT" />
        <div class="header-ribbon">פיתוח הדרכה | למידה דיגיטלית | תהליכי הכשרה | סרטוני הדרכה</div>
      </header>
    `;
  }

  function renderFooter() {
    return `
      <footer class="quote-footer" aria-label="פרטי יצירת קשר">
        <span class="footer-item"><img src="assets/brand/icon-location.png" alt="" />בזל 3, פתח תקווה</span>
        <span class="footer-item"><img src="assets/brand/icon-web.png" alt="" />www.improve-it.co.il</span>
        <span class="footer-item"><span class="footer-symbol">@</span>ziv@improve-it.co.il</span>
        <span class="footer-item"><img src="assets/brand/icon-phone.png" alt="" />073-7858198</span>
      </footer>
    `;
  }

  function buildSectionIndex(q) {
    const definitions = getTemplate(q).sectionDefinitions;

    return definitions
      .filter(([flag]) => q[flag])
      .map(([, key, title], index) => ({ key, title, number: index + 1 }));
  }

  function getTemplate(q) {
    return TEMPLATE_DEFINITIONS[q.templateId] || TEMPLATE_DEFINITIONS[getFallbackTemplateId()];
  }

  function getFallbackTemplateId() {
    return TEMPLATE_DEFINITIONS[DEFAULT_TEMPLATE_ID] ? DEFAULT_TEMPLATE_ID : Object.keys(TEMPLATE_DEFINITIONS)[0];
  }

  function sectionTitle(sections, key) {
    const section = sections.find((item) => item.key === key);
    return section ? `${section.number}. ${section.title}` : "";
  }

  function sectionId(key) {
    return `quote-section-${key}`;
  }

  function buildServiceDescription(q) {
    const pieces = ["שימוש בלומדות מדף"];
    if (q.includeLms) pieces.push(`כולל ${pricingOptionLabel(q, "includeLms", "מערכת LMS")}`);
    if (q.includeTranslation) pieces.push(`ו${pricingOptionLabel(q, "includeTranslation", "תרגום")}`);
    return pieces.join(" ");
  }

  function buildPricing(q) {
    const rows = q.pricingItems.map(normalizePricingItem).filter((item) => item.title);
    const subtotal = rows.reduce((sum, row) => (row.included ? sum : sum + numberOr(row.price, 0)), 0);
    const discount = q.discountPercent > 0 ? Math.round((subtotal * q.discountPercent) / 100) : 0;
    return {
      rows,
      subtotal,
      discount,
      total: Math.max(0, subtotal - discount),
    };
  }

  function buildDefaultPricingItems(q) {
    const coursePrices = [6000, 3500, 2250, 2250];
    const courseCount = Math.max(q.courseCount, q.courseNames.length);
    const rows = Array.from({ length: courseCount }, (_, index) => {
      return {
        title: buildDefaultCourseTitle(q, index),
        price: coursePrices[index] || coursePrices[coursePrices.length - 1],
        notes:
          index === 0
            ? [
                "כולל הוספת לוגו, שם לקוח וממונה.",
                "לא כולל שינוי בעיצוב גרפי.",
                q.bilingualCourse ? "ההצעה ללומדות בשפות עברית ואנגלית." : "ההצעה ללומדות בשפה העברית בלבד.",
                "תשלום מראש לשנה והתחייבות לשנה.",
                q.includeLms
                  ? `הוספת עובדים תתבצע במרוכז אחת לחודש בעלות של ${formatCurrency(q.additionalUserPrice)} לכל עובד נוסף.`
                  : "",
              ]
                .filter(Boolean)
                .join("\n")
            : "",
        included: false,
      };
    });

    if (q.includeHebrewVoiceover) {
      rows.push({
        title: pricingOptionLabel(q, "includeHebrewVoiceover", "התאמת קריינות בעברית"),
        price: 450,
        notes: "המחיר כולל את הקריינות עצמה ואת התאמת הקריינות ללומדה.\nהמחיר מתייחס ללומדה אחת.",
        included: false,
      });
    }

    if (q.includeEnglishVoiceover) {
      rows.push({
        title: pricingOptionLabel(q, "includeEnglishVoiceover", "התאמת קריינות באנגלית"),
        price: 600,
        notes: "אופציונלי.",
        included: false,
      });
    }

    if (q.includeLms) {
      rows.push({
        title: pricingOptionLabel(q, "includeLms", "הקמת סביבה וניהול דו\"חות"),
        price: 0,
        notes: "הדוחות יסופקו פעם בחודש.",
        included: true,
      });
    }

    return rows.map(normalizePricingItem);
  }

  function buildDefaultCourseTitle(q, index) {
    const name = q.courseNames[index] || "";
    const namedSuffix = name && !/^לומד(?:ה|ת)\s+מדף\s*\d+$/i.test(name) ? ` - ${name}` : "";
    return `לומדת מדף ${index + 1}${q.includeLms ? ` במערכת LMS עבור ${q.users} עובדים לשנה` : ""}${namedSuffix}`;
  }

  function pricingOptionLabel(q, key, fallback) {
    return q.pricingOptionLabels?.[key]?.trim() || fallback;
  }

  function normalizePricingItem(item) {
    return {
      title: item?.title || "",
      price: numberOr(item?.price, 0),
      notes: item?.notes || "",
      included: Boolean(item?.included),
    };
  }

  function describeCourses(q) {
    const namedCourses = q.courseNames.filter(Boolean);
    if (namedCourses.length) return namedCourses.join(", ");
    if (q.courseCount === 1) return "לומדת מדף אחת";
    return `${q.courseCount} לומדות מדף`;
  }

  function buildPricingIntro(q) {
    const customIntro = String(q.pricingIntroText || "").trim();
    if (customIntro) return customIntro;
    return "כותרת טבלת תמחור";
  }

  function buildDiscountNote(q) {
    const percent = q.discountPercent ? `תינתן הנחה של ${q.discountPercent}%` : "תינתן הנחה";
    if (!q.discountValidUntil) return percent;
    return `${percent} במידה ותתקבל הזמנת עבודה עד ה-${formatDotDate(q.discountValidUntil)}`;
  }

  function paragraphs(text) {
    const parts = String(text || "")
      .split(/\n{2,}/)
      .map((part) => part.trim())
      .filter(Boolean);

    if (!parts.length) return `<p class="empty-note">לא הוזן תוכן לסעיף זה.</p>`;
    return parts.map((part) => `<p>${escapeHtml(part).replace(/\n/g, "<br />")}</p>`).join("");
  }

  function lines(text) {
    return String(text || "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  }

  function buildPricingFinePrint(q) {
    const translationLine = "המחיר אינו כולל תרגום הלומדה לשפות.";
    const lmsLine = "לא תתאפשר מחיקת משתמשים לאחר עליית הפרויקט לאוויר. במסלול השנתי ניתן לעדכן משתמשים אחת לחודש קלנדרי.";

    return lines(q.pricingFinePrintText).filter((line) => {
      if (q.includeTranslation && line === translationLine) return false;
      if (!q.includeLms && line === lmsLine) return false;
      return true;
    });
  }

  function formatNotes(text) {
    return escapeHtml(text).replace(/\n/g, "<br />");
  }

  function formatCurrency(value) {
    const amount = new Intl.NumberFormat("he-IL", { maximumFractionDigits: 0 }).format(numberOr(value, 0));
    return `${amount} ₪`;
  }

  function formatDate(value) {
    if (!value) return "";
    const [year, month, day] = value.split("-");
    const monthNames = [
      "ינואר",
      "פברואר",
      "מרץ",
      "אפריל",
      "מאי",
      "יוני",
      "יולי",
      "אוגוסט",
      "ספטמבר",
      "אוקטובר",
      "נובמבר",
      "דצמבר",
    ];
    return `${String(Number(day)).padStart(2, "0")} ${monthNames[Number(month) - 1] || ""} ${year}`;
  }

  function formatShortDate(value) {
    if (!value) return "";
    return new Intl.DateTimeFormat("he-IL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(`${value}T00:00:00`));
  }

  function formatDateTime(value) {
    if (!value) return "";
    return new Intl.DateTimeFormat("he-IL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  }

  function formatDotDate(value) {
    if (!value) return "";
    const [year, month, day] = value.split("-");
    return `${Number(day)}.${Number(month)}.${year}`;
  }

  function numberOr(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function toBoolean(value) {
    if (value === "false" || value === "0" || value === 0 || value === null) return false;
    return Boolean(value);
  }

  function sanitizeSignatureData(value) {
    const data = String(value || "");
    return /^data:image\/png;base64,[a-z0-9+/=]+$/i.test(data) ? data : "";
  }

  function todayIsoDate() {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 10);
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

  function decodeBase64Url(value) {
    const bytes = decodeBase64UrlToBytes(value);
    return new TextDecoder().decode(bytes);
  }

  function encodeBase64Url(value) {
    const bytes = new TextEncoder().encode(value);
    return encodeBytesBase64Url(bytes);
  }

  function decodeBase64UrlToBytes(value) {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
    const binary = atob(padded);
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
  }

  function encodeBytesBase64Url(bytes) {
    let binary = "";
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  async function compressQuotePayload(json) {
    if (!("CompressionStream" in window)) {
      return encodeBase64Url(json);
    }

    const stream = new Blob([json], { type: "application/json" }).stream().pipeThrough(new CompressionStream("gzip"));
    const compressed = new Uint8Array(await new Response(stream).arrayBuffer());
    return encodeBytesBase64Url(compressed);
  }

  async function decompressQuotePayload(value) {
    if (!("DecompressionStream" in window)) {
      return decodeBase64Url(value);
    }

    const bytes = decodeBase64UrlToBytes(value);
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    return new Response(stream).text();
  }
})();
