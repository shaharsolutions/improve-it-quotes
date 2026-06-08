(function () {
  const STORAGE_KEY = "improve-it-quote-generator";
  const GENERATOR_AUTH_KEY = "improve-it-generator-authenticated";
  const GENERATOR_PASSWORD = "improve-it2026";
  const SIGNED_ARCHIVE_KEY = "improve-it-signed-quotes";
  const QUOTE_TRACKING_KEY = "improve-it-quote-tracking";
  const TEMPLATE_SETTINGS_KEY = "improve-it-template-settings";
  const SALESPERSON_SETTINGS_KEY = "improve-it-salesperson-settings";
  const CLIENT_LOGO_SETTINGS_KEY = "improve-it-client-logo-settings";
  const LOCAL_SIGNED_ARCHIVE_URL = "http://localhost:4173/api/signed-archive";
  const LOCAL_SHARED_QUOTE_URL = "http://localhost:4173/api/shared-quotes";
  const GENERATOR_DOCUMENT_TITLE = "מחולל הצעות מחיר | Improve-IT";
  const DEFAULT_CLIENT_COMPANY = "ארגון לדוגמה";
  const SUBJECT_PLACEHOLDER = "{subject}";
  const DEFAULT_SUBJECT_LINE_TEMPLATE = `הנדון: ${SUBJECT_PLACEHOLDER}`;
  const DEFAULT_COURSE_COUNT = 3;
  const LEGACY_DEFAULT_COURSE_COUNT = 4;
  const DEFAULT_SUBJECT_PREFIX = "הצעת מחיר עבור שימוש במערכת LMS ובלומדות מדף עבור ";
  const DEFAULT_SALESPERSON_SETTINGS = {
    selectedId: "default",
    advisors: [
      {
        id: "default",
        name: "איש קשר לדוגמה",
        title: "תפקיד לדוגמה, Improve-IT",
      },
    ],
  };
  const LMS_SINGLE_COURSE_TIERS = [
    { minUsers: 1, maxUsers: 60, price: 2940, perUser: 49 },
    { minUsers: 61, maxUsers: 90, price: 3600, perUser: 40 },
    { minUsers: 91, maxUsers: 120, price: 3840, perUser: 32 },
    { minUsers: 121, maxUsers: 150, price: 4050, perUser: 27 },
    { minUsers: 151, maxUsers: 180, price: 4500, perUser: 25 },
    { minUsers: 181, maxUsers: 210, price: 4620, perUser: 22 },
    { minUsers: 211, maxUsers: 250, price: 4875, perUser: 19.5 },
    { minUsers: 251, maxUsers: 300, price: 5250, perUser: 17.5 },
    { minUsers: 301, maxUsers: 350, price: 5775, perUser: 16.5 },
    { minUsers: 351, maxUsers: 400, price: 6600, perUser: 16.5 },
    { minUsers: 401, maxUsers: 450, price: 6975, perUser: 15.5 },
    { minUsers: 451, maxUsers: 500, price: 7500, perUser: 15 },
    { minUsers: 501, maxUsers: 550, price: 8525, perUser: 15.5 },
    { minUsers: 551, maxUsers: 600, price: 8850, perUser: 14.75 },
    { minUsers: 601, maxUsers: 650, price: 9100, perUser: 14 },
    { minUsers: 651, maxUsers: 700, price: 9450, perUser: 13.5 },
    { minUsers: 701, maxUsers: 750, price: 9750, perUser: 13 },
    { minUsers: 751, maxUsers: 800, price: 9950, perUser: 12.4 },
    { minUsers: 801, maxUsers: 850, price: 10200, perUser: 12 },
    { minUsers: 851, maxUsers: 900, price: 10800, perUser: 12 },
    { minUsers: 901, maxUsers: 950, price: 10925, perUser: 11.5 },
    { minUsers: 951, maxUsers: 1000, price: 11500, perUser: 11.5 },
  ];
  const LMS_THREE_COURSE_PACKAGE_TIERS = [
    { minUsers: 121, maxUsers: 150, price: 6450 },
    { minUsers: 151, maxUsers: 180, price: 6900 },
    { minUsers: 181, maxUsers: 210, price: 7020 },
    { minUsers: 211, maxUsers: 250, price: 7275 },
    { minUsers: 251, maxUsers: 300, price: 7650 },
    { minUsers: 301, maxUsers: 350, price: 8175 },
  ];
  const SHELF_COURSE_GROUP_A_PACKAGE_PRICES = {
    1: 4900,
    2: 7500,
    3: 8900,
  };
  const SHELF_COURSE_GROUP_B_PACKAGE_PRICES = {
    1: 5500,
    2: 8500,
    3: 10500,
  };
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
        subjectLabel: DEFAULT_SUBJECT_LINE_TEMPLATE,
        pricingPlanLabel: "השכרה - מסלול שנתי",
      },
      sectionDefinitions: [
        ["showCompanyProfile", "profile", "פרופיל חברה"],
        ["showClients", "clients", "לקוחות"],
        ["showBackground", "background", "רקע"],
        ["showSolution", "solution", "הפתרון המוצע - כללי"],
        ["showWorkProcess", "work", "תהליך העבודה המוצע"],
        ["showPricing", "pricing", "תמחור ותכולת ההצעה"],
        ["showTerms", "terms", "תנאים כלליים"],
        ["showCancellation", "cancellation", "נהלי ביטולים ועיכובים"],
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
        subjectLabel: DEFAULT_SUBJECT_LINE_TEMPLATE,
        pricingPlanLabel: "תמחור מסחרי",
      },
      sectionDefinitions: [
        ["showBackground", "background", "רקע"],
        ["showSolution", "solution", "הפתרון המוצע"],
        ["showPricing", "pricing", "תמחור"],
        ["showTerms", "terms", "תנאים"],
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
  const LEGACY_CLIENT_LOGOS_SRC = "assets/brand/client-logos.png";
  const DEFAULT_CLIENT_LOGOS = [
    { name: "מאוחדת", src: "assets/brand/client-logos/meuhedet.png" },
    { name: "כללית", src: "assets/brand/client-logos/clalit.png" },
    { name: "משרד הבריאות", src: "assets/brand/client-logos/ministry-health.png" },
    { name: "משרד הפנים", src: "assets/brand/client-logos/ministry-interior.png" },
    { name: "משטרת ישראל", src: "assets/brand/client-logos/israel-police.png" },
    { name: "ניצני הקריה", src: "assets/brand/client-logos/nitzanei-hakirya.png" },
    { name: "כבאות והצלה לישראל", src: "assets/brand/client-logos/fire-rescue.png" },
    { name: 'המרכז הרפואי תל-אביב ע"ש סוראסקי', src: "assets/brand/client-logos/sourasky-medical-center.png" },
    { name: "ICL", src: "assets/brand/client-logos/icl.png" },
    { name: "תנובה", src: "assets/brand/client-logos/tnuva.png" },
    { name: "סופר-פארם", src: "assets/brand/client-logos/super-pharm.png" },
    { name: "OPHIR Optics", src: "assets/brand/client-logos/ophir-optics.png" },
    { name: "הפניקס", src: "assets/brand/client-logos/phoenix.png" },
    { name: "שקל", src: "assets/brand/client-logos/shekel-group.png" },
    { name: "שלמה ביטוח", src: "assets/brand/client-logos/shlomo-insurance.png" },
    { name: "אל על", src: "assets/brand/client-logos/elal.png" },
    { name: "אלקטרה", src: "assets/brand/client-logos/electra.png" },
    { name: "אבן קיסר", src: "assets/brand/client-logos/caesarstone.png" },
    { name: "איתוראן", src: "assets/brand/client-logos/ituran.png" },
    { name: "IKEA", src: "assets/brand/client-logos/ikea.png" },
    { name: "דואר ישראל", src: "assets/brand/client-logos/israel-post.png" },
    { name: "טבע", src: "assets/brand/client-logos/teva.png" },
    { name: "amdocs", src: "assets/brand/client-logos/amdocs.png" },
    { name: "הראל", src: "assets/brand/client-logos/harel.png" },
    { name: "בנק הפועלים", src: "assets/brand/client-logos/bank-hapoalim.png" },
    { name: "דיסקונט", src: "assets/brand/client-logos/discount.png?v=20260601-crop" },
    { name: "קבוצת בזן", src: "assets/brand/client-logos/bazan.png?v=20260601-crop", size: 135 },
  ];
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
    quoteDate: "",
    validDays: 30,
    clientCompany: DEFAULT_CLIENT_COMPANY,
    contactName: "איש קשר לדוגמה",
    contactTitle: "תפקיד לדוגמה",
    subject: buildDefaultSubject(DEFAULT_CLIENT_COMPANY),
    subjectLabel: DEFAULT_SUBJECT_LINE_TEMPLATE,
    signatoryName: DEFAULT_SALESPERSON_SETTINGS.advisors[0].name,
    signatoryTitle: DEFAULT_SALESPERSON_SETTINGS.advisors[0].title,
    clientSignerName: "",
    clientSignerTitle: "",
    clientSignerCompany: "",
    clientSignatureDate: "",
    clientSignatureData: "",
    clientLogos: DEFAULT_CLIENT_LOGOS.map((logo) => ({ ...logo })),
    pricingItemsEdited: false,
    users: 100,
    courseCount: DEFAULT_COURSE_COUNT,
    courseNames: [],
    courseGroups: [],
    pricingPlanLabel: "השכרה - מסלול שנתי",
    rentalStartDate: "",
    rentalEndDate: "",
    pricingIntroText: "",
    additionalUserPrice: 60,
    showTotals: false,
    mergeCourseNotes: false,
    includeLms: true,
    bilingualCourse: false,
    includeHebrewVoiceover: true,
    includeEnglishVoiceover: false,
    includeTranslation: false,
    pricingOptionLabels: {
      includeLms: "מערכת LMS בענן",
      bilingualCourse: "עברית ואנגלית",
      includeHebrewVoiceover: "קריינות בעברית",
      includeEnglishVoiceover: "קריינות באנגלית",
      includeTranslation: "תרגום",
    },
    discountPercent: 0,
    discountDisplayMode: "percent",
    discountTitle: "הנחות",
    discountValidUntil: "2024-07-31",
    backgroundText:
      "ארגון לדוגמה בוחן בימים אלה את האפשרות לשילוב של לומדות מדף עבור עובדי הארגון, כולל שימוש במערכת LMS.",
    solutionText:
      "הפתרון המוצע מתבסס על לומדות מדף אשר פונה למכנה הרחב של עובדי ארגון לדוגמה.\n\nכל לומדה תכלול סימולציות ותרגולים במרבית הפרקים אשר יאפשרו לכל לומד להתקדם בקצב שלו תוך יצירת אינטראקציה ועניין במהלך הלימוד, כמו גם תרגום של נהלי העבודה להתמודדויות היומיומיות במידה ואלה נדרשות מן העובד, ופתרון סימולטיבי של מצבים אשר עשויים להתרחש במהלך יום העבודה.\n\nהאתגר המרכזי של תהליך הלימוד הנדרש נמצא ביכולת של העובדים לנתח בעצמם מקרים ודילמות בהתאם לתהליכי העבודה במידה והם נדרשים מעובדי ארגון לדוגמה ובהתאם להנחיות הארגון.\n\nתהליך בניית הלומדה, סיפור המסגרת המלווה את תהליך הלמידה, החלקים הוויזואליים, כמו גם האינטראקציות האינטראקטיביות של הלומדה מהווים כלי תומך להתמודדות עם האתגר וליישום וביצוע ההתנהגות הנדרשת מן העובדים כאשר הם נדרשים לטפל בבעיות או באירועים בארגון לדוגמה.",
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
  let salespersonSettings = normalizeSalespersonSettings();
  let clientLogoSettings = DEFAULT_CLIENT_LOGOS.map((logo) => ({ ...logo }));
  let clientLogoSaveTimer = null;
  const isClientMode = getHashParam("mode") === "client";
  const isPdfMode = getHashParam("pdf") === "1";

  const authScreen = document.getElementById("authScreen");
  const authForm = document.getElementById("authForm");
  const authPasswordField = document.getElementById("authPassword");
  const toggleAuthPasswordButton = document.getElementById("toggleAuthPassword");
  const authRememberField = document.getElementById("authRemember");
  const authError = document.getElementById("authError");
  const form = document.getElementById("quoteForm");
  const saveDataButton = document.getElementById("saveData");
  const preview = document.getElementById("proposalPreview");
  const pricingItems = document.getElementById("pricingItems");
  const courseNamesList = document.getElementById("courseNamesList");
  const sharePanel = document.getElementById("sharePanel");
  const clientLinkOutput = document.getElementById("clientLinkOutput");
  const copyClientLinkButton = document.getElementById("copyClientLink");
  const signedArchivePanel = document.getElementById("signedArchivePanel");
  const signedArchiveList = document.getElementById("signedArchiveList");
  const signedArchiveSearchField = document.getElementById("signedArchiveSearch");
  const quoteTrackingPanel = document.getElementById("quoteTrackingPanel");
  const quoteTrackingList = document.getElementById("quoteTrackingList");
  const quoteTrackingSearchField = document.getElementById("quoteTrackingSearch");
  const settingsPanel = document.getElementById("settingsPanel");
  const salespersonSelectField = document.getElementById("salespersonSelect");
  const salespersonNameField = document.getElementById("salespersonName");
  const salespersonTitleField = document.getElementById("salespersonTitle");
  const templateSettingsList = document.getElementById("templateSettingsList");
  const sectionEditor = document.getElementById("sectionEditor");
  const sectionEditorTitle = document.getElementById("sectionEditorTitle");
  const sectionEditorText = document.getElementById("sectionEditorText");
  const clientLogosEditor = document.getElementById("clientLogosEditor");
  const clientLogosList = document.getElementById("clientLogosList");
  const addClientLogoButton = document.getElementById("addClientLogo");
  const closeSectionEditorButton = document.getElementById("closeSectionEditor");
  const resetSectionTextButton = document.getElementById("resetSectionText");
  const appDialog = document.getElementById("appDialog");
  const appDialogTitle = document.getElementById("appDialogTitle");
  const appDialogMessage = document.getElementById("appDialogMessage");
  const appDialogClose = document.getElementById("appDialogClose");
  const appDialogConfirm = document.getElementById("appDialogConfirm");
  const appDialogCancel = document.getElementById("appDialogCancel");
  const appDialogExtra = document.getElementById("appDialogExtra");
  const priceListDialog = document.getElementById("priceListDialog");
  const priceListContent = document.getElementById("priceListContent");
  const closePriceListButton = document.getElementById("closePriceList");
  const signatureCanvas = document.getElementById("clientSignaturePad");
  const clearSignatureButton = document.getElementById("clearSignature");
  let signatureContext = null;
  let signatureIsDrawing = false;
  let signatureLastPoint = null;
  let signatureResizeTimer = null;
  let activeSectionEditorKey = "";
  let activeSharedQuoteId = "";

  start();

  function start() {
    if (requiresGeneratorAuth() && !isGeneratorAuthenticated()) {
      setupAuthScreen();
      return;
    }

    unlockGenerator();
    init();
  }

  function requiresGeneratorAuth() {
    return !isClientMode && !isPdfMode;
  }

  function isGeneratorAuthenticated() {
    try {
      return (
        window.sessionStorage.getItem(GENERATOR_AUTH_KEY) === "1" ||
        window.localStorage.getItem(GENERATOR_AUTH_KEY) === "1"
      );
    } catch (error) {
      return false;
    }
  }

  function setupAuthScreen() {
    document.body.classList.add("auth-required");
    authScreen.hidden = false;
    authForm.addEventListener("submit", handleAuthSubmit);
    toggleAuthPasswordButton.addEventListener("click", toggleAuthPasswordVisibility);
    window.setTimeout(() => authPasswordField.focus(), 0);
  }

  function toggleAuthPasswordVisibility() {
    const shouldShow = authPasswordField.type === "password";
    authPasswordField.type = shouldShow ? "text" : "password";
    toggleAuthPasswordButton.textContent = shouldShow ? "הסתר" : "הצג";
    toggleAuthPasswordButton.setAttribute("aria-pressed", String(shouldShow));
    authPasswordField.focus();
  }

  function handleAuthSubmit(event) {
    event.preventDefault();
    if (authPasswordField.value !== GENERATOR_PASSWORD) {
      authError.hidden = false;
      authPasswordField.select();
      return;
    }

    try {
      const storage = authRememberField.checked ? window.localStorage : window.sessionStorage;
      storage.setItem(GENERATOR_AUTH_KEY, "1");
    } catch (error) {
      // Authentication still applies for the current page even if browser storage is unavailable.
    }

    authError.hidden = true;
    unlockGenerator();
    init();
  }

  function unlockGenerator() {
    document.body.classList.remove("auth-required");
    authScreen.hidden = true;
  }

  async function init() {
    setupSupabase();
    applyTemplateSettings(await readTemplateSettings());
    clientLogoSettings = await readClientLogoSettings();
    salespersonSettings = await readSalespersonSettings();
    quote = normalizeQuote(await readInitialQuote());
    if (isClientMode) {
      updateClientSignatureDateToToday();
      updateClientDocumentTitle();
    }
    if (!isClientMode) {
      document.title = GENERATOR_DOCUMENT_TITLE;
      applySalespersonSettingsToQuote();
      applyClientLogoSettingsToQuote();
    }
    document.body.classList.toggle("client-mode", isClientMode);
    populateTemplateOptions();
    populateSalespersonSettingsForm();
    renderTemplateSettings();
    populateForm();
    renderCourseNameInputs();
    renderPricingItems();
    setupSignaturePad();
    setupFloatingSignatureJump();
    renderPreview();

    preview.addEventListener("click", handlePreviewSectionLinkClick);
    form.addEventListener("input", handleFormInput);
    form.addEventListener("change", handleFormInput);
    courseNamesList.addEventListener("input", handleCourseNameInput);
    document.querySelectorAll("[data-pricing-option-label]").forEach((field) => {
      field.addEventListener("input", handlePricingOptionLabelInput);
    });
    sectionEditorText.addEventListener("input", handleSectionEditorInput);
    closeSectionEditorButton.addEventListener("click", closeSectionEditor);
    resetSectionTextButton.addEventListener("click", resetActiveSectionText);
    addClientLogoButton.addEventListener("click", addClientLogo);
    clientLogosList.addEventListener("input", handleClientLogoInput);
    clientLogosList.addEventListener("change", handleClientLogoInput);
    clientLogosList.addEventListener("click", handleClientLogoClick);
    document.querySelectorAll("[data-section-edit]").forEach((button) => {
      button.addEventListener("click", () => openSectionEditor(button.dataset.sectionEdit));
    });
    document.querySelector(".topbar-actions").addEventListener("click", handleTopbarActionClick, { capture: true });

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

    document.getElementById("showPriceList").addEventListener("click", showPriceList);
    closePriceListButton.addEventListener("click", closePriceList);
    priceListDialog.addEventListener("click", (event) => {
      if (event.target === priceListDialog) closePriceList();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !priceListDialog.hidden) closePriceList();
    });

    document.getElementById("resetSample").addEventListener("click", () => {
      setActiveSharedQuoteId("");
      quote = normalizeQuote(sampleQuote);
      applySalespersonSettingsToQuote();
      applyClientLogoSettingsToQuote();
      storageRemove(STORAGE_KEY);
      populateForm();
      renderCourseNameInputs();
      renderPricingItems();
      redrawSignaturePad();
      renderPreview();
    });

    saveDataButton.addEventListener("click", saveCurrentQuote);

    document.getElementById("createClientLink").addEventListener("click", showClientLink);
    copyClientLinkButton.addEventListener("click", copyClientLink);
    document.getElementById("closeSharePanel").addEventListener("click", () => {
      sharePanel.hidden = true;
    });
    document.getElementById("showSignedArchive").addEventListener("click", showSignedArchive);
    signedArchiveSearchField.addEventListener("input", renderSignedArchive);
    signedArchiveList.addEventListener("click", handleSignedArchiveClick);
    document.getElementById("showQuoteTracking").addEventListener("click", showQuoteTracking);
    quoteTrackingSearchField.addEventListener("input", renderQuoteTracking);
    quoteTrackingList.addEventListener("click", handleQuoteTrackingClick);
    document.getElementById("closeQuoteTracking").addEventListener("click", () => {
      quoteTrackingPanel.hidden = true;
    });
    document.getElementById("showSettings").addEventListener("click", showSettings);
    document.getElementById("logoutGenerator").addEventListener("click", logoutGenerator);
    document.getElementById("closeSettings").addEventListener("click", () => {
      settingsPanel.hidden = true;
    });
    document.getElementById("resetTemplateSettings").addEventListener("click", resetTemplateSettings);
    salespersonSelectField.addEventListener("change", handleSalespersonSelectionChange);
    salespersonNameField.addEventListener("input", handleSalespersonSettingsInput);
    salespersonTitleField.addEventListener("input", handleSalespersonSettingsInput);
    salespersonNameField.addEventListener("change", handleSalespersonSettingsCommit);
    salespersonTitleField.addEventListener("change", handleSalespersonSettingsCommit);
    document.getElementById("addSalespersonSettings").addEventListener("click", addSalespersonSettings);
    document.getElementById("deleteSalespersonSettings").addEventListener("click", deleteSalespersonSettings);
    document.getElementById("resetSalespersonSettings").addEventListener("click", resetSalespersonSettings);
    document.getElementById("addTemplateSettings").addEventListener("click", addTemplateSettings);
    templateSettingsList.addEventListener("input", handleTemplateSettingsInput);
    templateSettingsList.addEventListener("change", handleTemplateSettingsInput);
    templateSettingsList.addEventListener("click", handleTemplateSettingsClick);
    document.getElementById("closeSignedArchive").addEventListener("click", () => {
      signedArchivePanel.hidden = true;
    });
    document.getElementById("jumpToSignature").addEventListener("click", scrollToClientSignature);
    document.getElementById("sendSignedQuote").addEventListener("click", sendSignedQuote);
    document.getElementById("printQuote").addEventListener("click", showPrintPdfChoice);
    clearSignatureButton.addEventListener("click", clearSignature);

    if (getHashParam("pdf") === "1" && !isClientMode) {
      clearPdfAutoOpenFlag();
      window.setTimeout(openPrintDialog, 350);
    }

  }

  async function readInitialQuote() {
    const sharedQuoteId = getHashParam("id");
    if (sharedQuoteId) {
      const sharedQuote = await readSharedQuote(sharedQuoteId);
      if (sharedQuote) {
        setActiveSharedQuoteId(sharedQuoteId);
        if (isClientMode) recordSharedQuoteOpen(sharedQuoteId);
        return sharedQuote;
      }
    }

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

  function updateClientDocumentTitle() {
    document.title = isClientMode ? buildClientDocumentTitle(quote) : GENERATOR_DOCUMENT_TITLE;
  }

  function buildClientDocumentTitle(sourceQuote) {
    const subject = String(sourceQuote?.subject || "").trim();
    const clientCompany = String(sourceQuote?.clientCompany || "").trim();
    let title = subject || (clientCompany ? `הצעת מחיר עבור ${clientCompany}` : "הצעת מחיר");

    if (clientCompany && !title.includes(clientCompany)) {
      title = `${title} - ${clientCompany}`;
    }

    return `${title} | Improve-IT`;
  }

  function normalizeQuote(raw, options = {}) {
    const shouldSyncDefaultTexts = options.syncDefaultTexts !== false;
    const hasManualPricingItems = Boolean(raw?.pricingItemsEdited && Array.isArray(raw?.pricingItems));
    const shouldMigrateLegacyCourseCount = isLegacyDefaultCourseCount(raw);
    let merged = { ...sampleQuote, ...(raw || {}) };
    if (shouldSyncDefaultTexts) {
      merged = applyDefaultCompanyReferences(merged, raw || {});
    }
    if (subjectMatchesDefaultCompany(merged.subject, DEFAULT_CLIENT_COMPANY) && merged.clientCompany !== DEFAULT_CLIENT_COMPANY) {
      merged.subject = buildDefaultSubject(merged.clientCompany);
    }
    merged.subjectLabel = normalizeSubjectLineTemplate(merged.subjectLabel);
    merged.templateId = TEMPLATE_DEFINITIONS[merged.templateId] ? merged.templateId : getFallbackTemplateId();
    merged.quoteDate = parseIsoDate(merged.quoteDate) ? merged.quoteDate : todayIsoDate();
    merged.validDays = numberOr(merged.validDays, sampleQuote.validDays);
    merged.users = numberOr(merged.users, sampleQuote.users);
    merged.courseCount = shouldMigrateLegacyCourseCount
      ? DEFAULT_COURSE_COUNT
      : Math.max(0, Math.round(numberOr(merged.courseCount, 0)));
    merged.additionalUserPrice = numberOr(merged.additionalUserPrice, sampleQuote.additionalUserPrice);
    merged.discountPercent = numberOr(merged.discountPercent, 0);
    merged.discountDisplayMode = ["percent", "amount"].includes(merged.discountDisplayMode)
      ? merged.discountDisplayMode
      : sampleQuote.discountDisplayMode;
    merged.discountValidUntil = monthEndIsoDate(merged.quoteDate);
    merged.pricingPlanLabel = merged.pricingPlanLabel || sampleQuote.pricingPlanLabel;
    merged.rentalStartDate = parseIsoDate(merged.rentalStartDate) ? merged.rentalStartDate : "";
    merged.rentalEndDate = parseIsoDate(merged.rentalEndDate) ? merged.rentalEndDate : "";
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
    merged.clientLogos = normalizeClientLogos(merged.clientLogos);
    merged.courseNames = Array.isArray(merged.courseNames)
      ? merged.courseNames.map((name) => String(name || "").trim())
      : String(merged.courseNames || "")
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean);
    merged.courseGroups = Array.isArray(merged.courseGroups)
      ? merged.courseGroups.map(normalizeCourseGroup)
      : [];
    merged.courseCount = Math.max(merged.courseCount, merged.courseNames.length, merged.courseGroups.length);
    merged.courseGroups = Array.from({ length: merged.courseCount }, (_, index) =>
      normalizeCourseGroup(merged.courseGroups[index])
    );
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
      "mergeCourseNotes",
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

  function isLegacyDefaultCourseCount(raw) {
    if (!raw || numberOr(raw.courseCount, 0) !== LEGACY_DEFAULT_COURSE_COUNT || raw.pricingItemsEdited) return false;

    const courseNames = Array.isArray(raw.courseNames)
      ? raw.courseNames
      : String(raw.courseNames || "").split(/\r?\n/);

    return courseNames.every((name) => !String(name || "").trim());
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
    updateRentalDateConstraints();
    populatePricingOptionLabels();
  }

  function updateRentalDateConstraints() {
    const startField = form.elements.rentalStartDate;
    const endField = form.elements.rentalEndDate;
    if (!startField || !endField) return;

    startField.max = quote.rentalEndDate || "";
    endField.min = quote.rentalStartDate || "";
  }

  function renderCourseNameInputs() {
    const count = Math.max(0, Math.round(numberOr(quote.courseCount, 0)));
    courseNamesList.innerHTML = count
      ? Array.from({ length: count }, (_, index) => {
          const value = quote.courseNames[index] || "";
          const group = normalizeCourseGroup(quote.courseGroups[index]);
          return `
            <div class="course-name-row">
              <label>
                לומדה ${index + 1}
                <input data-course-name-index="${index}" type="text" value="${escapeAttr(value)}" />
              </label>
              <label>
                קבוצה
                <select data-course-group-index="${index}">
                  <option value="A" ${group === "A" ? "selected" : ""}>קבוצה A</option>
                  <option value="B" ${group === "B" ? "selected" : ""}>קבוצה B</option>
                </select>
              </label>
            </div>
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
    populateSalespersonSettingsForm();
    renderTemplateSettings();
    settingsPanel.hidden = false;
    sharePanel.hidden = true;
    signedArchivePanel.hidden = true;
    quoteTrackingPanel.hidden = true;
  }

  function handleTopbarActionClick(event) {
    if (!event.target.closest("button, .action-button")) return;
    scrollPageToTop();
  }

  async function saveCurrentQuote() {
    storageSet(STORAGE_KEY, JSON.stringify(quote));

    if (!activeSharedQuoteId) return;

    saveDataButton.disabled = true;
    saveDataButton.textContent = "שומר קישור...";

    try {
      const payload = buildShareQuotePayload();
      const saved = await updateSharedQuote(activeSharedQuoteId, payload);
      if (!saved) throw new Error("Shared quote update failed");
      await showAppAlert("הקישור עודכן", "ההצעה המקושרת לקישור נשמרה בהצלחה.");
    } catch (error) {
      console.error("Could not update shared quote", error);
      await showAppAlert("לא ניתן לשמור קישור", "לא הצלחנו לעדכן את ההצעה המקושרת. נסו שוב בעוד רגע.");
    } finally {
      saveDataButton.disabled = false;
      updateActiveSharedQuoteUi();
    }
  }

  function setActiveSharedQuoteId(id) {
    activeSharedQuoteId = id || "";
    updateActiveSharedQuoteUi();
  }

  function updateActiveSharedQuoteUi() {
    saveDataButton.textContent = activeSharedQuoteId ? "שמירת קישור" : "שמירה";
  }

  function logoutGenerator() {
    try {
      window.sessionStorage.removeItem(GENERATOR_AUTH_KEY);
      window.localStorage.removeItem(GENERATOR_AUTH_KEY);
    } catch (error) {
      // Reload below still returns the page to the auth gate for storage-restricted sessions.
    }

    window.location.reload();
  }

  function scrollPageToTop() {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }

  function normalizeSalespersonSettings(raw = {}) {
    raw = raw || {};
    const rawAdvisors = Array.isArray(raw.advisors)
      ? raw.advisors
      : raw.name || raw.title
        ? [raw]
        : DEFAULT_SALESPERSON_SETTINGS.advisors;
    const advisors = rawAdvisors.map(normalizeSalespersonAdvisor).filter((advisor) => advisor.name);
    if (!advisors.length) {
      advisors.push(...DEFAULT_SALESPERSON_SETTINGS.advisors.map(normalizeSalespersonAdvisor));
    }
    const selectedId = advisors.some((advisor) => advisor.id === raw.selectedId) ? raw.selectedId : advisors[0].id;
    return { selectedId, advisors };
  }

  function normalizeSalespersonAdvisor(raw = {}) {
    const fallback = DEFAULT_SALESPERSON_SETTINGS.advisors[0];
    const name = String(raw.name || fallback.name).trim();
    return {
      id: String(raw.id || createId("salesperson")).trim(),
      name,
      title: String(raw.title || fallback.title).trim(),
    };
  }

  function selectedSalespersonAdvisor(settings = salespersonSettings) {
    const source = settings?.advisors ? settings : normalizeSalespersonSettings(settings);
    return source.advisors.find((advisor) => advisor.id === source.selectedId) || source.advisors[0];
  }

  async function readSalespersonSettings() {
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from("salesperson_settings")
          .select("settings")
          .eq("id", "default")
          .maybeSingle();
        if (error) throw error;
        if (data?.settings) {
          const settings = normalizeSalespersonSettings(data.settings);
          storageSet(SALESPERSON_SETTINGS_KEY, JSON.stringify(settings));
          return settings;
        }

        const defaultSettings = normalizeSalespersonSettings();
        await saveSalespersonSettingsToSupabase(defaultSettings);
        storageSet(SALESPERSON_SETTINGS_KEY, JSON.stringify(defaultSettings));
        return defaultSettings;
      } catch (error) {
        console.warn("Could not load salesperson settings from Supabase", error);
      }
    }

    try {
      const stored = storageGet(SALESPERSON_SETTINGS_KEY);
      return normalizeSalespersonSettings(stored ? JSON.parse(stored) : null);
    } catch (error) {
      console.warn("Could not parse salesperson settings", error);
      return normalizeSalespersonSettings();
    }
  }

  function saveSalespersonSettings() {
    salespersonSettings = normalizeSalespersonSettings(salespersonSettings);
    storageSet(SALESPERSON_SETTINGS_KEY, JSON.stringify(salespersonSettings));
    saveSalespersonSettingsToSupabase(salespersonSettings);
  }

  function populateSalespersonSettingsForm() {
    const selectedAdvisor = selectedSalespersonAdvisor();
    salespersonSelectField.innerHTML = salespersonSettings.advisors
      .map((advisor) => `<option value="${escapeAttr(advisor.id)}">${escapeHtml(advisor.name)}</option>`)
      .join("");
    salespersonSelectField.value = salespersonSettings.selectedId;
    salespersonNameField.value = selectedAdvisor.name;
    salespersonTitleField.value = selectedAdvisor.title;
  }

  function applySalespersonSettingsToQuote() {
    const selectedAdvisor = selectedSalespersonAdvisor();
    quote.signatoryName = selectedAdvisor.name;
    quote.signatoryTitle = selectedAdvisor.title;
  }

  function handleSalespersonSelectionChange() {
    salespersonSettings.selectedId = salespersonSelectField.value;
    saveSalespersonSettings();
    populateSalespersonSettingsForm();
    applySalespersonSettingsToQuote();
    populateForm();
    renderPreview();
  }

  function handleSalespersonSettingsInput() {
    const selectedAdvisor = selectedSalespersonAdvisor();
    selectedAdvisor.name = salespersonNameField.value;
    selectedAdvisor.title = salespersonTitleField.value;
    updateSelectedSalespersonOptionLabel();
    applySalespersonSettingsToQuote();
    populateForm();
    renderPreview();
  }

  function handleSalespersonSettingsCommit() {
    saveSalespersonSettings();
    populateSalespersonSettingsForm();
    applySalespersonSettingsToQuote();
    populateForm();
    renderPreview();
  }

  function updateSelectedSalespersonOptionLabel() {
    const selectedAdvisor = selectedSalespersonAdvisor();
    const selectedOption = Array.from(salespersonSelectField.options).find((option) => option.value === selectedAdvisor.id);
    if (selectedOption) {
      selectedOption.textContent = selectedAdvisor.name.trim() || DEFAULT_SALESPERSON_SETTINGS.advisors[0].name;
    }
  }

  function addSalespersonSettings() {
    const advisor = {
      id: createId("salesperson"),
      name: "יועץ מכירות חדש",
      title: "תפקיד, Improve-IT",
    };
    salespersonSettings.advisors.push(advisor);
    salespersonSettings.selectedId = advisor.id;
    saveSalespersonSettings();
    populateSalespersonSettingsForm();
    applySalespersonSettingsToQuote();
    populateForm();
    renderPreview();
    salespersonNameField.focus();
    salespersonNameField.select();
  }

  async function deleteSalespersonSettings() {
    if (salespersonSettings.advisors.length <= 1) {
      await showAppAlert("לא ניתן למחוק", "חייב להישאר לפחות יועץ מכירות אחד.");
      return;
    }

    const selectedAdvisor = selectedSalespersonAdvisor();
    const confirmed = await showAppConfirm("מחיקת יועץ מכירות", `למחוק את "${selectedAdvisor.name}" מהרשימה?`, "מחיקה");
    if (!confirmed) return;

    salespersonSettings.advisors = salespersonSettings.advisors.filter((advisor) => advisor.id !== selectedAdvisor.id);
    salespersonSettings.selectedId = salespersonSettings.advisors[0].id;
    saveSalespersonSettings();
    populateSalespersonSettingsForm();
    applySalespersonSettingsToQuote();
    populateForm();
    renderPreview();
  }

  function resetSalespersonSettings() {
    salespersonSettings = normalizeSalespersonSettings();
    saveSalespersonSettings();
    populateSalespersonSettingsForm();
    applySalespersonSettingsToQuote();
    populateForm();
    renderPreview();
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
              כותרת הנדון ברירת מחדל
              <input data-template-default-text="subjectLabel" type="text" value="${escapeAttr(subjectLineSettingsDisplayValue(template.defaults?.subjectLabel))}" />
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
      const key = field.dataset.templateDefaultText;
      template.defaults[key] = key === "subjectLabel" ? subjectLineTemplateFromSettingsValue(field.value) : field.value;
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
    const previousCompany = quote.clientCompany;
    const previousSubject = quote.subject;
    const shouldRefreshPricingItems = [
      "users",
      "courseCount",
      "includeLms",
      "bilingualCourse",
      "includeHebrewVoiceover",
      "includeEnglishVoiceover",
      "includeTranslation",
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
        const courseCount = Math.max(0, Math.round(numberOr(quote.courseCount, 0)));
        quote.courseNames = quote.courseNames.slice(0, courseCount);
        quote.courseGroups = Array.from({ length: courseCount }, (_, index) =>
          normalizeCourseGroup(quote.courseGroups[index])
        );
        renderCourseNameInputs();
      }
    } else {
      quote[field.name] = field.value;
    }

    if (field.name === "clientCompany" && shouldSyncSubjectForCompanyChange(previousSubject, previousCompany)) {
      quote.subject = buildDefaultSubject(quote.clientCompany);
      if (form.elements.subject) {
        form.elements.subject.value = quote.subject;
      }
    }

    if (field.name === "clientCompany") {
      syncDefaultSectionTextsForCompanyChange(previousCompany);
    }

    if (field.name === "quoteDate") {
      quote.discountValidUntil = monthEndIsoDate(quote.quoteDate);
      if (form.elements.discountValidUntil) {
        form.elements.discountValidUntil.value = quote.discountValidUntil;
      }
    }

    if (field.name === "rentalStartDate" || field.name === "rentalEndDate") {
      updateRentalDateConstraints();
    }

    if (field.name === "signatoryName" || field.name === "signatoryTitle") {
      const selectedAdvisor = selectedSalespersonAdvisor();
      selectedAdvisor.name = quote.signatoryName;
      selectedAdvisor.title = quote.signatoryTitle;
      saveSalespersonSettings();
      populateSalespersonSettingsForm();
    }

    if (["templateId", "courseCount", "includeLms"].includes(field.name)) {
      syncPriceListDiscount();
      populateForm();
    }

    if (shouldRefreshPricingItems) {
      resetPricingItems();
    }

    renderPricingItems();
    renderPreview();
  }

  function buildDefaultSubject(company) {
    return `${DEFAULT_SUBJECT_PREFIX}${normalizeSubjectCompany(company)}`;
  }

  function normalizeSubjectLineTemplate(value) {
    const text = String(value || "").trim();
    if (!text || text === "הנדון") return DEFAULT_SUBJECT_LINE_TEMPLATE;
    return text;
  }

  function subjectLineSettingsDisplayValue(value) {
    return renderSubjectLine({
      subject: sampleQuote.subject,
      subjectLabel: normalizeSubjectLineTemplate(value),
    });
  }

  function subjectLineTemplateFromSettingsValue(value) {
    const text = String(value || "").trim();
    if (!text || text === "הנדון") return DEFAULT_SUBJECT_LINE_TEMPLATE;

    const defaultSubject = sampleQuote.subject;
    return text.includes(defaultSubject) ? text.replace(defaultSubject, SUBJECT_PLACEHOLDER) : text;
  }

  function renderSubjectLine(sourceQuote) {
    const subject = String(sourceQuote?.subject || "").trim();
    const template = normalizeSubjectLineTemplate(sourceQuote?.subjectLabel);
    const rendered = template.includes(SUBJECT_PLACEHOLDER)
      ? template.replaceAll(SUBJECT_PLACEHOLDER, subject)
      : template;

    return rendered || subject;
  }

  function normalizeSubjectCompany(company) {
    return String(company || "").trim() || DEFAULT_CLIENT_COMPANY;
  }

  function replaceDefaultCompanyReferences(value, company) {
    const replacement = normalizeSubjectCompany(company);
    if (replacement === DEFAULT_CLIENT_COMPANY) return value;

    return String(value || "").split(DEFAULT_CLIENT_COMPANY).join(replacement);
  }

  function applyDefaultCompanyReferences(merged, raw) {
    const fields = ["backgroundText", "solutionText"];
    fields.forEach((field) => {
      if (shouldUseCompanySpecificDefaultText(raw, field) || hasLikelyCorruptedCompanyReplacement(raw[field], raw.clientCompany, field)) {
        merged[field] = replaceDefaultCompanyReferences(sampleQuote[field], merged.clientCompany);
      }
    });
    return merged;
  }

  function syncDefaultSectionTextsForCompanyChange(previousCompany) {
    ["backgroundText", "solutionText"].forEach((field) => {
      if (shouldSyncDefaultSectionText(quote[field], previousCompany, field)) {
        quote[field] = replaceDefaultCompanyReferences(sampleQuote[field], quote.clientCompany);
      }
    });
  }

  function shouldSyncDefaultSectionText(value, previousCompany, field) {
    const text = String(value || "").trim();
    if (!text) return true;
    return (
      text === sampleQuote[field] ||
      text === replaceDefaultCompanyReferences(sampleQuote[field], previousCompany) ||
      hasLikelyCorruptedCompanyReplacement(text, previousCompany, field) ||
      hasLikelyCorruptedCompanyReplacement(text, quote.clientCompany, field)
    );
  }

  function shouldUseCompanySpecificDefaultText(raw, field) {
    if (!Object.prototype.hasOwnProperty.call(raw || {}, field)) return true;
    const value = String(raw[field] || "").trim();
    if (!value) return true;
    return value === sampleQuote[field] || value === replaceDefaultCompanyReferences(sampleQuote[field], raw.clientCompany);
  }

  function hasLikelyCorruptedCompanyReplacement(value, company, field) {
    const text = String(value || "");
    const replacement = normalizeSubjectCompany(company);
    if (!text || replacement === DEFAULT_CLIENT_COMPANY) return false;

    const actualCount = countOccurrences(text, replacement);
    const expectedCount = countOccurrences(sampleQuote[field], DEFAULT_CLIENT_COMPANY);
    return actualCount > expectedCount + 2;
  }

  function countOccurrences(text, search) {
    if (!search) return 0;
    return String(text || "").split(search).length - 1;
  }

  function subjectMatchesDefaultCompany(subject, company) {
    return String(subject || "").trim() === buildDefaultSubject(company);
  }

  function shouldSyncSubjectForCompanyChange(subject, previousCompany) {
    return subjectMatchesDefaultCompany(subject, previousCompany) || subjectMatchesDefaultCompany(subject, DEFAULT_CLIENT_COMPANY);
  }

  function handleCourseNameInput(event) {
    const index = Number(event.target.dataset.courseNameIndex ?? event.target.dataset.courseGroupIndex);
    if (!Number.isInteger(index)) return;

    const courseCount = Math.max(0, Math.round(numberOr(quote.courseCount, 0)));
    const names = Array.from({ length: courseCount }, (_, itemIndex) => {
      const field = courseNamesList.querySelector(`[data-course-name-index="${itemIndex}"]`);
      return field ? field.value.trim() : quote.courseNames[itemIndex] || "";
    });
    const groups = Array.from({ length: courseCount }, (_, itemIndex) => {
      const field = courseNamesList.querySelector(`[data-course-group-index="${itemIndex}"]`);
      return normalizeCourseGroup(field ? field.value : quote.courseGroups[itemIndex]);
    });
    quote.courseNames = names;
    quote.courseGroups = groups;
    if (!quote.pricingItemsEdited) {
      resetPricingItems();
      renderPricingItems();
    } else if (event.target.dataset.courseNameIndex !== undefined && quote.pricingItems[index]) {
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
    clientLogosEditor.hidden = sectionKey !== "clients";
    if (sectionKey === "clients") renderClientLogosEditor();
    sectionEditor.hidden = false;
    sectionEditorText.focus();
  }

  function closeSectionEditor() {
    sectionEditor.hidden = true;
    clientLogosEditor.hidden = true;
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

  function normalizeClientLogos(logos) {
    const source = Array.isArray(logos) ? logos : DEFAULT_CLIENT_LOGOS;
    const normalized = source
      .map((logo) => ({
        name: String(logo?.name || "").trim(),
        src: versionClientLogoSrc(sanitizeClientLogoSrc(logo?.src)),
        size: clampClientLogoSize(logo?.size ?? defaultClientLogoSize(logo)),
      }))
      .filter((logo) => logo.src);
    addMissingSplitClientLogos(normalized);

    if (normalized.length === 1 && normalized[0].src === LEGACY_CLIENT_LOGOS_SRC) {
      return DEFAULT_CLIENT_LOGOS.map((logo) => ({ ...logo }));
    }

    return normalized;
  }

  function addMissingSplitClientLogos(logos) {
    const hasElectra = logos.some((logo) => cleanClientLogoSrc(logo.src).endsWith("/electra.png"));
    const caesarstoneIndex = logos.findIndex((logo) => cleanClientLogoSrc(logo.src).endsWith("/caesarstone.png"));
    if (hasElectra || caesarstoneIndex < 0) return;

    logos.splice(caesarstoneIndex, 0, {
      name: "אלקטרה",
      src: versionClientLogoSrc("assets/brand/client-logos/electra.png"),
      size: 100,
    });
  }

  function sanitizeClientLogoSrc(value) {
    const src = String(value || "").trim();
    if (!src) return "";
    if (/^data:image\/(png|jpe?g|gif|webp|svg\+xml);base64,[a-z0-9+/=]+$/i.test(src)) return src;
    if (/^(https?:\/\/|assets\/|\.\/|\/)/i.test(src)) return src;
    return "";
  }

  function versionClientLogoSrc(src) {
    const cleanSrc = cleanClientLogoSrc(src);
    const logoVersions = {
      "assets/brand/client-logos/amdocs.png": "20260602-crop",
      "assets/brand/client-logos/bazan.png": "20260601-crop",
      "assets/brand/client-logos/caesarstone.png": "20260602-crop",
      "assets/brand/client-logos/discount.png": "20260601-crop",
      "assets/brand/client-logos/electra.png": "20260602-crop",
      "assets/brand/client-logos/israel-police.png": "20260602-crop",
      "assets/brand/client-logos/shlomo-insurance.png": "20260602-crop",
      "assets/brand/client-logos/super-pharm.png": "20260602-crop",
    };
    if (logoVersions[cleanSrc]) {
      return `${cleanSrc}?v=${logoVersions[cleanSrc]}`;
    }
    return src;
  }

  function cleanClientLogoSrc(src) {
    return String(src || "").replace(/\?.*$/, "");
  }

  function clampClientLogoSize(value) {
    return Math.min(180, Math.max(60, Math.round(numberOr(value, 100))));
  }

  function defaultClientLogoSize(logo) {
    const src = cleanClientLogoSrc(logo?.src);
    if (src.endsWith("/bazan.png") || String(logo?.name || "").includes("בזן")) return 135;
    return 100;
  }

  function renderClientLogosEditor() {
    clientLogosList.innerHTML = quote.clientLogos.length
      ? quote.clientLogos.map(renderClientLogoEditorRow).join("")
      : `<p class="empty-note">לא הוגדרו לוגואים.</p>`;
  }

  function renderClientLogoEditorRow(logo, index) {
    return `
      <div class="client-logo-item" data-client-logo-index="${index}">
        <div class="client-logo-order" aria-label="שינוי סדר">
          <button type="button" title="העבר למעלה" aria-label="העבר את ${escapeAttr(logo.name || "הלוגו")} למעלה" data-move-client-logo="-1" ${index === 0 ? "disabled" : ""}>↑</button>
          <button type="button" title="העבר למטה" aria-label="העבר את ${escapeAttr(logo.name || "הלוגו")} למטה" data-move-client-logo="1" ${index === quote.clientLogos.length - 1 ? "disabled" : ""}>↓</button>
        </div>
        <div class="client-logo-thumb">
          ${logo.src ? `<img src="${escapeAttr(logo.src)}" alt="${escapeAttr(logo.name || "לוגו לקוח")}" />` : ""}
        </div>
        <label class="client-logo-name">
          שם לתיאור
          <input data-client-logo-field="name" type="text" value="${escapeAttr(logo.name)}" />
        </label>
        <label class="client-logo-source">
          מקור תמונה
          <input data-client-logo-field="src" type="url" value="${escapeAttr(logo.src)}" />
        </label>
        <label class="client-logo-size">
          גודל %
          <input data-client-logo-field="size" type="number" min="60" max="180" step="5" value="${escapeAttr(logo.size)}" />
        </label>
        <label class="client-logo-file">
          העלאת קובץ
          <input data-client-logo-upload type="file" accept="image/*" />
        </label>
        <button type="button" class="danger client-logo-remove" data-remove-client-logo="${index}">מחיקה</button>
      </div>
    `;
  }

  function addClientLogo() {
    quote.clientLogos.push({ name: "לקוח חדש", src: "" });
    queueClientLogoSettingsSave();
    renderClientLogosEditor();
    renderPreview();
  }

  async function handleClientLogoInput(event) {
    const row = event.target.closest("[data-client-logo-index]");
    if (!row) return;

    const index = Number(row.dataset.clientLogoIndex);
    const logo = quote.clientLogos[index];
    if (!logo) return;

    if (event.target.dataset.clientLogoField) {
      const field = event.target.dataset.clientLogoField;
      if (field === "src") {
        logo.src = sanitizeClientLogoSrc(event.target.value);
      } else if (field === "size") {
        logo.size = clampClientLogoSize(event.target.value);
      } else {
        logo[field] = event.target.value;
      }
      queueClientLogoSettingsSave();
      renderPreview();
      return;
    }

    if (event.target.dataset.clientLogoUpload !== undefined && event.target.files?.[0]) {
      logo.src = await readImageFileAsDataUrl(event.target.files[0]);
      if (!logo.name.trim()) logo.name = event.target.files[0].name.replace(/\.[^.]+$/, "");
      saveClientLogoSettings();
      renderClientLogosEditor();
      renderPreview();
    }
  }

  function handleClientLogoClick(event) {
    const moveButton = event.target.closest("[data-move-client-logo]");
    if (moveButton) {
      moveClientLogo(moveButton.closest("[data-client-logo-index]"), Number(moveButton.dataset.moveClientLogo));
      return;
    }

    const removeButton = event.target.closest("[data-remove-client-logo]");
    if (!removeButton) return;

    quote.clientLogos.splice(Number(removeButton.dataset.removeClientLogo), 1);
    saveClientLogoSettings();
    renderClientLogosEditor();
    renderPreview();
  }

  function moveClientLogo(row, direction) {
    const fromIndex = Number(row?.dataset.clientLogoIndex);
    const toIndex = fromIndex + direction;
    if (!Number.isInteger(fromIndex) || toIndex < 0 || toIndex >= quote.clientLogos.length) return;

    const [logo] = quote.clientLogos.splice(fromIndex, 1);
    quote.clientLogos.splice(toIndex, 0, logo);
    saveClientLogoSettings();
    renderClientLogosEditor();
    renderPreview();
  }

  function readImageFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  async function readClientLogoSettings() {
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from("client_logo_settings")
          .select("logos")
          .eq("id", "default")
          .maybeSingle();
        if (error) throw error;
        if (Array.isArray(data?.logos)) {
          const logos = normalizeClientLogos(data.logos);
          storageSet(CLIENT_LOGO_SETTINGS_KEY, JSON.stringify(logos));
          return logos;
        }
        const defaultLogos = normalizeClientLogos(DEFAULT_CLIENT_LOGOS);
        await saveClientLogoSettingsToSupabase(defaultLogos);
        storageSet(CLIENT_LOGO_SETTINGS_KEY, JSON.stringify(defaultLogos));
        return defaultLogos;
      } catch (error) {
        console.warn("Could not load client logos from Supabase", error);
      }
    }

    try {
      const stored = storageGet(CLIENT_LOGO_SETTINGS_KEY);
      if (stored) return normalizeClientLogos(JSON.parse(stored));
    } catch (error) {
      console.warn("Could not parse client logo settings", error);
    }

    return normalizeClientLogos(DEFAULT_CLIENT_LOGOS);
  }

  function applyClientLogoSettingsToQuote() {
    quote.clientLogos = normalizeClientLogos(clientLogoSettings);
  }

  function saveClientLogoSettings() {
    clientLogoSettings = normalizeClientLogos(quote.clientLogos);
    storageSet(CLIENT_LOGO_SETTINGS_KEY, JSON.stringify(clientLogoSettings));
    saveClientLogoSettingsToSupabase(clientLogoSettings);
  }

  function queueClientLogoSettingsSave() {
    if (isClientMode) return;

    window.clearTimeout(clientLogoSaveTimer);
    clientLogoSaveTimer = window.setTimeout(saveClientLogoSettings, 350);
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

  function syncPriceListDiscount() {
    quote.discountPercent = quote.includeLms && quote.courseCount >= 4 ? 10 : 0;
  }

  function showPriceList() {
    priceListContent.innerHTML = renderPriceList();
    priceListDialog.hidden = false;
    closePriceListButton.focus();
  }

  function closePriceList() {
    priceListDialog.hidden = true;
  }

  function renderPriceList() {
    return `
      ${renderPriceListSection("רכישת לומדות מדף - קבוצה A", ["תכולה", "עלות"], [
        ["לומדה ראשונה", formatCurrency(4900)],
        ["לומדה שנייה", formatCurrency(2600)],
        ["חבילה של 2 לומדות", formatCurrency(7500)],
        ["חבילה של 3 לומדות", formatCurrency(8900)],
        ["כל לומדה נוספת", formatCurrency(2500)],
        ["מניעת הטרדה מינית, כולל השינויים שחלו בחוק", formatCurrency(4500)],
        ["התאמת קריינות בעברית", formatCurrency(350)],
        ["שפה נוספת: ערבית, אנגלית או רוסית", formatCurrency(950)],
        ["קריינות בשפה נוספת באמצעות AI", formatCurrency(950)],
      ])}
      ${renderPriceListSection("רכישת לומדות מדף - קבוצה B", ["תכולה", "עלות"], [
        ["לומדה ראשונה", formatCurrency(5500)],
        ["לומדה שנייה", formatCurrency(3000)],
        ["חבילה של 2 לומדות", formatCurrency(8500)],
        ["חבילה של 3 לומדות", formatCurrency(10500)],
        ["כל לומדה נוספת", formatCurrency(2500)],
        ["התאמת קריינות בעברית לכל לומדה", formatCurrency(450)],
        ["שפה נוספת: ערבית, אנגלית או רוסית", formatCurrency(950)],
        ["קריינות בשפה נוספת באמצעות AI", formatCurrency(950)],
      ])}
      ${renderPriceListSection("לומדות נוספות והתאמות", ["תכולה", "עלות"], [
        ["לומדת קוד אתי בעברית, מבוסס על טמפלייט קיים", formatCurrency(6800)],
        ["התאמת קריינות בעברית ללומדת קוד אתי", formatCurrency(450)],
        ["אוריינטציה לעובד חדש בעברית", formatCurrency(7900)],
        ["התאמת קריינות בעברית לאוריינטציה", formatCurrency(1250)],
        ["התאמת צבעי מותג ללומדה קיימת", formatCurrency(1800)],
      ])}
      ${renderPriceListSection("פיתוח לומדה ללא השכרת מערכת", ["תכולה", "עלות"], [
        ["פיתוח עד 30 מסכים בעברית בלבד", formatCurrency(11250)],
        ["התאמת קריינות בעברית, עד 30 מסכים", formatCurrency(1500)],
        ["תרגום לשפה לטינית כולל LTR באמצעות AI, עד 30 מסכים", formatCurrency(6800)],
        ["קריינות באמצעות AI כולל QA, עד 30 מסכים", formatCurrency(5200)],
        ["פיתוח עד 40 מסכים בעברית בלבד", formatCurrency(13500)],
        ["התאמת קריינות בעברית, עד 40 מסכים", formatCurrency(1800)],
        ["תרגום לשפה לטינית כולל LTR באמצעות AI, עד 40 מסכים", formatCurrency(7250)],
        ["קריינות באמצעות AI כולל QA, עד 40 מסכים", formatCurrency(5950)],
      ])}
      ${renderPriceListSection("מבחנים ללומדה", ["תכולה", "עלות"], [
        ["מבחן עד 5 שאלות ללומדת מדף מתוך מאגר קיים", formatCurrency(1200)],
        ["כל שאלה נוספת ממאגר קיים", formatCurrency(300)],
        ["בניית מבחן חדש עד 5 שאלות", formatCurrency(1800)],
        ["כל שאלה נוספת במבחן חדש", formatCurrency(450)],
      ])}
      ${renderPriceListSection("סרטוני Vyond", ["תכולה", "עלות"], [
        ["פיתוח סרטון עד 4 דקות, כולל קריינות וכתוביות בעברית", formatCurrency(6950)],
        ["כתוביות בשפה נוספת לסרטון בפיתוח", formatCurrency(950)],
        ["סרטון מדף כולל התאמות, תיקוני קריינות וכתוביות בעברית", formatCurrency(4950)],
        ["כתוביות בשפה נוספת לסרטון מדף", formatCurrency(700)],
      ])}
      ${renderPriceListSection(
        "השכרת LMS עם לומדה אחת",
        ["מספר עובדים", "עלות שנתית", "מחיר למשתמש"],
        LMS_SINGLE_COURSE_TIERS.map((tier) => [
          formatUsersTier(tier),
          formatCurrency(tier.price),
          formatCurrency(tier.perUser),
        ])
      )}
      ${renderPriceListSection(
        "השכרת LMS עם חבילת 3 לומדות",
        ["מספר עובדים", "עלות שנתית"],
        LMS_THREE_COURSE_PACKAGE_TIERS.map((tier) => [formatUsersTier(tier), formatCurrency(tier.price)])
      )}
      ${renderPriceListSection("תוספות להשכרת LMS", ["תוספת", "עלות"], [
        ["לומדה נוספת במערכת LMS עד 500 עובדים", formatCurrency(1200)],
        ["לומדה נוספת במערכת LMS, 501-700 עובדים", formatCurrency(2500)],
        ["לומדה נוספת במערכת LMS, 701-850 עובדים", formatCurrency(3000)],
        ["לומדה נוספת במערכת LMS, 851-1,000 עובדים", formatCurrency(3500)],
        ["התאמת קריינות בעברית", formatCurrency(450)],
        ["הוספת שפה זרה: אנגלית, רוסית או ערבית", formatCurrency(750)],
        ["התאמת קריינות בשפה נוספת", formatCurrency(950)],
        ["עובד נוסף במסלול פעיל", formatCurrency(numberOr(quote.additionalUserPrice, sampleQuote.additionalUserPrice))],
      ])}
      ${renderPriceListSection("תיקוני לומדות והטבות", ["פריט", "תנאי"], [
        ["תיקוני לומדות", "הערכת שעות בתוספת שעה-שעתיים, כפול 300 ₪ לשעה"],
        ["הנחה לתיקונים", "ניתן לתת הנחה של עד 200 ₪ לשעת תיקונים אחת"],
        ["הנחה כללית", "עד 10% לפי שיקול דעת"],
        ["הטבת LMS", "סרטון אבטחת מידע או מניעת הטרדה מינית ללא עלות בשנה הראשונה"],
      ])}
      <p class="price-list-note">המחירון משקף את מדרגות התמחור המשמשות את המחולל בפועל. המחירים אינם כוללים מע"מ.</p>
    `;
  }

  function renderPriceListSection(title, headers, rows) {
    return `
      <section class="price-list-section">
        <h3>${escapeHtml(title)}</h3>
        <table class="price-list-table">
          <thead>
            <tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${rows
              .map(
                (row) => `
                  <tr>
                    ${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
      </section>
    `;
  }

  function formatUsersTier(tier) {
    return tier.minUsers <= 1
      ? `עד ${formatNumber(tier.maxUsers)} עובדים`
      : `${formatNumber(tier.minUsers)}-${formatNumber(tier.maxUsers)} עובדים`;
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
      quoteTrackingPanel.hidden = true;
      const copied = await copyText(link);
      setCopyFeedback(copied ? "הקישור הועתק" : "הקישור מוכן להעתקה");
    } finally {
      createButton.disabled = false;
      createButton.textContent = "קישור ללקוח";
    }
  }

  async function buildClientLink() {
    const payload = buildShareQuotePayload();
    const shareId = await saveSharedQuote(payload);
    if (shareId) {
      setActiveSharedQuoteId(shareId);
      return buildSharedQuoteLink(shareId);
    }

    const encoded = await compressQuotePayload(JSON.stringify(payload));
    setActiveSharedQuoteId("");
    return `${getShareBaseUrl()}#mode=client&z=${encoded}`;
  }

  function buildSharedQuoteLink(id) {
    return `${getShareBaseUrl()}#mode=client&id=${encodeURIComponent(id)}`;
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

  function openPrintDialog() {
    window.print();
  }

  async function showPrintPdfChoice() {
    const choice = await showAppDialog({
      title: "הדפסה / PDF",
      message: "בחרו האם לפתוח חלון הדפסה רגיל או ליצור PDF עם קישורים פעילים בתוכן העניינים.",
      confirmText: "יצירת PDF",
      confirmResult: "pdf",
      cancelText: "הדפסה",
      cancelResult: "print",
      showCancel: true,
    });

    if (choice === "print") {
      openPrintDialog();
      return;
    }

    if (choice === "pdf") {
      await openLinkedPdf();
    }
  }

  async function openLinkedPdf() {
    const pdfButton = document.getElementById("printQuote");
    pdfButton.disabled = true;
    pdfButton.textContent = "יוצר PDF...";

    try {
      await downloadQuotePdf(normalizeQuote(quote));
    } catch (error) {
      console.error("Could not create linked PDF", error);
      showAppAlert("לא ניתן ליצור PDF", "יצירת הקובץ נכשלה. רעננו את העמוד ונסו שוב.");
    } finally {
      pdfButton.disabled = false;
      pdfButton.textContent = "הדפסה / PDF";
    }
  }

  async function downloadQuotePdf(pdfQuote) {
    if (!window.html2canvas || !window.jspdf?.jsPDF) {
      throw new Error("PDF libraries are unavailable");
    }

    quote = normalizeQuote(pdfQuote);
    renderPreview();
    document.body.classList.add("pdf-export-mode");
    try {
      await waitForPdfAssets();

      const pages = Array.from(preview.querySelectorAll(".quote-page"));
      if (!pages.length) throw new Error("No quote pages were rendered");

      const pdf = new window.jspdf.jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });
      const internalLinks = collectPdfInternalLinks(pages);
      if (pages.length > 1 && !internalLinks.length) {
        throw new Error("No table-of-contents links were found");
      }

      for (let index = 0; index < pages.length; index += 1) {
        if (index > 0) pdf.addPage("a4", "portrait");
        const canvas = await window.html2canvas(pages[index], {
          backgroundColor: "#ffffff",
          scale: 2,
          useCORS: true,
          logging: false,
          windowWidth: 1280,
          windowHeight: 900,
        });
        pdf.addImage(canvas.toDataURL("image/jpeg", 0.94), "JPEG", 0, 0, 210, 297, undefined, "FAST");
      }

      internalLinks.forEach((link) => {
        pdf.setPage(link.sourcePage + 1);
        pdf.link(link.x, link.y, link.width, link.height, {
          pageNumber: link.targetPage + 1,
          top: 0,
        });
      });

      pdf.save(buildPdfFilename(pdfQuote));
    } finally {
      document.body.classList.remove("pdf-export-mode");
    }
  }

  function collectPdfInternalLinks(pages) {
    const pageByTargetId = new Map();
    pages.forEach((pageElement, pageIndex) => {
      pageElement.querySelectorAll("[id]").forEach((target) => pageByTargetId.set(target.id, pageIndex));
    });

    const links = [];
    pages.forEach((pageElement, sourcePage) => {
      const pageRect = pageElement.getBoundingClientRect();
      const mmPerPixel = 210 / pageRect.width;

      pageElement.querySelectorAll(".toc a[href]").forEach((anchor) => {
        const targetId = decodeURIComponent(new URL(anchor.href, window.location.href).hash.slice(1));
        const targetPage = pageByTargetId.get(targetId);
        if (targetPage === undefined) return;

        const rect = anchor.getBoundingClientRect();
        links.push({
          sourcePage,
          targetPage,
          x: (rect.left - pageRect.left) * mmPerPixel,
          y: (rect.top - pageRect.top) * mmPerPixel,
          width: rect.width * mmPerPixel,
          height: rect.height * mmPerPixel,
        });
      });
    });

    return links;
  }

  async function waitForPdfAssets() {
    if (document.fonts?.ready) await document.fonts.ready;

    const images = Array.from(preview.querySelectorAll("img"));
    await Promise.all(
      images.map((image) => {
        if (image.complete) return Promise.resolve();
        return new Promise((resolve) => {
          image.addEventListener("load", resolve, { once: true });
          image.addEventListener("error", resolve, { once: true });
        });
      })
    );

    await new Promise((resolve) => window.requestAnimationFrame(() => window.requestAnimationFrame(resolve)));
  }

  function buildPdfFilename(pdfQuote) {
    const quoteNumber = String(pdfQuote.quoteNumber || "quote").trim() || "quote";
    return `improve-it-${quoteNumber}.pdf`;
  }

  function clearPdfAutoOpenFlag() {
    clearHashParam("pdf");
  }

  function clearHashParam(name) {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    if (!params.has(name)) return;

    params.delete(name);
    const nextHash = params.toString();
    const nextUrl = `${window.location.pathname}${window.location.search}${nextHash ? `#${nextHash}` : ""}`;
    window.history.replaceState(null, "", nextUrl);
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
    const sendButton = document.getElementById("sendSignedQuote");
    if (!quote.clientSignerName.trim()) {
      await showAppAlert("חסרים פרטי חתימה", "יש למלא שם חותם לפני שליחת ההצעה החתומה.");
      return;
    }

    if (!quote.clientSignatureData) {
      await showAppAlert("חסרה חתימה", "יש לחתום דיגיטלית לפני שליחת ההצעה החתומה.");
      return;
    }

    updateClientSignatureDateToToday();

    sendButton.disabled = true;
    sendButton.textContent = "שולח חתימה...";

    try {
      const archive = readSignedArchive();
      const signedRecord = {
        id: buildSignedQuoteRecordId(),
        sharedQuoteId: activeSharedQuoteId || getHashParam("id") || "",
        signedAt: new Date().toISOString(),
        quote: normalizeQuote(quote),
      };
      writeSignedArchive([signedRecord, ...archive]);
      const savedToSupabase = await saveSignedQuoteToSupabase(signedRecord);
      const savedToSharedQuote = await saveSignedQuoteToSharedQuote(signedRecord);
      const savedToLocalServer = await saveSignedQuoteToLocalServer(signedRecord);
      if (!savedToSupabase && !savedToSharedQuote && !savedToLocalServer) {
        throw new Error("Signed quote was not saved to a shared archive");
      }
      renderPreview();
      await showSignedQuoteSentDialog(signedRecord.quote);
    } catch (error) {
      console.error("Could not send signed quote", error);
      await showAppAlert("לא ניתן לשלוח חתימה", "לא הצלחנו לשמור את ההצעה החתומה. נסו שוב בעוד רגע.");
    } finally {
      sendButton.disabled = false;
      sendButton.textContent = "מאשר/ת את ההצעה ושולח/ת חתימה";
    }
  }

  function buildSignedQuoteRecordId() {
    const sharedQuoteId = activeSharedQuoteId || getHashParam("id");
    if (sharedQuoteId) return `${sharedQuoteId}-signed-${Date.now()}`;

    return `${quote.quoteNumber || "quote"}-${Date.now()}`;
  }

  async function showSignedQuoteSentDialog(signedQuote) {
    const result = await showAppDialog({
      title: "ההצעה נשלחה",
      message: "ההצעה החתומה נשלחה ונשמרה במאגר ההצעות החתומות. ניתן לסגור את החלון.",
      confirmText: "ההצעה נשלחה - סגור את החלון",
      showCancel: false,
      extraText: "הורדת ההצעה החתומה",
      extraResult: "download",
    });

    if (result === "download") {
      await downloadSignedQuote(signedQuote);
    } else {
      closeClientWindow();
    }
  }

  function closeClientWindow() {
    window.close();
  }

  async function downloadSignedQuote(signedQuote) {
    quote = normalizeQuote(signedQuote || quote);
    storageSet(STORAGE_KEY, JSON.stringify(quote));
    populateForm();
    renderCourseNameInputs();
    renderPricingItems();
    redrawSignaturePad();
    renderPreview();

    await downloadQuotePdf(quote);
  }

  async function showSignedArchive() {
    await syncSignedArchiveFromSupabase();
    await syncSignedArchiveFromSharedQuotes();
    await syncSignedArchiveFromLocalServer();
    renderSignedArchive();
    signedArchivePanel.hidden = false;
    sharePanel.hidden = true;
    quoteTrackingPanel.hidden = true;
    settingsPanel.hidden = true;
  }

  function renderSignedArchive() {
    const archive = readSignedArchive();
    const searchTerm = normalizeSearchText(signedArchiveSearchField.value);
    const filteredArchive = archive
      .map((record, index) => ({ record, index }))
      .filter(({ record }) => !searchTerm || signedArchiveMatchesSearch(record, searchTerm));

    signedArchiveList.innerHTML = filteredArchive.length
      ? filteredArchive
          .map(({ record, index }) => {
            const signedQuote = record.quote || {};
            return `
              <div class="signed-archive-row">
                <div class="signed-archive-details">
                  <strong>${escapeHtml(signedQuote.clientCompany || "ללא חברה")} - ${escapeHtml(signedQuote.quoteNumber || "ללא מספר")}</strong>
                  <div class="signed-archive-meta">
                    <span>חותם: ${escapeHtml(signedQuote.clientSignerName || "לא צוין")}</span>
                    <span>נחתם: ${escapeHtml(formatDateTime(record.signedAt))}</span>
                  </div>
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
      : `<p class="empty-note">${archive.length ? "לא נמצאו הצעות חתומות שתואמות לחיפוש." : "עדיין אין הצעות חתומות במאגר המקומי."}</p>`;
  }

  function signedArchiveMatchesSearch(record, searchTerm) {
    const signedQuote = record.quote || {};
    return normalizeSearchText(
      [
        signedQuote.clientCompany,
        signedQuote.quoteNumber,
        signedQuote.subject,
        signedQuote.clientSignerName,
        signedQuote.clientSignerTitle,
        signedQuote.clientSignerCompany,
        formatDateTime(record.signedAt),
      ].join(" ")
    ).includes(searchTerm);
  }

  function normalizeSearchText(value) {
    return String(value || "").toLocaleLowerCase("he").replace(/\s+/g, " ").trim();
  }

  async function handleSignedArchiveClick(event) {
    const deleteButton = event.target.closest("[data-delete-signed-index]");
    if (deleteButton) {
      await deleteSignedArchiveRecord(Number(deleteButton.dataset.deleteSignedIndex));
      return;
    }

    const downloadButton = event.target.closest("[data-download-signed-index]");
    if (downloadButton) {
      if (loadSignedArchiveRecord(Number(downloadButton.dataset.downloadSignedIndex))) {
        window.setTimeout(openLinkedPdf, 250);
      }
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
    await deleteSignedQuoteFromSharedQuote(record);
    await deleteSignedQuoteFromLocalServer(record.id);
    renderSignedArchive();
  }

  function showAppAlert(title, message) {
    return showAppDialog({ title, message, confirmText: "אישור", showCancel: false });
  }

  function showAppConfirm(title, message, confirmText = "אישור") {
    return showAppDialog({ title, message, confirmText, showCancel: true });
  }

  function showAppDialog({
    title,
    message,
    confirmText,
    showCancel,
    cancelText = "ביטול",
    extraText = "",
    confirmResult = true,
    cancelResult = false,
    extraResult = "extra",
  }) {
    appDialogTitle.textContent = title;
    appDialogMessage.innerHTML = `<p>${escapeHtml(message)}</p>`;
    appDialogConfirm.textContent = confirmText;
    appDialogCancel.textContent = cancelText;
    appDialogCancel.hidden = !showCancel;
    appDialogExtra.textContent = extraText;
    appDialogExtra.hidden = !extraText;
    appDialogExtra.classList.toggle("primary", Boolean(extraText));
    appDialogConfirm.classList.toggle("primary", !extraText);
    appDialog.hidden = false;
    appDialogConfirm.focus();

    return new Promise((resolve) => {
      const close = (result) => {
        appDialog.hidden = true;
        appDialogConfirm.removeEventListener("click", onConfirm);
        appDialogCancel.removeEventListener("click", onCancel);
        appDialogExtra.removeEventListener("click", onExtra);
        appDialogClose.removeEventListener("click", onClose);
        appDialog.removeEventListener("click", onBackdrop);
        document.removeEventListener("keydown", onKeydown);
        resolve(result);
      };
      const onConfirm = () => close(confirmResult);
      const onCancel = () => close(cancelResult);
      const onExtra = () => close(extraResult);
      const onClose = () => close(null);
      const onBackdrop = (event) => {
        if (event.target === appDialog && showCancel) close(null);
      };
      const onKeydown = (event) => {
        if (event.key === "Escape") close(null);
      };

      appDialogConfirm.addEventListener("click", onConfirm);
      appDialogCancel.addEventListener("click", onCancel);
      appDialogExtra.addEventListener("click", onExtra);
      appDialogClose.addEventListener("click", onClose);
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

  function writeSignedArchive(archive) {
    const cleanArchive = mergeSignedArchiveRecords(archive);
    storageSet(SIGNED_ARCHIVE_KEY, JSON.stringify(cleanArchive));
    return cleanArchive;
  }

  function mergeSignedArchiveRecords(...archives) {
    const byId = new Map();
    archives.flat().forEach((record) => {
      if (!record?.id || !record.quote) return;
      byId.set(record.id, record);
    });

    return Array.from(byId.values()).sort((a, b) => new Date(b.signedAt || 0) - new Date(a.signedAt || 0));
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
      writeSignedArchive(mergeSignedArchiveRecords(archive, readSignedArchive()));
    } catch (error) {
      console.warn("Could not load signed archive from Supabase", error);
    }
  }

  async function syncSignedArchiveFromSharedQuotes() {
    if (!supabaseClient) return;

    try {
      const { data, error } = await supabaseClient
        .from("shared_quotes")
        .select("id,created_at,quote")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const archive = (data || [])
        .map(extractSignedArchiveRecordFromSharedQuote)
        .filter(Boolean);
      writeSignedArchive(mergeSignedArchiveRecords(archive, readSignedArchive()));
    } catch (error) {
      console.warn("Could not load signed quotes from shared links", error);
    }
  }

  function extractSignedArchiveRecordFromSharedQuote(record) {
    const sharedQuote = record?.quote;
    if (!sharedQuote || typeof sharedQuote !== "object") return null;

    const embeddedRecord = sharedQuote.signedArchiveRecord || sharedQuote.signedRecord;
    if (embeddedRecord?.quote) {
      return {
        id: embeddedRecord.id || `${record.id}-signed`,
        sharedQuoteId: embeddedRecord.sharedQuoteId || record.id,
        signedAt: embeddedRecord.signedAt || embeddedRecord.signed_at || record.created_at || "",
        quote: embeddedRecord.quote,
      };
    }

    if (!sharedQuote.clientSignatureData) return null;

    return {
      id: `${record.id}-signed`,
      sharedQuoteId: record.id,
      signedAt: sharedQuote.clientSignatureDate || record.created_at || "",
      quote: sharedQuote,
    };
  }

  async function syncSignedArchiveFromLocalServer() {
    if (!shouldUseLocalServer()) return;

    try {
      const response = await fetch(LOCAL_SIGNED_ARCHIVE_URL);
      if (!response.ok) throw new Error(`Local signed archive failed: ${response.status}`);
      const archive = await response.json();
      writeSignedArchive(mergeSignedArchiveRecords(Array.isArray(archive) ? archive : [], readSignedArchive()));
    } catch (error) {
      console.warn("Could not load signed archive from local server", error);
    }
  }

  async function saveSignedQuoteToSupabase(record) {
    if (!supabaseClient) return false;

    try {
      const { error } = await supabaseClient.from("signed_quotes").upsert({
        id: record.id,
        signed_at: record.signedAt,
        quote: record.quote,
      });
      if (error) throw error;
      return true;
    } catch (error) {
      console.warn("Could not save signed quote to Supabase", error);
      return false;
    }
  }

  async function saveSignedQuoteToLocalServer(record) {
    if (!shouldUseLocalServer()) return false;

    try {
      const response = await fetch(LOCAL_SIGNED_ARCHIVE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(record),
      });
      if (!response.ok) throw new Error(`Local signed archive save failed: ${response.status}`);
      return true;
    } catch (error) {
      console.warn("Could not save signed quote to local server", error);
      return false;
    }
  }

  async function saveSignedQuoteToSharedQuote(record) {
    const sharedQuoteId = record.sharedQuoteId || activeSharedQuoteId || getHashParam("id");
    if (!sharedQuoteId) return false;

    const sharedQuote = await readSharedQuote(sharedQuoteId);
    if (!sharedQuote) return false;

    const signedQuote = normalizeQuote(record.quote);
    const signedPayload = {
      ...sharedQuote,
      ...signedQuote,
      signedArchiveRecord: {
        id: record.id,
        sharedQuoteId,
        signedAt: record.signedAt,
        quote: signedQuote,
      },
    };

    const savedToSupabase = await updateSharedQuotePayloadInSupabase(sharedQuoteId, signedPayload);
    const savedToLocalServer = await saveSharedQuoteToLocalServer(sharedQuoteId, signedPayload);
    return savedToSupabase || savedToLocalServer;
  }

  async function updateSharedQuotePayloadInSupabase(id, payload) {
    if (!supabaseClient || !id) return false;

    try {
      const { data } = await supabaseClient
        .from("shared_quotes")
        .select("quote")
        .eq("id", id)
        .maybeSingle();

      const mergedPayload = { ...payload };
      if (data?.quote?.openEvents) {
        mergedPayload.openEvents = data.quote.openEvents;
      }

      const { error } = await supabaseClient.from("shared_quotes").update({ quote: mergedPayload }).eq("id", id);
      if (error) throw error;
      return true;
    } catch (error) {
      console.warn("Could not update shared quote with signed record", error);
      return false;
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

  async function deleteSignedQuoteFromLocalServer(id) {
    if (!id) return;
    if (!shouldUseLocalServer()) return;

    try {
      const response = await fetch(`${LOCAL_SIGNED_ARCHIVE_URL}?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!response.ok) throw new Error(`Local signed archive delete failed: ${response.status}`);
    } catch (error) {
      console.warn("Could not delete signed quote from local server", error);
    }
  }

  async function deleteSignedQuoteFromSharedQuote(record) {
    const sharedQuoteId = record?.sharedQuoteId;
    if (!sharedQuoteId) return false;

    const sharedQuote = await readSharedQuote(sharedQuoteId);
    if (!sharedQuote?.signedArchiveRecord && !sharedQuote?.signedRecord) return false;

    const cleanedQuote = { ...sharedQuote };
    delete cleanedQuote.signedArchiveRecord;
    delete cleanedQuote.signedRecord;
    delete cleanedQuote.clientSignatureData;
    delete cleanedQuote.clientSignatureDate;
    delete cleanedQuote.clientSignerName;
    delete cleanedQuote.clientSignerTitle;
    delete cleanedQuote.clientSignerCompany;

    const savedToSupabase = await updateSharedQuotePayloadInSupabase(sharedQuoteId, cleanedQuote);
    const savedToLocalServer = await saveSharedQuoteToLocalServer(sharedQuoteId, cleanedQuote);
    return savedToSupabase || savedToLocalServer;
  }

  async function saveSharedQuote(payload) {
    const id = createShortId("q");
    const trackingRecord = buildQuoteTrackingRecord(id, payload);
    const savedToLocalServer = await saveSharedQuoteToLocalServer(id, payload);
    saveQuoteTrackingRecord(trackingRecord);
    const savedToSupabase = await saveSharedQuoteToSupabase(id, payload);
    return savedToLocalServer || savedToSupabase ? id : "";
  }

  async function updateSharedQuote(id, payload) {
    if (!id) return false;

    const updatedRecord = buildQuoteTrackingRecord(id, payload);
    const existingRecord = readQuoteTracking().find((record) => record.id === id);
    if (existingRecord) {
      updatedRecord.createdAt = existingRecord.createdAt || updatedRecord.createdAt;
      updatedRecord.openEvents = existingRecord.openEvents || [];
    }

    saveQuoteTrackingRecord(updatedRecord);
    const savedToLocalServer = await saveSharedQuoteToLocalServer(id, payload, updatedRecord.createdAt);
    const savedToSupabase = await saveSharedQuoteToSupabase(id, payload);
    return savedToLocalServer || savedToSupabase;
  }

  async function readSharedQuote(id) {
    return (await readSharedQuoteFromSupabase(id)) || (await readSharedQuoteFromLocalServer(id));
  }

  async function saveSharedQuoteToSupabase(id, payload) {
    if (!supabaseClient || !id) return false;

    try {
      const { error } = await supabaseClient.from("shared_quotes").upsert({
        id,
        quote: payload,
        created_at: new Date().toISOString(),
      });
      if (error) throw error;
      return true;
    } catch (error) {
      console.warn("Could not save shared quote to Supabase", error);
      return false;
    }
  }

  async function readSharedQuoteFromSupabase(id) {
    if (!supabaseClient || !id) return null;

    try {
      const { data, error } = await supabaseClient
        .from("shared_quotes")
        .select("quote")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data?.quote || null;
    } catch (error) {
      console.warn("Could not load shared quote from Supabase", error);
      return null;
    }
  }

  async function saveSharedQuoteToLocalServer(id, payload, createdAt = new Date().toISOString()) {
    if (!shouldUseLocalServer()) return false;

    try {
      const response = await fetch(LOCAL_SHARED_QUOTE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, quote: payload, createdAt }),
      });
      if (!response.ok) throw new Error(`Local shared quote save failed: ${response.status}`);
      return true;
    } catch (error) {
      console.warn("Could not save shared quote to local server", error);
      return false;
    }
  }

  async function readSharedQuoteFromLocalServer(id) {
    if (!shouldUseLocalServer()) return null;

    try {
      const response = await fetch(`${LOCAL_SHARED_QUOTE_URL}?id=${encodeURIComponent(id)}`);
      if (!response.ok) throw new Error(`Local shared quote load failed: ${response.status}`);
      const record = await response.json();
      return record?.quote || null;
    } catch (error) {
      console.warn("Could not load shared quote from local server", error);
      return null;
    }
  }

  async function deleteSharedQuoteFromSupabase(id) {
    if (!supabaseClient || !id) return false;

    try {
      const { error } = await supabaseClient.from("shared_quotes").delete().eq("id", id);
      if (error) throw error;
      return true;
    } catch (error) {
      console.warn("Could not delete shared quote from Supabase", error);
      return false;
    }
  }

  async function deleteSharedQuoteFromLocalServer(id) {
    if (!shouldUseLocalServer() || !id) return false;

    try {
      const response = await fetch(`${LOCAL_SHARED_QUOTE_URL}?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!response.ok) throw new Error(`Local shared quote delete failed: ${response.status}`);
      return true;
    } catch (error) {
      console.warn("Could not delete shared quote from local server", error);
      return false;
    }
  }

  async function recordSharedQuoteOpen(id) {
    if (!id) return;
    const openedAt = new Date().toISOString();
    appendQuoteTrackingOpen(id, openedAt);
    await recordSharedQuoteOpenOnLocalServer(id, openedAt);
  }

  async function recordSharedQuoteOpenOnLocalServer(id, openedAt) {
    if (!shouldUseLocalServer()) return false;

    try {
      const response = await fetch(`${LOCAL_SHARED_QUOTE_URL}?action=open`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, openedAt }),
      });
      if (!response.ok) throw new Error(`Local shared quote tracking failed: ${response.status}`);
      return true;
    } catch (error) {
      console.warn("Could not record shared quote open on local server", error);
      return false;
    }
  }

  async function showQuoteTracking() {
    await syncQuoteTrackingFromLocalServer();
    renderQuoteTracking();
    quoteTrackingPanel.hidden = false;
    sharePanel.hidden = true;
    signedArchivePanel.hidden = true;
    settingsPanel.hidden = true;
  }

  function renderQuoteTracking() {
    const records = readQuoteTracking().filter(isVisibleQuoteTrackingRecord);
    const searchTerm = normalizeSearchText(quoteTrackingSearchField.value);
    const filteredRecords = records.filter((record) => !searchTerm || quoteTrackingMatchesSearch(record, searchTerm));

    quoteTrackingList.innerHTML = filteredRecords.length
      ? filteredRecords.map(renderQuoteTrackingRecord).join("")
      : `<p class="empty-note">${records.length ? "לא נמצאו הצעות שתואמות לחיפוש." : "עדיין אין קישורים שנשלחו למעקב."}</p>`;
  }

  function renderQuoteTrackingRecord(record) {
    const quote = record.quote || {};
    const openEvents = Array.isArray(record.openEvents) ? record.openEvents : [];
    const lastOpenedAt = openEvents[openEvents.length - 1]?.openedAt || "";
    const openTimes = openEvents.length
      ? `<ol class="quote-tracking-times">${openEvents.map((event) => `<li>${escapeHtml(formatDateTime(event.openedAt))}</li>`).join("")}</ol>`
      : `<p class="empty-note">עדיין לא נרשמו פתיחות.</p>`;

    return `
      <div class="signed-archive-row quote-tracking-row">
        <div class="signed-archive-details">
          <strong>${escapeHtml(quote.clientCompany || "ללא חברה")} - ${escapeHtml(quote.quoteNumber || "ללא מספר")}</strong>
          <div class="signed-archive-meta">
            <span>נשלח: ${escapeHtml(formatDateTime(record.createdAt))}</span>
            <span>פתיחות: ${openEvents.length}</span>
            <span>פתיחה אחרונה: ${escapeHtml(lastOpenedAt ? formatDateTime(lastOpenedAt) : "טרם נפתח")}</span>
          </div>
          <div class="quote-tracking-subject">${escapeHtml(quote.subject || "")}</div>
          ${openTimes}
        </div>
        <div class="signed-archive-actions">
          <button type="button" class="compact" data-copy-tracking-id="${escapeAttr(record.id)}">העתקת קישור</button>
          <button type="button" class="compact" data-edit-tracking-id="${escapeAttr(record.id)}">עריכה</button>
          <button type="button" class="compact danger" data-delete-tracking-id="${escapeAttr(record.id)}">מחיקה</button>
        </div>
      </div>
    `;
  }

  async function handleQuoteTrackingClick(event) {
    const copyButton = event.target.closest("[data-copy-tracking-id]");
    if (copyButton) {
      await copyTrackingLink(copyButton.dataset.copyTrackingId, copyButton);
      return;
    }

    const editButton = event.target.closest("[data-edit-tracking-id]");
    if (editButton) {
      await editTrackedQuote(editButton.dataset.editTrackingId);
      return;
    }

    const deleteButton = event.target.closest("[data-delete-tracking-id]");
    if (deleteButton) {
      await deleteTrackedQuote(deleteButton.dataset.deleteTrackingId);
    }
  }

  async function copyTrackingLink(id, button) {
    const copied = await copyText(buildSharedQuoteLink(id));
    const originalText = button.textContent;
    button.textContent = copied ? "הועתק" : "לא הועתק";
    window.setTimeout(() => {
      button.textContent = originalText;
    }, 1600);
  }

  async function editTrackedQuote(id) {
    const record = readQuoteTracking().find((item) => item.id === id);
    const linkedQuote = await readSharedQuote(id);
    const quoteToEdit = linkedQuote || record?.quote;
    if (!quoteToEdit) {
      await showAppAlert("לא ניתן לערוך", "לא נמצאה הצעה שמקושרת לקישור הזה.");
      return;
    }

    setActiveSharedQuoteId(id);
    quote = normalizeQuote(quoteToEdit);
    storageSet(STORAGE_KEY, JSON.stringify(quote));
    populateForm();
    renderCourseNameInputs();
    renderPricingItems();
    redrawSignaturePad();
    renderPreview();
    clientLinkOutput.value = buildSharedQuoteLink(id);
    sharePanel.hidden = false;
    quoteTrackingPanel.hidden = true;
    signedArchivePanel.hidden = true;
    settingsPanel.hidden = true;
    setCopyFeedback("עורכים קישור קיים");
    scrollPageToTop();
  }

  async function deleteTrackedQuote(id) {
    const record = readQuoteTracking().find((item) => item.id === id);
    const quoteName = record?.quote?.clientCompany || record?.quote?.quoteNumber || "הקישור";
    const confirmed = await showAppConfirm(
      "מחיקת קישור מעקב",
      `למחוק את "${quoteName}" ולבטל את הקישור ללקוח?`,
      "מחיקה"
    );
    if (!confirmed) return;

    writeQuoteTracking(readQuoteTracking().filter((item) => item.id !== id));
    if (activeSharedQuoteId === id) setActiveSharedQuoteId("");
    await deleteSharedQuoteFromSupabase(id);
    await deleteSharedQuoteFromLocalServer(id);
    renderQuoteTracking();
  }

  function quoteTrackingMatchesSearch(record, searchTerm) {
    const quote = record.quote || {};
    return normalizeSearchText(
      [
        quote.clientCompany,
        quote.quoteNumber,
        quote.subject,
        formatDateTime(record.createdAt),
        ...(record.openEvents || []).map((event) => formatDateTime(event.openedAt)),
      ].join(" ")
    ).includes(searchTerm);
  }

  function isVisibleQuoteTrackingRecord(record) {
    const quote = record.quote || {};
    return Boolean(
      record.createdAt ||
        record.openEvents?.length ||
        quote.clientCompany ||
        quote.quoteNumber ||
        quote.subject
    );
  }

  async function syncQuoteTrackingFromLocalServer() {
    if (!shouldUseLocalServer()) return;

    try {
      const response = await fetch(LOCAL_SHARED_QUOTE_URL);
      if (!response.ok) throw new Error(`Local quote tracking failed: ${response.status}`);
      const records = await response.json();
      if (Array.isArray(records)) {
        writeQuoteTracking(mergeQuoteTrackingRecords(records, readQuoteTracking()));
      }
    } catch (error) {
      console.warn("Could not load quote tracking from local server", error);
    }
  }

  function buildQuoteTrackingRecord(id, payload) {
    return {
      id,
      createdAt: new Date().toISOString(),
      quote: normalizeQuote(payload),
      openEvents: [],
    };
  }

  function readQuoteTracking() {
    try {
      const stored = storageGet(QUOTE_TRACKING_KEY);
      const records = stored ? JSON.parse(stored) : [];
      return Array.isArray(records) ? mergeQuoteTrackingRecords(records) : [];
    } catch (error) {
      console.warn("Could not parse quote tracking", error);
      return [];
    }
  }

  function writeQuoteTracking(records) {
    storageSet(QUOTE_TRACKING_KEY, JSON.stringify(mergeQuoteTrackingRecords(records)));
  }

  function saveQuoteTrackingRecord(record) {
    writeQuoteTracking(mergeQuoteTrackingRecords(readQuoteTracking(), [record]));
  }

  function appendQuoteTrackingOpen(id, openedAt) {
    const records = readQuoteTracking();
    const index = records.findIndex((record) => record.id === id);
    if (index < 0) return;

    const record = normalizeQuoteTrackingRecord(records[index]);
    record.openEvents.push({ openedAt });
    records[index] = record;
    writeQuoteTracking(records);
  }

  function mergeQuoteTrackingRecords(...recordLists) {
    const byId = new Map();
    recordLists.flat().forEach((record) => {
      const normalized = normalizeQuoteTrackingRecord(record);
      if (!normalized.id) return;
      const existing = byId.get(normalized.id);
      byId.set(normalized.id, existing ? mergeQuoteTrackingRecord(existing, normalized) : normalized);
    });
    return Array.from(byId.values()).sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  }

  function mergeQuoteTrackingRecord(a, b) {
    const openEvents = mergeQuoteOpenEvents(a.openEvents, b.openEvents);
    return {
      ...a,
      ...b,
      quote: { ...(a.quote || {}), ...(b.quote || {}) },
      createdAt: a.createdAt || b.createdAt,
      openEvents,
    };
  }

  function normalizeQuoteTrackingRecord(record) {
    const quote = record?.quote && typeof record.quote === "object" ? record.quote : record || {};
    const openEvents = Array.isArray(record?.openEvents)
      ? record.openEvents
      : Array.isArray(record?.openedAt)
        ? record.openedAt.map((openedAt) => ({ openedAt }))
        : [];
    return {
      id: record?.id || "",
      createdAt: record?.createdAt || record?.created_at || "",
      quote,
      openEvents: mergeQuoteOpenEvents(openEvents),
    };
  }

  function mergeQuoteOpenEvents(...eventLists) {
    const seen = new Set();
    return eventLists
      .flat()
      .map((event) => ({ openedAt: typeof event === "string" ? event : event?.openedAt }))
      .filter((event) => {
        if (!event.openedAt || seen.has(event.openedAt)) return false;
        seen.add(event.openedAt);
        return true;
      })
      .sort((a, b) => String(a.openedAt).localeCompare(String(b.openedAt)));
  }

  function shouldUseLocalServer() {
    return ["localhost", "127.0.0.1", ""].includes(window.location.hostname);
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

  async function saveSalespersonSettingsToSupabase(settings) {
    if (!supabaseClient) return;

    try {
      const { error } = await supabaseClient.from("salesperson_settings").upsert({
        id: "default",
        settings: normalizeSalespersonSettings(settings),
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
    } catch (error) {
      console.warn("Could not save salesperson settings to Supabase", error);
    }
  }

  async function saveClientLogoSettingsToSupabase(logos) {
    if (!supabaseClient) return;

    try {
      const { error } = await supabaseClient.from("client_logo_settings").upsert({
        id: "default",
        logos: normalizeClientLogos(logos),
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
    } catch (error) {
      console.warn("Could not save client logos to Supabase", error);
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
    if (signatureCanvas.setPointerCapture) {
      signatureCanvas.setPointerCapture(event.pointerId);
    }
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
    if (signatureCanvas.releasePointerCapture && signatureCanvas.hasPointerCapture?.(event.pointerId)) {
      signatureCanvas.releasePointerCapture(event.pointerId);
    }
    signatureIsDrawing = false;
    signatureLastPoint = null;
    quote.clientSignatureData = signatureCanvas.toDataURL("image/png");

    updateClientSignatureDateToToday();

    renderPreview();
  }

  function updateClientSignatureDateToToday() {
    quote.clientSignatureDate = todayIsoDate();
    const dateField = form.elements.clientSignatureDate;
    if (dateField) dateField.value = quote.clientSignatureDate;
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

  function scrollToClientSignature() {
    const signatureSection = document.getElementById("clientSignatureSection");
    if (!signatureSection) return;
    signatureSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function setupFloatingSignatureJump() {
    const jumpButton = document.getElementById("jumpToSignature");
    const signatureContainer = document.querySelector(".editor-panel");
    if (!jumpButton || !signatureContainer) return;

    const setJumpVisibility = (isSignatureVisible) => {
      jumpButton.classList.toggle("is-hidden", isSignatureVisible);
      jumpButton.setAttribute("aria-hidden", isSignatureVisible ? "true" : "false");
      jumpButton.tabIndex = isSignatureVisible ? -1 : 0;
    };

    if (!("IntersectionObserver" in window)) {
      setJumpVisibility(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setJumpVisibility(entry.isIntersecting);
      },
      { threshold: 0.01 }
    );

    observer.observe(signatureContainer);
  }

  function renderPreview() {
    preview.innerHTML = renderQuote(quote);
    window.requestAnimationFrame(fitPagesToFooter);
  }

  function handlePreviewSectionLinkClick(event) {
    const link = event.target.closest("a[href]");
    if (!link) return;

    const targetId = decodeURIComponent(new URL(link.href, window.location.href).hash.slice(1));
    if (!targetId.startsWith("quote-section-")) return;

    const target = document.getElementById(targetId);
    if (!target) return;

    event.preventDefault();
    const previewPanel = preview.closest(".preview-panel");
    if (previewPanel && previewPanel.scrollHeight > previewPanel.clientHeight) {
      const targetTop =
        target.getBoundingClientRect().top - previewPanel.getBoundingClientRect().top + previewPanel.scrollTop;
      previewPanel.scrollTo({ top: targetTop, behavior: "smooth" });
      return;
    }

    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderQuote(data) {
    const q = normalizeQuote(data, { syncDefaultTexts: false });
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
            <td><a href="${escapeAttr(sectionHref(section.key))}">${escapeHtml(section.title)}</a></td>
          </tr>
        `
      )
      .join("");

    return page(`
      <p class="date-line">${formatDate(q.quoteDate)}</p>
      <p class="recipient">לכבוד<br />${escapeHtml(q.contactName)}${contactTitle}<br />${escapeHtml(q.clientCompany)}</p>
      <p>${escapeHtml(greetingName)} שלום רב,</p>
      <div class="subject">${escapeHtml(renderSubjectLine(q))}</div>
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
      <section class="content-section">
        <h1 class="page-title">${sectionTitleLink("profile", sectionTitle(sections, "profile"))}</h1>
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
    const logos = normalizeClientLogos(q.clientLogos);
    const logosMarkup =
      logos.length === 1 && logos[0].src === LEGACY_CLIENT_LOGOS_SRC
        ? `<img class="clients-image" src="${escapeAttr(logos[0].src)}" alt="${escapeAttr(logos[0].name || "לקוחות Improve-IT")}" />`
        : `<div class="clients-logo-grid">
            ${logos
              .map(
                (logo) => `
                  <figure class="client-logo-card" style="--logo-scale: ${escapeAttr(logo.size / 100)}">
                    <img src="${escapeAttr(logo.src)}" alt="${escapeAttr(logo.name || "לוגו לקוח")}" />
                    ${logo.name ? `<figcaption>${escapeHtml(logo.name)}</figcaption>` : ""}
                  </figure>
                `
              )
              .join("")}
          </div>`;

    return page(`
      <section class="content-section">
        <h1 class="page-title">${sectionTitleLink("clients", q.clientsText || "מבין לקוחותינו")}</h1>
        ${logosMarkup}
      </section>
    `);
  }

  function renderBackgroundSolutionPage(q, sections) {
    const blocks = [];
    if (q.showBackground) {
      blocks.push(`
        <section class="content-section">
          <h1 class="page-title">${sectionTitleLink("background", sectionTitle(sections, "background"))}</h1>
          ${paragraphs(q.backgroundText)}
        </section>
      `);
    }

    if (q.showSolution) {
      blocks.push(`
        <section class="content-section">
          <h1 class="page-title">${sectionTitleLink("solution", sectionTitle(sections, "solution"))}</h1>
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
      <section class="content-section">
        <h1 class="page-title">${sectionTitleLink("work", sectionTitle(sections, "work"))}</h1>
        <ul class="bullet-list">
          ${processBullets.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
      </section>
      ${lmsBlock}
    `);
  }

  function renderPricingPage(q, sections) {
    const pricing = buildPricing(q);
    const planDescription = buildPricingPlanDescription(q);
    const planRow = planDescription
      ? `<tr class="pricing-plan-row"><td colspan="3">${escapeHtml(planDescription)}</td></tr>`
      : "";
    const rows = renderPricingRows(q, pricing.rows);

    const discountRow = pricing.discount
      ? `
        <tr class="discount-row">
          <td>${escapeHtml(q.discountTitle || "הנחה")}</td>
          <td class="price">${escapeHtml(formatDiscountTableValue(q, pricing))}</td>
          <td class="notes">${formatNotes(buildDiscountNote(q))}</td>
        </tr>
      `
      : "";
    const totalTable = q.showTotals
      ? `
        <table class="total-table">
          <tbody>
            <tr>
              <td>סה"כ לפני הנחה</td>
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
      <section class="content-section">
        <h1 class="page-title">${sectionTitleLink("pricing", sectionTitle(sections, "pricing"))}</h1>
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
        <section class="content-section">
          <h1 class="page-title">${sectionTitleLink("terms", termsTitle)}</h1>
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
        <section class="content-section">
          <h2>${sectionTitleLink("cancellation", cancellationTitle)}</h2>
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
        <div class="approval-field approval-field--signer">
          <span>שם</span>
          <div class="approval-signer-details">
            <strong>${escapeHtml(q.clientSignerName) || "&nbsp;"}</strong>
            ${signerTitle}
            ${signerCompany}
          </div>
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

  function sectionTitleLink(key, title) {
    const id = sectionId(key);
    return `<a class="section-title-link" id="${escapeAttr(id)}" name="${escapeAttr(id)}" href="${escapeAttr(sectionHref(key))}">${escapeHtml(title)}</a>`;
  }

  function sectionHref(key) {
    return `${getShareBaseUrl()}#${sectionId(key)}`;
  }

  function buildServiceDescription(q) {
    const pieces = q.includeLms
      ? [`שימוש ב${pricingOptionLabel(q, "includeLms", "מערכת LMS בענן")},`, "כולל לומדות מדף"]
      : ["שימוש בלומדות מדף"];
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

  function renderPricingRows(q, rows) {
    const courseRows = rows.filter((row) => row.kind === "course");
    const shouldMergeCourseNotes = Boolean(q.mergeCourseNotes && courseRows.length > 1);
    let courseRowIndex = 0;

    return rows
      .map((row) => {
        const isCourseRow = row.kind === "course";
        const notesCell = (() => {
          if (!shouldMergeCourseNotes || !isCourseRow) {
            return `<td class="notes">${formatNotes(row.notes || "")}</td>`;
          }

          courseRowIndex += 1;
          if (courseRowIndex > 1) return "";

          return `<td class="notes" rowspan="${courseRows.length}">${formatNotes(courseRows[0].notes || "")}</td>`;
        })();

        return `
          <tr>
            <td>${escapeHtml(row.title)}</td>
            <td class="price">${row.included ? "כלול" : formatCurrency(row.price)}</td>
            ${notesCell}
          </tr>
        `;
      })
      .join("");
  }

  function formatDiscountTableValue(q, pricing) {
    if (q.discountDisplayMode === "amount") return `-${formatCurrency(pricing.discount)}`;
    return `${formatPercent(q.discountPercent)}`;
  }

  function buildDefaultPricingItems(q) {
    const rows = q.includeLms ? buildLmsRentalRows(q) : buildShelfCoursePurchaseRows(q);

    if (q.includeHebrewVoiceover) {
      const hebrewVoiceover = buildHebrewVoiceoverRow(q);
      if (hebrewVoiceover) rows.push(hebrewVoiceover);
    }

    if (q.includeTranslation) {
      rows.push({
        title: pricingOptionLabel(q, "includeTranslation", "תרגום לשפה נוספת"),
        price: translationPrice(q),
        notes: q.includeLms
          ? "תרגום לשפה אחת מבין אנגלית, רוסית או ערבית. המחיר מתייחס לשפה אחת ולכל הלומדות בחבילה."
          : "תרגום לשפה אחת מבין אנגלית, רוסית או ערבית.",
        included: false,
      });
    }

    if (q.includeEnglishVoiceover) {
      rows.push({
        title: pricingOptionLabel(q, "includeEnglishVoiceover", "קריינות בשפה נוספת"),
        price: 950,
        notes: "קריינות בשפה נוספת באמצעות AI. המחיר מתייחס לשפה אחת.",
        included: false,
      });
    }

    if (q.includeLms) {
      rows.push({
        title: pricingOptionLabel(q, "includeLms", "מערכת LMS בענן"),
        price: 0,
        notes: "הקמת סביבת LMS, העלאת משתמשים ולומדות, והפקת דו\"חות חודשיים.",
        included: true,
      });
    }

    return rows.map(normalizePricingItem);
  }

  function buildLmsRentalRows(q) {
    const courseCount = Math.max(q.courseCount, q.courseNames.length);
    const rows = [];
    if (!courseCount) return rows;

    if (courseCount >= 3 && hasLmsPackagePrice(q.users)) {
      rows.push({
        title: buildLmsPackageTitle(q, Math.min(courseCount, 3)),
        price: lmsPackagePrice(q.users),
        kind: "course",
        notes: buildShelfCourseNotes(q),
        included: false,
      });
      for (let index = 3; index < courseCount; index += 1) {
        rows.push({
          title: buildAdditionalLmsCourseTitle(q, index),
          price: lmsAdditionalCoursePrice(q.users),
          kind: "course",
          notes: "",
          included: false,
        });
      }
      return rows;
    }

    rows.push({
      title: buildDefaultCourseTitle(q, 0),
      price: lmsSingleCoursePrice(q.users),
      kind: "course",
      notes: buildShelfCourseNotes(q),
      included: false,
    });

    for (let index = 1; index < courseCount; index += 1) {
      rows.push({
        title: buildAdditionalLmsCourseTitle(q, index),
        price: lmsAdditionalCoursePrice(q.users),
        kind: "course",
        notes: "",
        included: false,
      });
    }

    return rows;
  }

  function buildShelfCoursePurchaseRows(q) {
    const courseCount = Math.max(q.courseCount, q.courseNames.length, q.courseGroups.length);
    const rows = [];
    if (!courseCount) return rows;

    ["A", "B"].forEach((group) => {
      const courseIndexes = Array.from({ length: courseCount }, (_, index) => index).filter(
        (index) => normalizeCourseGroup(q.courseGroups[index]) === group
      );
      if (!courseIndexes.length) return;

      const packageCount = Math.min(courseIndexes.length, 3);
      const packagePrices = group === "B" ? SHELF_COURSE_GROUP_B_PACKAGE_PRICES : SHELF_COURSE_GROUP_A_PACKAGE_PRICES;
      rows.push({
        title:
          packageCount === 1
            ? buildPurchaseCourseTitle(q, courseIndexes[0], group)
            : `חבילת ${packageCount} לומדות מדף מקבוצה ${group}${courseNamesSummary(q, courseIndexes.slice(0, packageCount))}`,
        price: packagePrices[packageCount],
        kind: "course",
        notes: rows.length ? "" : buildShelfCourseNotes(q),
        included: false,
      });

      courseIndexes.slice(3).forEach((courseIndex) => {
        rows.push({
          title: `לומדת מדף נוספת מקבוצה ${group}${courseNameSuffix(q, courseIndex)}`,
          price: 2500,
          kind: "course",
          notes: "",
          included: false,
        });
      });
    });

    return rows;
  }

  function buildPurchaseCourseTitle(q, index, group) {
    return `לומדת מדף מקבוצה ${group}${courseNameSuffix(q, index)}`;
  }

  function courseNamesSummary(q, indexes) {
    const names = indexes.map((index) => q.courseNames[index]).filter(Boolean);
    return names.length ? ` - ${names.join(", ")}` : "";
  }

  function buildDefaultCourseTitle(q, index) {
    const namedSuffix = courseNameSuffix(q, index);
    const groupSuffix = ` מקבוצה ${normalizeCourseGroup(q.courseGroups[index])}`;
    const courseLabel =
      q.courseCount === 1 && !namedSuffix
        ? `לומדה אחת${groupSuffix}`
        : `לומדה ${index + 1}${groupSuffix}${namedSuffix}`;
    if (q.includeLms) return `מערכת LMS כולל ${courseLabel} עבור ${q.users} עובדים לשנה`;
    return `לומדת מדף ${index + 1}${groupSuffix}${namedSuffix}`;
  }

  function buildLmsPackageTitle(q, packageCount) {
    const groups = Array.from(
      new Set(Array.from({ length: packageCount }, (_, index) => normalizeCourseGroup(q.courseGroups[index])))
    );
    const groupLabel = groups.length === 1 ? ` מקבוצה ${groups[0]}` : ` מקבוצות ${groups.join(" ו-")}`;
    return `מערכת LMS כולל חבילת ${packageCount} לומדות מדף${groupLabel} עבור ${q.users} עובדים לשנה`;
  }

  function buildAdditionalLmsCourseTitle(q, index) {
    return `לומדה נוספת ${index + 1} מקבוצה ${normalizeCourseGroup(q.courseGroups[index])}${courseNameSuffix(
      q,
      index
    )} במערכת LMS עבור ${q.users} עובדים לשנה`;
  }

  function courseNameSuffix(q, index) {
    const name = q.courseNames[index] || "";
    return name && !/^לומד(?:ה|ת)\s+מדף\s*\d+$/i.test(name) ? ` - ${name}` : "";
  }

  function buildShelfCourseNotes(q) {
    return [
      "המחיר כולל הוספת לוגו, שם לקוח וממונה ועד 100 מילים שינוי טקסט.",
      q.bilingualCourse ? "ההצעה מתייחסת ללומדות בשפות עברית ואנגלית." : "ההצעה מתייחסת ללומדות בשפה העברית בלבד.",
      q.includeLms ? "מסלול השכרה שנתי במערכת LMS." : "",
      q.includeLms && q.courseCount >= 4 ? "בחבילה של 4 לומדות או יותר תינתן הנחה של 10% על החבילה." : "",
      q.includeLms ? "בעת חידוש הסכם ניתן להחליף גרסה בהתאם לתנאי המחירון." : "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  function buildHebrewVoiceoverRow(q) {
    if (q.courseCount >= 2) {
      return {
        title: pricingOptionLabel(q, "includeHebrewVoiceover", "קריינות בעברית"),
        price: 0,
        notes: q.includeLms
          ? "בהשכרת 2 לומדות ומעלה הקריינות בעברית כלולה במחיר."
          : "בהזמנה של 2 לומדות ומעלה בשפה העברית הקריינות כלולה במחיר.",
        included: true,
      };
    }

    return {
      title: pricingOptionLabel(q, "includeHebrewVoiceover", "קריינות בעברית"),
      price: q.includeLms || normalizeCourseGroup(q.courseGroups[0]) === "B" ? 450 : 350,
      notes: "התאמת קריינות בעברית ללומדה אחת.",
      included: false,
    };
  }

  function lmsSingleCoursePrice(users) {
    return priceFromTier(LMS_SINGLE_COURSE_TIERS, users);
  }

  function lmsPackagePrice(users) {
    return priceFromTier(LMS_THREE_COURSE_PACKAGE_TIERS, users);
  }

  function lmsAdditionalCoursePrice(users) {
    if (users <= 500) return 1200;
    if (users <= 700) return 2500;
    if (users <= 850) return 3000;
    return 3500;
  }

  function hasLmsPackagePrice(users) {
    return LMS_THREE_COURSE_PACKAGE_TIERS.some((tier) => users >= tier.minUsers && users <= tier.maxUsers);
  }

  function translationPrice(q) {
    const pricePerCourse = q.includeLms ? 750 : 950;
    return pricePerCourse * Math.max(1, q.courseCount);
  }

  function priceFromTier(tiers, users) {
    const tier = tiers.find((item) => users >= (item.minUsers || 1) && users <= item.maxUsers);
    return tier ? tier.price : tiers[tiers.length - 1].price;
  }

  function normalizeCourseGroup(value) {
    return String(value || "").toUpperCase() === "B" ? "B" : "A";
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
      kind: item?.kind === "course" ? "course" : "",
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
    return "פירוט הרכיבים, העלויות והתכולות הכלולות בהצעה";
  }

  function buildPricingPlanDescription(q) {
    const label = String(q.pricingPlanLabel || "").trim();
    const startDate = q.rentalStartDate ? formatDotDate(q.rentalStartDate) : "";
    const endDate = q.rentalEndDate ? formatDotDate(q.rentalEndDate) : "";
    let rentalPeriod = "";

    if (startDate && endDate) rentalPeriod = `תקופת השכרה: ${startDate} עד ${endDate}`;
    else if (startDate) rentalPeriod = `תחילת השכרה: ${startDate}`;
    else if (endDate) rentalPeriod = `סיום השכרה: ${endDate}`;

    return [label, rentalPeriod].filter(Boolean).join(" | ");
  }

  function buildDiscountNote(q) {
    const percent = q.discountPercent ? `תינתן הנחה של ${q.discountPercent}%` : "תינתן הנחה";
    if (!q.discountValidUntil) return percent;
    return `${percent} במידה ותתקבל הזמנת עבודה עד ה-${formatDotDate(q.discountValidUntil)}`;
  }

  function formatPercent(value) {
    const percent = new Intl.NumberFormat("he-IL", { maximumFractionDigits: 1 }).format(numberOr(value, 0));
    return `${percent}%`;
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
    const amount = new Intl.NumberFormat("he-IL", { maximumFractionDigits: 2 }).format(numberOr(value, 0));
    return `${amount} ₪`;
  }

  function formatNumber(value) {
    return new Intl.NumberFormat("he-IL", { maximumFractionDigits: 0 }).format(numberOr(value, 0));
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

  function createId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function createShortId(prefix) {
    return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  }

  function monthEndIsoDate(value) {
    const date = parseIsoDate(value) || parseIsoDate(todayIsoDate());
    return new Date(Date.UTC(date.year, date.month, 0)).toISOString().slice(0, 10);
  }

  function parseIsoDate(value) {
    const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;

    return { year, month, day };
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
