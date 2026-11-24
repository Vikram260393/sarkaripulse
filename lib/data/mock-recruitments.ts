import { RecruitmentRecord } from "@/lib/types/recruitment";

/**
 * PHASE 2 SYNTHETIC PREVIEW FIXTURES
 * ----------------------------------
 * Per Blueprint Appendix B ("Do not use placeholder domains or dates in production records"),
 * every record below is explicitly flagged `isSamplePreview: true` and uses clearly marked
 * synthetic reference numbers and illustrative URLs. Live official records will be ingested
 * only after Phase 3 (Supabase DB + RLS) and Phase 4 (Official Source Verification Gate).
 */
export const MOCK_RECRUITMENTS: readonly RecruitmentRecord[] = [
  {
    id: "sample-mh-mpsc-001",
    slug: "maharashtra-group-b-non-gazetted-sample-preview",
    isSamplePreview: true,
    title: {
      en: "Maharashtra Group-B (Non-Gazetted) Combined Services — Sample Preview",
      hi: "महाराष्ट्र ग्रुप-बी (अराजपत्रित) संयुक्त सेवा — नमूना पूर्वावलोकन",
      mr: "महाराष्ट्र गट-ब (अराजपत्रित) संयुक्त सेवा — नमुना पूर्वावलोकन",
    },
    summary: {
      en: "Sample Phase 2 layout fixture demonstrating Maharashtra priority recruitment structure, multi-post breakdown, date-only calendar display, and Devanagari rendering.",
      hi: "महाराष्ट्र प्राथमिकता भर्ती संरचना, पद-वार विवरण, कैलेंडर तिथियों और देवनागरी रेंडरिंग के परीक्षण हेतु चरण 2 नमूना रिकॉर्ड।",
      mr: "महाराष्ट्र प्राधान्य भरती रचना, पदानुसार तपशील, कॅलेंडर तारखा आणि देवनागरी रेंडरिंग तपासणीसाठी टप्पा २ नमुना नोंद.",
    },
    organisation: {
      en: "Maharashtra Public Service Commission (MPSC)",
      hi: "महाराष्ट्र लोक सेवा आयोग (MPSC)",
      mr: "महाराष्ट्र लोकसेवा आयोग (MPSC)",
    },
    officialEnglishOrganisation: "Maharashtra Public Service Commission (MPSC)",
    department: {
      en: "General Administration Department, Maharashtra",
      hi: "सामान्य प्रशासन विभाग, महाराष्ट्र",
      mr: "सामान्य प्रशासन विभाग, महाराष्ट्र शासन",
    },
    stateCode: "MH",
    stateSlug: "maharashtra",
    categorySlug: "state-jobs",
    qualificationSlugs: ["graduate"],
    cycleLabel: "2026-27",
    notificationReference: "SAMPLE-MPSC-2026-01",
    vacancyTotal: 480,
    employmentType: "permanent",
    lifecycleStatus: "application_open",
    verificationStatus: "verified",
    editorialState: "published",
    availableLanguages: ["en", "hi", "mr"],
    firstPublishedAt: "2026-11-18T06:30:00Z",
    lastVerifiedAt: "2026-11-23T09:15:00Z",
    applicationStart: "2026-11-20",
    applicationEnd: "2026-12-18",
    minAge: 18,
    maxAge: 38,
    ageCutOffDate: "2027-01-01",
    ageRelaxationNote: {
      en: "Age relaxation for Backward Classes (up to 5 years), Persons with Benchmark Disabilities, and Ex-Servicemen applies strictly as per Maharashtra Government rules stated in the official notification.",
      hi: "पिछड़ा वर्ग (5 वर्ष तक), दिव्यांगजन और पूर्व सैनिकों के लिए आयु छूट महाराष्ट्र सरकार के आधिकारिक अधिसूचना नियमों के अनुसार लागू होगी।",
      mr: "मागासवर्गीय उमेदवार (५ वर्षांपर्यंत), दिव्यांग आणि माजी सैनिकांसाठी वयोमर्यादा सूट अधिकृत जाहिरातीतील महाराष्ट्र शासन नियमांनुसार लागू राहील.",
    },
    experienceRequirement: {
      en: "No prior work experience specified for standard Group-B posts in this sample fixture. Confirm post-specific rules in the original notice.",
      hi: "इस नमूना रिकॉर्ड में सामान्य ग्रुप-बी पदों के लिए पूर्व अनुभव निर्दिष्ट नहीं है। मूल अधिसूचना में पद-वार नियम जांचें।",
      mr: "या नमुना नोंदीत सामान्य गट-ब पदांसाठी पूर्वानुभव नमूद नाही. मूळ जाहिरातीत पदानुसार अटी तपासा.",
    },
    paySummary: {
      displayLabel: "Pay Matrix Level S-14 (₹38,600 – ₹1,22,800 basic pay)",
      period: "pay_level",
      isApproximate: false,
      sourceBasis: {
        en: "Based on Maharashtra 7th Pay Commission Level S-14 basic pay scale; actual in-hand allowances vary by posting location.",
        hi: "महाराष्ट्र 7वें वेतन आयोग स्तर S-14 मूल वेतनमान पर आधारित; वास्तविक भत्ते तैनाती स्थान के अनुसार भिन्न होते हैं।",
        mr: "महाराष्ट्र ७ व्या वेतन आयोगाच्या स्तर S-14 मूळ वेतनश्रेणीनुसार; प्रत्यक्ष भत्ते नेमणुकीच्या ठिकाणानुसार बदलू शकतात.",
      },
    },
    posts: [
      {
        postName: {
          en: "Assistant Section Officer (ASO)",
          hi: "सहायक अनुभाग अधिकारी (ASO)",
          mr: "सहाय्यक कक्ष अधिकारी (ASO)",
        },
        postCode: "ASO-GB",
        vacancyCount: 160,
        payLevel: "S-14",
        qualificationSummary: {
          en: "Recognised University Degree + Marathi language proficiency",
          hi: "मान्यता प्राप्त विश्वविद्यालय की स्नातक डिग्री + मराठी भाषा ज्ञान",
          mr: "मान्यताप्राप्त विद्यापीठाची पदवी + मराठी भाषेचे ज्ञान",
        },
        ageRange: "18–38 years",
      },
      {
        postName: {
          en: "State Tax Inspector (STI)",
          hi: "राज्य कर निरीक्षक (STI)",
          mr: "राज्य कर निरीक्षक (STI)",
        },
        postCode: "STI-GB",
        vacancyCount: 200,
        payLevel: "S-14",
        qualificationSummary: {
          en: "Recognised University Degree + Marathi language proficiency",
          hi: "मान्यता प्राप्त विश्वविद्यालय की स्नातक डिग्री + मराठी भाषा ज्ञान",
          mr: "मान्यताप्राप्त विद्यापीठाची पदवी + मराठी भाषेचे ज्ञान",
        },
        ageRange: "18–38 years",
      },
      {
        postName: {
          en: "Police Sub-Inspector (PSI)",
          hi: "पुलिस उप-निरीक्षक (PSI)",
          mr: "पोलीस उपनिरीक्षक (PSI)",
        },
        postCode: "PSI-GB",
        vacancyCount: 120,
        payLevel: "S-14",
        qualificationSummary: {
          en: "Recognised University Degree + Physical standards per notice",
          hi: "मान्यता प्राप्त विश्वविद्यालय की स्नातक डिग्री + शारीरिक मानक",
          mr: "मान्यताप्राप्त विद्यापीठाची पदवी + जाहिरातीनुसार शारीरिक पात्रता",
        },
        ageRange: "19–31 years",
      },
    ],
    dates: [
      {
        dateType: "notification",
        label: { en: "Official Notification Date", hi: "अधिसूचना तिथि", mr: "जाहिरात दिनांक" },
        eventDate: "2026-11-18",
      },
      {
        dateType: "application_start",
        label: { en: "Online Application Start", hi: "ऑनलाइन आवेदन प्रारंभ", mr: "ऑनलाइन अर्ज सुरू" },
        eventDate: "2026-11-20",
      },
      {
        dateType: "application_end",
        label: { en: "Online Application Closing Date", hi: "ऑनलाइन आवेदन अंतिम तिथि", mr: "ऑनलाइन अर्ज अंतिम तारीख" },
        eventDate: "2026-12-18",
      },
      {
        dateType: "fee_payment_deadline",
        label: { en: "Online Fee Payment Last Date", hi: "ऑनलाइन शुल्क भुगतान अंतिम तिथि", mr: "ऑनलाइन शुल्क भरण्याची अंतिम तारीख" },
        eventDate: "2026-12-19",
      },
      {
        dateType: "exam_date",
        label: { en: "Preliminary Examination Date", hi: "प्रारंभिक परीक्षा तिथि", mr: "पूर्व परीक्षा दिनांक" },
        eventDate: "2027-02-21",
        isTentative: true,
      },
    ],
    feeSchedule: [
      {
        category: { en: "Unreserved / Open Category", hi: "अनारक्षित / सामान्य वर्ग", mr: "अमागास / खुला प्रवर्ग" },
        amountInr: 394,
      },
      {
        category: { en: "Backward Classes / EWS / Orphan / PwBD", hi: "पिछड़ा वर्ग / EWS / अनाथ / दिव्यांग", mr: "मागासवर्गीय / आर्थिकदृष्ट्या दुर्बल / अनाथ / दिव्यांग" },
        amountInr: 294,
      },
    ],
    selectionStages: [
      { en: "Stage 1: Combined Preliminary Examination (Objective MCQ)", hi: "चरण 1: संयुक्त प्रारंभिक परीक्षा (वस्तुनिष्ठ)", mr: "टप्पा १: संयुक्त पूर्व परीक्षा (वस्तुनिष्ठ बहुपर्यायी)" },
      { en: "Stage 2: Main Examination", hi: "चरण 2: मुख्य परीक्षा", mr: "टप्पा २: मुख्य परीक्षा" },
      { en: "Stage 3: Physical Test & Interview (applicable for PSI only)", hi: "चरण 3: शारीरिक परीक्षण और साक्षात्कार (केवल PSI के लिए)", mr: "टप्पा ३: शारीरिक चाचणी व मुलाखत (केवळ PSI साठी)" },
      { en: "Stage 4: Document Verification", hi: "चरण 4: दस्तावेज़ सत्यापन", mr: "टप्पा ४: कागदपत्र पडताळणी" },
    ],
    examPatternSummary: {
      en: "Preliminary Examination carries 100 objective questions (100 marks, 60 minutes) covering Current Affairs, Civics, History, Geography, Economy, General Science, and Mental Ability. Confirm exact negative marking and syllabus in the official notification.",
      hi: "प्रारंभिक परीक्षा में 100 वस्तुनिष्ठ प्रश्न (100 अंक, 60 मिनट) होते हैं। सटीक नकारात्मक अंकन और पाठ्यक्रम के लिए आधिकारिक अधिसूचना देखें।",
      mr: "पूर्व परीक्षेत १०० वस्तुनिष्ठ प्रश्न (१०० गुण, ६० मिनिटे) असतात. अचूक नकारात्मक गुणांकन व अभ्यासक्रमासाठी अधिकृत जाहिरात पहा.",
    },
    requiredDocuments: [
      { en: "SSC (10th) Certificate for Date of Birth verification", hi: "जन्म तिथि सत्यापन हेतु 10वीं प्रमाणपत्र", mr: "जन्मतारखेच्या पुराव्यासाठी १०वी प्रमाणपत्र" },
      { en: "Graduation Marksheet / Degree Certificate", hi: "स्नातक अंकतालिका / डिग्री प्रमाणपत्र", mr: "पदवी गुणपत्रिका / पदवी प्रमाणपत्र" },
      { en: "Maharashtra Domicile Certificate & Caste/Non-Creamy Layer Certificate (where applicable)", hi: "महाराष्ट्र अधिवास एवं जाति/नॉन-क्रीमी लेयर प्रमाणपत्र (जहां लागू हो)", mr: "महाराष्ट्र अधिवास व जात/नॉन-क्रिमीलेयर प्रमाणपत्र (लागू असल्यास)" },
      { en: "Recent passport-size photograph & signature matching portal dimensions", hi: "पोर्टल निर्देशानुसार नवीनतम फोटो व हस्ताक्षर", mr: "पोर्टलच्या नियमांनुसार अलीकडील छायाचित्र व स्वाक्षरी" },
    ],
    applicationSteps: [
      { en: "Read the official notification carefully and verify post-wise eligibility and dates.", hi: "आधिकारिक अधिसूचना ध्यानपूर्वक पढ़ें और पात्रता व तिथियां जांचें।", mr: "अधिकृत जाहिरात काळजीपूर्वक वाचा आणि पात्रता व तारखा तपासा." },
      { en: "Open the verified official recruitment portal link listed below.", hi: "नीचे दिए गए सत्यापित आधिकारिक भर्ती पोर्टल लिंक पर जाएं।", mr: "खालील सत्यापित अधिकृत भरती पोर्टल लिंक उघडा." },
      { en: "Create or update your candidate profile on the official portal and select the active advertisement.", hi: "आधिकारिक पोर्टल पर प्रोफ़ाइल बनाएं/अपडेट करें और सक्रिय विज्ञापन चुनें।", mr: "अधिकृत पोर्टलवर प्रोफाइल तयार/अद्ययावत करा आणि सक्रिय जाहिरात निवडा." },
      { en: "Complete fee payment exclusively on the official portal and save the confirmation receipt.", hi: "शुल्क का भुगतान केवल आधिकारिक पोर्टल पर करें और रसीद सुरक्षित रखें।", mr: "अर्ज शुल्क केवळ अधिकृत पोर्टलवरच भरा आणि पावती जतन करा." },
    ],
    links: [
      {
        linkType: "official_notification",
        label: { en: "Official Notification Portal (Sample Preview URL)", hi: "आधिकारिक अधिसूचना पोर्टल (नमूना लिंक)", mr: "अधिकृत जाहिरात पोर्टल (नमुना लिंक)" },
        url: "https://mpsc.gov.in/",
        isVerifiedOfficial: false,
        linkStatus: "requires_review",
      },
      {
        linkType: "official_apply",
        label: { en: "Official Online Application Portal (Sample Preview URL)", hi: "आधिकारिक ऑनलाइन आवेदन पोर्टल (नमूना लिंक)", mr: "अधिकृत ऑनलाइन अर्ज पोर्टल (नमुना लिंक)" },
        url: "https://mpsconline.gov.in/",
        isVerifiedOfficial: false,
        linkStatus: "requires_review",
      },
    ],
    faqs: [
      {
        question: { en: "What is the closing date in this sample notice?", hi: "इस नमूना अधिसूचना की अंतिम तिथि क्या है?", mr: "या नमुना जाहिरातीची अंतिम तारीख काय आहे?" },
        answer: { en: "The sample closing date shown is 18 Dec 2026. Always confirm live deadlines directly on the official portal.", hi: "इस नमूना रिकॉर्ड में अंतिम तिथि 18 दिसंबर 2026 दर्शाई गई है। कृपया वास्तविक तिथि आधिकारिक पोर्टल पर जांचें।", mr: "या नमुना नोंदीत अंतिम तारीख १८ डिसेंबर २०२६ दाखवली आहे. प्रत्यक्ष मुदत अधिकृत पोर्टलवर तपासा." },
      },
      {
        question: { en: "Does SarkariPulse accept applications or exam fees?", hi: "क्या SarkariPulse आवेदन या शुल्क स्वीकार करता है?", mr: "SarkariPulse अर्ज किंवा परीक्षा शुल्क स्वीकारते का?" },
        answer: { en: "No. SarkariPulse is strictly an independent information service. Applications and fees are submitted only on the recruiting authority's official portal.", hi: "नहीं। SarkariPulse केवल एक स्वतंत्र सूचना मंच है। आवेदन और शुल्क केवल आधिकारिक पोर्टल पर जमा किए जाते हैं।", mr: "नाही. SarkariPulse हा केवळ स्वतंत्र माहिती मंच आहे. अर्ज व शुल्क केवळ अधिकृत भरती पोर्टलवरच भरावे लागते." },
      },
    ],
    sourceCitations: [
      {
        sourceName: "Phase 2 Synthetic Fixture (Pending Phase 4 Tier 1 MPSC Onboarding)",
        officialDomain: "mpsc.gov.in",
        documentReference: "SAMPLE-MPSC-2026-01",
        retrievedAt: "2026-11-23T09:15:00Z",
      },
    ],
    updateHistory: [
      {
        updatedAt: "2026-11-23T09:15:00Z",
        summary: {
          en: "Sample fixture published for Phase 2 frontend, multilingual, and accessibility review.",
          hi: "चरण 2 फ्रंटएंड, बहुभाषी और सुगम्यता समीक्षा हेतु नमूना रिकॉर्ड प्रकाशित।",
          mr: "टप्पा २ फ्रंटएंड, बहुभाषिक आणि सुलभता तपासणीसाठी नमुना नोंद प्रकाशित.",
        },
        sourceReference: "SAMPLE-MPSC-2026-01",
      },
    ],
  },
  {
    id: "sample-mh-police-002",
    slug: "maharashtra-police-constable-bharti-sample-preview",
    isSamplePreview: true,
    title: {
      en: "Maharashtra Police Constable Recruitment — Sample Preview",
      hi: "महाराष्ट्र पुलिस कांस्टेबल भर्ती — नमूना पूर्वावलोकन",
      mr: "महाराष्ट्र पोलीस शिपाई भरती — नमुना पूर्वावलोकन",
    },
    summary: {
      en: "Sample 12th-pass Maharashtra Police recruitment card demonstrating closing-soon badge styling, physical + written stages, and regional language parity.",
      hi: "12वीं पास महाराष्ट्र पुलिस भर्ती हेतु नमूना रिकॉर्ड — अंतिम तिथि निकट बैज और चयन चरण प्रदर्शन।",
      mr: "१२वी उत्तीर्ण महाराष्ट्र पोलीस भरतीसाठी नमुना नोंद — अंतिम तारीख जवळ बॅज आणि निवड टप्पे.",
    },
    organisation: {
      en: "Maharashtra State Police",
      hi: "महाराष्ट्र राज्य पुलिस",
      mr: "महाराष्ट्र राज्य पोलीस",
    },
    officialEnglishOrganisation: "Maharashtra State Police",
    department: {
      en: "Home Department, Government of Maharashtra",
      hi: "गृह विभाग, महाराष्ट्र सरकार",
      mr: "गृह विभाग, महाराष्ट्र शासन",
    },
    stateCode: "MH",
    stateSlug: "maharashtra",
    categorySlug: "police",
    qualificationSlugs: ["12th-pass"],
    cycleLabel: "2026",
    notificationReference: "SAMPLE-MHPOL-2026-14",
    vacancyTotal: 2150,
    employmentType: "permanent",
    lifecycleStatus: "closing_soon",
    verificationStatus: "verified",
    editorialState: "published",
    availableLanguages: ["en", "hi", "mr"],
    firstPublishedAt: "2026-11-05T07:00:00Z",
    lastVerifiedAt: "2026-11-23T08:40:00Z",
    applicationStart: "2026-11-06",
    applicationEnd: "2026-11-28",
    minAge: 18,
    maxAge: 28,
    ageCutOffDate: "2026-11-28",
    ageRelaxationNote: {
      en: "Upper age relaxation up to 5 years for reserved categories as per Maharashtra Police recruitment rules in the official advertisement.",
      hi: "आरक्षित वर्गों के लिए आधिकारिक विज्ञापन के अनुसार 5 वर्ष तक की आयु छूट।",
      mr: "मागासवर्गीय उमेदवारांसाठी अधिकृत जाहिरातीनुसार ५ वर्षांपर्यंत वयोमर्यादा सूट.",
    },
    experienceRequirement: {
      en: "Not specified in the notification (entry-level recruitment).",
      hi: "अधिसूचना में निर्दिष्ट नहीं।",
      mr: "अधिसूचनेत नमूद नाही.",
    },
    paySummary: {
      displayLabel: "₹21,700 – ₹69,100 (Pay Matrix Level S-7)",
      period: "pay_level",
      isApproximate: false,
      sourceBasis: {
        en: "Maharashtra 7th Pay Commission Level S-7 scale.",
        hi: "महाराष्ट्र 7वां वेतन आयोग स्तर S-7 वेतनमान।",
        mr: "महाराष्ट्र ७ वा वेतन आयोग स्तर S-7 वेतनश्रेणी.",
      },
    },
    posts: [
      {
        postName: { en: "Police Constable", hi: "पुलिस कांस्टेबल", mr: "पोलीस शिपाई" },
        vacancyCount: 1800,
        payLevel: "S-7",
        qualificationSummary: { en: "12th Pass (HSC) from a recognised board", hi: "मान्यता प्राप्त बोर्ड से 12वीं पास", mr: "मान्यताप्राप्त मंडळातून १२वी उत्तीर्ण" },
        ageRange: "18–28 years",
      },
      {
        postName: { en: "Police Constable Driver", hi: "पुलिस कांस्टेबल चालक", mr: "पोलीस शिपाई चालक" },
        vacancyCount: 350,
        payLevel: "S-7",
        qualificationSummary: { en: "12th Pass + valid LMV driving licence", hi: "12वीं पास + वैध LMV ड्राइविंग लाइसेंस", mr: "१२वी उत्तीर्ण + वैध LMV वाहन चालक परवाना" },
        ageRange: "19–28 years",
      },
    ],
    dates: [
      { dateType: "application_start", label: { en: "Application Start Date", hi: "आवेदन प्रारंभ तिथि", mr: "अर्ज सुरू तारीख" }, eventDate: "2026-11-06" },
      { dateType: "application_end", label: { en: "Application Closing Date", hi: "आवेदन अंतिम तिथि", mr: "अर्ज अंतिम तारीख" }, eventDate: "2026-11-28" },
      { dateType: "exam_date", label: { en: "Physical Efficiency Test", hi: "शारीरिक दक्षता परीक्षा", mr: "मैदानी चाचणी" }, eventDate: null },
    ],
    feeSchedule: [
      { category: { en: "Open Category", hi: "सामान्य वर्ग", mr: "खुला प्रवर्ग" }, amountInr: 450 },
      { category: { en: "Reserved Category", hi: "आरक्षित वर्ग", mr: "मागासवर्गीय" }, amountInr: 350 },
    ],
    selectionStages: [
      { en: "Physical Standard & Physical Efficiency Test (50 marks)", hi: "शारीरिक मानक और दक्षता परीक्षा (50 अंक)", mr: "शारीरिक मोजमाप व मैदानी चाचणी (५० गुण)" },
      { en: "Written Examination (100 marks)", hi: "लिखित परीक्षा (100 अंक)", mr: "लेखी परीक्षा (१०० गुण)" },
      { en: "Document Verification & Medical Examination", hi: "दस्तावेज़ सत्यापन और चिकित्सा परीक्षा", mr: "कागदपत्र पडताळणी व वैद्यकीय तपासणी" },
    ],
    examPatternSummary: {
      en: "Written paper includes Marathi Grammar, General Knowledge & Current Affairs, Mathematics, and Intellectual Test.",
      hi: "लिखित परीक्षा में मराठी व्याकरण, सामान्य ज्ञान, गणित और बुद्धिमत्ता परीक्षण शामिल हैं।",
      mr: "लेखी परीक्षेत मराठी व्याकरण, सामान्य ज्ञान व चालू घडामोडी, अंकगणित आणि बुद्धिमत्ता चाचणी यांचा समावेश असतो.",
    },
    requiredDocuments: [
      { en: "10th and 12th Pass Certificates", hi: "10वीं और 12वीं उत्तीर्ण प्रमाणपत्र", mr: "१०वी व १२वी उत्तीर्ण प्रमाणपत्रे" },
      { en: "Domicile & Category Certificates (as applicable)", hi: "अधिवास एवं श्रेणी प्रमाणपत्र (लागू होने पर)", mr: "अधिवास व प्रवर्ग प्रमाणपत्र (लागू असल्यास)" },
    ],
    applicationSteps: [
      { en: "Review unit-wise vacancies in the official recruitment notice.", hi: "आधिकारिक अधिसूचना में इकाई-वार रिक्तियां जांचें।", mr: "अधिकृत जाहिरातीत घटकनिहाय पदसंख्या तपासा." },
      { en: "Submit the online form via the official Maharashtra Police recruitment portal.", hi: "आधिकारिक महाराष्ट्र पुलिस भर्ती पोर्टल से ऑनलाइन फॉर्म भरें।", mr: "अधिकृत महाराष्ट्र पोलीस भरती पोर्टलवर ऑनलाइन अर्ज सादर करा." },
    ],
    links: [
      {
        linkType: "official_website",
        label: { en: "Official Maharashtra Police Portal (Sample Preview URL)", hi: "आधिकारिक महाराष्ट्र पुलिस पोर्टल (नमूना)", mr: "अधिकृत महाराष्ट्र पोलीस पोर्टल (नमुना)" },
        url: "https://mahapolice.gov.in/",
        isVerifiedOfficial: false,
        linkStatus: "requires_review",
      },
    ],
    faqs: [
      {
        question: { en: "What is the minimum educational qualification?", hi: "न्यूनतम शैक्षणिक योग्यता क्या है?", mr: "किमान शैक्षणिक पात्रता काय आहे?" },
        answer: { en: "12th Pass (HSC) from a recognised board in this sample fixture.", hi: "इस नमूना रिकॉर्ड में मान्यता प्राप्त बोर्ड से 12वीं पास।", mr: "या नमुना नोंदीत मान्यताप्राप्त मंडळातून १२वी उत्तीर्ण." },
      },
    ],
    sourceCitations: [
      {
        sourceName: "Phase 2 Synthetic Fixture (Pending Phase 4 Tier 1 Onboarding)",
        officialDomain: "mahapolice.gov.in",
        documentReference: "SAMPLE-MHPOL-2026-14",
        retrievedAt: "2026-11-23T08:40:00Z",
      },
    ],
    updateHistory: [
      {
        updatedAt: "2026-11-23T08:40:00Z",
        summary: { en: "Closing-soon sample state configured for UI testing.", hi: "यूआई परीक्षण हेतु अंतिम तिथि निकट नमूना स्थिति।", mr: "यूआय चाचणीसाठी अंतिम तारीख जवळ नमुना स्थिती." },
        sourceReference: "SAMPLE-MHPOL-2026-14",
      },
    ],
  },
  {
    id: "sample-central-ssc-003",
    slug: "ssc-combined-higher-secondary-level-sample-preview",
    isSamplePreview: true,
    title: {
      en: "SSC Combined Higher Secondary Level (10+2) — Sample Preview",
      hi: "SSC संयुक्त उच्चतर माध्यमिक स्तर (10+2) — नमूना पूर्वावलोकन",
      mr: "SSC संयुक्त उच्च माध्यमिक स्तर (१०+२) — नमुना पूर्वावलोकन",
    },
    summary: {
      en: "Sample Central Government 12th-pass recruitment demonstrating Admit Card Released lifecycle state and English/Hindi-only translation fallback testing for Marathi.",
      hi: "केंद्र सरकार की 12वीं पास भर्ती का नमूना रिकॉर्ड — प्रवेश पत्र जारी स्थिति के साथ।",
    },
    organisation: {
      en: "Staff Selection Commission (SSC)",
      hi: "कर्मचारी चयन आयोग (SSC)",
      mr: "कर्मचारी निवड आयोग (SSC)",
    },
    officialEnglishOrganisation: "Staff Selection Commission (SSC)",
    department: {
      en: "Central Ministries & Government Departments",
      hi: "केंद्रीय मंत्रालय एवं सरकारी विभाग",
      mr: "केंद्रीय मंत्रालये व शासकीय विभाग",
    },
    stateCode: "IN",
    stateSlug: "all-india",
    categorySlug: "central-government",
    qualificationSlugs: ["12th-pass"],
    cycleLabel: "2026",
    notificationReference: "SAMPLE-SSC-CHSL-2026",
    vacancyTotal: 3200,
    employmentType: "permanent",
    lifecycleStatus: "admit_card_released",
    verificationStatus: "verified",
    editorialState: "published",
    // Intentionally omits "mr" to test graceful Marathi fallback banner (Blueprint Ch. 14)
    availableLanguages: ["en", "hi"],
    firstPublishedAt: "2026-09-10T06:00:00Z",
    lastVerifiedAt: "2026-11-22T12:30:00Z",
    applicationStart: "2026-09-10",
    applicationEnd: "2026-10-12",
    minAge: 18,
    maxAge: 27,
    ageCutOffDate: "2026-08-01",
    ageRelaxationNote: {
      en: "SC/ST: 5 years, OBC: 3 years, PwBD: 10–15 years as per central government norms in the official notice.",
      hi: "SC/ST: 5 वर्ष, OBC: 3 वर्ष, दिव्यांग: 10–15 वर्ष (आधिकारिक अधिसूचना के अनुसार)।",
    },
    experienceRequirement: {
      en: "No prior experience required.",
      hi: "कोई पूर्व अनुभव आवश्यक नहीं।",
    },
    paySummary: {
      displayLabel: "Pay Level 2 (₹19,900 – ₹63,200) to Level 4 (₹25,500 – ₹81,100)",
      period: "pay_level",
      isApproximate: false,
      sourceBasis: {
        en: "Central 7th CPC Pay Matrix for LDC/JSA and DEO posts.",
        hi: "LDC/JSA और DEO पदों के लिए 7वां केंद्रीय वेतन आयोग वेतनमान।",
      },
    },
    posts: [
      {
        postName: { en: "Lower Division Clerk (LDC) / JSA", hi: "लोअर डिवीजन क्लर्क (LDC) / JSA" },
        vacancyCount: 2500,
        payLevel: "Level-2",
        qualificationSummary: { en: "12th Standard or equivalent", hi: "12वीं कक्षा या समकक्ष" },
        ageRange: "18–27 years",
      },
      {
        postName: { en: "Data Entry Operator (DEO)", hi: "डेटा एंट्री ऑपरेटर (DEO)" },
        vacancyCount: 700,
        payLevel: "Level-4",
        qualificationSummary: { en: "12th Pass (Science with Mathematics for specified departments)", hi: "12वीं पास (निर्दिष्ट विभागों हेतु गणित सहित विज्ञान)" },
        ageRange: "18–27 years",
      },
    ],
    dates: [
      { dateType: "application_start", label: { en: "Application Start", hi: "आवेदन प्रारंभ" }, eventDate: "2026-09-10" },
      { dateType: "application_end", label: { en: "Application Closed", hi: "आवेदन समाप्त" }, eventDate: "2026-10-12" },
      { dateType: "admit_card", label: { en: "Tier-I Admit Card Available", hi: "टियर-I प्रवेश पत्र उपलब्ध" }, eventDate: "2026-11-22" },
      { dateType: "exam_date", label: { en: "Tier-I Computer Based Examination", hi: "टियर-I कंप्यूटर आधारित परीक्षा" }, eventDate: "2026-12-02" },
    ],
    feeSchedule: [
      { category: { en: "General / OBC / EWS", hi: "सामान्य / OBC / EWS" }, amountInr: 100 },
      { category: { en: "Women / SC / ST / PwBD / ESM", hi: "महिला / SC / ST / दिव्यांग / पूर्व सैनिक" }, amountInr: 0 },
    ],
    selectionStages: [
      { en: "Tier-I Computer Based Examination", hi: "टियर-I कंप्यूटर आधारित परीक्षा" },
      { en: "Tier-II Examination & Skill/Typing Test", hi: "टियर-II परीक्षा एवं कौशल/टाइपिंग परीक्षण" },
    ],
    examPatternSummary: {
      en: "Tier-I covers English Language, General Intelligence, Quantitative Aptitude, and General Awareness.",
      hi: "टियर-I में अंग्रेज़ी भाषा, सामान्य बुद्धिमत्ता, मात्रात्मक योग्यता और सामान्य जागरूकता शामिल हैं।",
    },
    requiredDocuments: [
      { en: "Admit Card printout & valid Government Photo ID", hi: "प्रवेश पत्र प्रति एवं वैध सरकारी फोटो पहचान पत्र" },
    ],
    applicationSteps: [
      { en: "Applications are closed. Registered candidates can download the Tier-I Admit Card from the official SSC portal.", hi: "आवेदन बंद हो चुके हैं। पंजीकृत अभ्यर्थी आधिकारिक SSC पोर्टल से प्रवेश पत्र डाउनलोड कर सकते हैं।" },
    ],
    links: [
      {
        linkType: "admit_card",
        label: { en: "Official SSC Admit Card Portal (Sample Preview URL)", hi: "आधिकारिक SSC प्रवेश पत्र पोर्टल (नमूना)" },
        url: "https://ssc.gov.in/",
        isVerifiedOfficial: false,
        linkStatus: "requires_review",
      },
      {
        linkType: "official_apply",
        label: { en: "Online Application Link (Closed)", hi: "ऑनलाइन आवेदन लिंक (बंद)" },
        url: "https://ssc.gov.in/",
        isVerifiedOfficial: false,
        linkStatus: "valid",
        isExpired: true,
      },
    ],
    faqs: [
      {
        question: { en: "Can new candidates still apply?", hi: "क्या नए अभ्यर्थी अभी आवेदन कर सकते हैं?" },
        answer: { en: "No. The application window closed on 12 Oct 2026. Only registered candidates may download admit cards.", hi: "नहीं। आवेदन अवधि 12 अक्टूबर 2026 को समाप्त हो चुकी है।" },
      },
    ],
    sourceCitations: [
      {
        sourceName: "Phase 2 Synthetic Fixture (Pending Phase 4 Tier 1 SSC Onboarding)",
        officialDomain: "ssc.gov.in",
        documentReference: "SAMPLE-SSC-CHSL-2026",
        retrievedAt: "2026-11-22T12:30:00Z",
      },
    ],
    updateHistory: [
      {
        updatedAt: "2026-11-22T12:30:00Z",
        summary: { en: "Updated lifecycle state to Admit Card Released (sample fixture).", hi: "स्थिति प्रवेश पत्र जारी पर अपडेट की गई (नमूना)।" },
        sourceReference: "SAMPLE-SSC-CHSL-2026",
      },
    ],
  },
  {
    id: "sample-central-rrb-004",
    slug: "rrb-junior-engineer-technical-sample-preview",
    isSamplePreview: true,
    title: {
      en: "Railway Recruitment Board (RRB) Junior Engineer — Sample Preview",
      hi: "रेलवे भर्ती बोर्ड (RRB) कनिष्ठ अभियंता — नमूना पूर्वावलोकन",
      mr: "रेल्वे भरती मंडळ (RRB) कनिष्ठ अभियंता — नमुना पूर्वावलोकन",
    },
    summary: {
      en: "Sample Railway & Engineering recruitment fixture showing Diploma/B.E. multi-qualification matching and Result Declared stage.",
      hi: "डिप्लोमा और इंजीनियरिंग अभ्यर्थियों हेतु रेलवे भर्ती परिणाम घोषित स्थिति का नमूना रिकॉर्ड।",
      mr: "डिप्लोमा व अभियांत्रिकी उमेदवारांसाठी रेल्वे भरती निकाल जाहीर स्थितीची नमुना नोंद.",
    },
    organisation: {
      en: "Railway Recruitment Boards (RRBs)",
      hi: "रेलवे भर्ती बोर्ड (RRBs)",
      mr: "रेल्वे भरती मंडळे (RRBs)",
    },
    officialEnglishOrganisation: "Railway Recruitment Boards (RRBs)",
    department: {
      en: "Ministry of Railways",
      hi: "रेल मंत्रालय",
      mr: "रेल्वे मंत्रालय",
    },
    stateCode: "IN",
    stateSlug: "all-india",
    categorySlug: "railway",
    qualificationSlugs: ["diploma", "engineering"],
    cycleLabel: "2026",
    notificationReference: "SAMPLE-CEN-JE-2026",
    vacancyTotal: 1450,
    employmentType: "permanent",
    lifecycleStatus: "result_declared",
    verificationStatus: "verified",
    editorialState: "published",
    availableLanguages: ["en", "hi", "mr"],
    firstPublishedAt: "2026-06-15T05:00:00Z",
    lastVerifiedAt: "2026-11-21T11:00:00Z",
    applicationStart: "2026-06-20",
    applicationEnd: "2026-07-25",
    minAge: 18,
    maxAge: 33,
    ageCutOffDate: "2026-07-01",
    ageRelaxationNote: {
      en: "Central government age relaxation applies per official CEN rules.",
      hi: "आधिकारिक CEN नियमों के अनुसार आयु छूट लागू।",
      mr: "अधिकृत CEN नियमांनुसार वयोमर्यादा सूट लागू.",
    },
    experienceRequirement: {
      en: "Not specified in the notification.",
      hi: "अधिसूचना में निर्दिष्ट नहीं।",
      mr: "अधिसूचनेत नमूद नाही.",
    },
    paySummary: {
      displayLabel: "Level 6 (Initial Basic Pay ₹35,400)",
      period: "basic_pay",
      isApproximate: false,
      sourceBasis: {
        en: "7th CPC Level 6 initial pay; allowances extra per Railway Board norms.",
        hi: "7वां वेतन आयोग स्तर 6 प्रारंभिक वेतन; भत्ते नियमानुसार अतिरिक्त।",
        mr: "७ वा वेतन आयोग स्तर ६ प्रारंभिक वेतन; भत्ते रेल्वे मंडळाच्या नियमांनुसार.",
      },
    },
    posts: [
      {
        postName: { en: "Junior Engineer (Civil / Electrical / Mechanical)", hi: "कनिष्ठ अभियंता (सिविल / इलेक्ट्रिकल / मैकेनिकल)", mr: "कनिष्ठ अभियंता (स्थापत्य / विद्युत / यांत्रिकी)" },
        vacancyCount: 1450,
        payLevel: "Level-6",
        qualificationSummary: { en: "3-year Diploma or Degree in relevant Engineering discipline", hi: "संबंधित इंजीनियरिंग शाखा में 3 वर्षीय डिप्लोमा या डिग्री", mr: "संबंधित अभियांत्रिकी शाखेत ३ वर्षांचा डिप्लोमा किंवा पदवी" },
        ageRange: "18–33 years",
      },
    ],
    dates: [
      { dateType: "application_end", label: { en: "Application Closed", hi: "आवेदन समाप्त", mr: "अर्ज बंद" }, eventDate: "2026-07-25" },
      { dateType: "result_date", label: { en: "CBT-1 Result Declared", hi: "CBT-1 परिणाम घोषित", mr: "CBT-1 निकाल जाहीर" }, eventDate: "2026-11-21" },
    ],
    feeSchedule: [
      { category: { en: "General / OBC / EWS", hi: "सामान्य / OBC / EWS", mr: "खुला / OBC / EWS" }, amountInr: 500 },
      { category: { en: "SC / ST / Women / EBC", hi: "SC / ST / महिला / EBC", mr: "SC / ST / महिला / EBC" }, amountInr: 250 },
    ],
    selectionStages: [
      { en: "CBT-1 & CBT-2", hi: "CBT-1 और CBT-2", mr: "CBT-1 आणि CBT-2" },
      { en: "Document Verification & Medical Fitness", hi: "दस्तावेज़ सत्यापन व चिकित्सा परीक्षण", mr: "कागदपत्र पडताळणी व वैद्यकीय तपासणी" },
    ],
    examPatternSummary: {
      en: "CBT-1 tests Mathematics, General Intelligence, General Awareness, and General Science; CBT-2 adds Technical Abilities.",
      hi: "CBT-1 में गणित, रीजनिंग, सामान्य जागरूकता और विज्ञान; CBT-2 में तकनीकी विषय शामिल हैं।",
      mr: "CBT-1 मध्ये गणित, बुद्धिमत्ता, सामान्य ज्ञान व विज्ञान; CBT-2 मध्ये तांत्रिक विषयांचा समावेश आहे.",
    },
    requiredDocuments: [
      { en: "Diploma/Engineering Certificates & CBT Roll Number", hi: "डिप्लोमा/डिग्री प्रमाणपत्र और रोल नंबर", mr: "डिप्लोमा/अभियांत्रिकी प्रमाणपत्र व रोल नंबर" },
    ],
    applicationSteps: [
      { en: "Visit your regional RRB website to check the CBT-1 shortlist PDF and scorecard.", hi: "CBT-1 शॉर्टलिस्ट PDF और स्कोरकार्ड देखने के लिए क्षेत्रीय RRB वेबसाइट पर जाएं।", mr: "CBT-1 निकाल व गुणपत्रक पाहण्यासाठी संबंधित प्रादेशिक RRB संकेतस्थळाला भेट द्या." },
    ],
    links: [
      {
        linkType: "result",
        label: { en: "Official RRB Portal (Sample Preview URL)", hi: "आधिकारिक RRB पोर्टल (नमूना)", mr: "अधिकृत RRB पोर्टल (नमुना)" },
        url: "https://www.rrbmumbai.gov.in/",
        isVerifiedOfficial: false,
        linkStatus: "requires_review",
      },
    ],
    faqs: [],
    sourceCitations: [
      {
        sourceName: "Phase 2 Synthetic Fixture (Pending Phase 4 Tier 1 RRB Onboarding)",
        officialDomain: "rrbmumbai.gov.in",
        documentReference: "SAMPLE-CEN-JE-2026",
        retrievedAt: "2026-11-21T11:00:00Z",
      },
    ],
    updateHistory: [
      {
        updatedAt: "2026-11-21T11:00:00Z",
        summary: { en: "Result Declared sample state recorded.", hi: "परिणाम घोषित नमूना स्थिति दर्ज।", mr: "निकाल जाहीर नमुना स्थिती नोंदवली." },
        sourceReference: "SAMPLE-CEN-JE-2026",
      },
    ],
  },
  {
    id: "sample-mh-msedcl-005",
    slug: "msedcl-vidyut-sahayak-iti-closed-sample-preview",
    isSamplePreview: true,
    title: {
      en: "MSEDCL Vidyut Sahayak (ITI) — Closed Historical Sample Preview",
      hi: "महावितरण विद्युत सहायक (ITI) — बंद ऐतिहासिक नमूना पूर्वावलोकन",
      mr: "महावितरण विद्युत सहाय्यक (ITI) — बंद ऐतिहासिक नमुना पूर्वावलोकन",
    },
    summary: {
      en: "Demonstrates Blueprint Ch. 09 & Ch. 33 compliance: closed recruitment visibly marked Application Closed with expired application route disabled.",
      hi: "बंद हो चुकी भर्ती का नमूना रिकॉर्ड — स्पष्ट बंद स्थिति और निष्क्रिय आवेदन लिंक के साथ।",
      mr: "बंद झालेल्या भरतीची नमुना नोंद — स्पष्ट बंद स्थिती आणि निष्क्रिय अर्ज लिंकसह.",
    },
    organisation: {
      en: "Maharashtra State Electricity Distribution Co. Ltd. (MSEDCL)",
      hi: "महाराष्ट्र राज्य विद्युत वितरण कंपनी लिमिटेड (महावितरण)",
      mr: "महाराष्ट्र राज्य विद्युत वितरण कंपनी मर्यादित (महावितरण)",
    },
    officialEnglishOrganisation:
      "Maharashtra State Electricity Distribution Co. Ltd. (MSEDCL)",
    department: {
      en: "Energy Department, Maharashtra PSU",
      hi: "ऊर्जा विभाग, महाराष्ट्र पीएसयू",
      mr: "ऊर्जा विभाग, महाराष्ट्र राज्य उपक्रम",
    },
    stateCode: "MH",
    stateSlug: "maharashtra",
    categorySlug: "psu",
    qualificationSlugs: ["10th-pass", "12th-pass", "iti"],
    cycleLabel: "2025-26",
    notificationReference: "SAMPLE-MSEDCL-2025-08",
    vacancyTotal: 900,
    employmentType: "contractual",
    lifecycleStatus: "application_closed",
    verificationStatus: "verified",
    editorialState: "published",
    availableLanguages: ["en", "hi", "mr"],
    firstPublishedAt: "2026-03-12T06:00:00Z",
    lastVerifiedAt: "2026-05-02T10:00:00Z",
    applicationStart: "2026-03-15",
    applicationEnd: "2026-04-30",
    minAge: 18,
    maxAge: 27,
    ageCutOffDate: "2026-04-30",
    ageRelaxationNote: {
      en: "5 years relaxation for Backward Classes as per state PSU rules.",
      hi: "राज्य पीएसयू नियमों के अनुसार पिछड़ा वर्ग को 5 वर्ष की छूट।",
      mr: "राज्य उपक्रम नियमांनुसार मागासवर्गीयांना ५ वर्षे सूट.",
    },
    experienceRequirement: {
      en: "No prior experience required.",
      hi: "कोई पूर्व अनुभव आवश्यक नहीं।",
      mr: "पूर्वानुभव आवश्यक नाही.",
    },
    paySummary: {
      displayLabel: "₹15,000 – ₹17,000 monthly honorarium (3-year contractual period)",
      period: "monthly",
      isApproximate: false,
      sourceBasis: {
        en: "Sample 3-year Vidyut Sahayak honorarium structure before regularisation.",
        hi: "नियमितीकरण से पूर्व 3 वर्षीय विद्युत सहायक मानदेय संरचना (नमूना)।",
        mr: "कायमस्वरूपी सेवेपूर्वी ३ वर्षांचे विद्युत सहाय्यक मानधन (नमुना).",
      },
    },
    posts: [
      {
        postName: { en: "Vidyut Sahayak", hi: "विद्युत सहायक", mr: "विद्युत सहाय्यक" },
        vacancyCount: 900,
        payLevel: "Honorarium",
        qualificationSummary: { en: "12th Pass + ITI (Electrician / Wireman)", hi: "12वीं पास + ITI (इलेक्ट्रीशियन / वायरमैन)", mr: "१२वी उत्तीर्ण + ITI (वीजतंत्री / तारतंत्री)" },
        ageRange: "18–27 years",
      },
    ],
    dates: [
      { dateType: "application_start", label: { en: "Application Start", hi: "आवेदन प्रारंभ", mr: "अर्ज सुरू" }, eventDate: "2026-03-15" },
      { dateType: "application_end", label: { en: "Application Closed", hi: "आवेदन बंद", mr: "अर्ज बंद" }, eventDate: "2026-04-30" },
    ],
    feeSchedule: [
      { category: { en: "Open Category", hi: "सामान्य वर्ग", mr: "खुला प्रवर्ग" }, amountInr: 250 },
      { category: { en: "Reserved Category", hi: "आरक्षित वर्ग", mr: "मागासवर्गीय" }, amountInr: 125 },
    ],
    selectionStages: [
      { en: "Online Objective Test", hi: "ऑनलाइन वस्तुनिष्ठ परीक्षा", mr: "ऑनलाइन वस्तुनिष्ठ परीक्षा" },
      { en: "Document Verification", hi: "दस्तावेज़ सत्यापन", mr: "कागदपत्र पडताळणी" },
    ],
    examPatternSummary: {
      en: "Online test covering Electrical Trade knowledge, Reasoning, Quantitative Aptitude, and Marathi.",
      hi: "इलेक्ट्रिकल ट्रेड ज्ञान, रीजनिंग, गणित और मराठी पर आधारित ऑनलाइन परीक्षा।",
      mr: "विद्युत ट्रेड ज्ञान, बुद्धिमत्ता, अंकगणित आणि मराठी यावर आधारित ऑनलाइन परीक्षा.",
    },
    requiredDocuments: [
      { en: "ITI NCTVT Certificate & Marksheets", hi: "ITI NCTVT प्रमाणपत्र व अंकतालिका", mr: "ITI NCTVT प्रमाणपत्र व गुणपत्रिका" },
    ],
    applicationSteps: [
      { en: "This recruitment cycle is closed. Watch the Maharashtra PSU section for future official notices.", hi: "यह भर्ती चक्र बंद हो चुका है। नई सूचनाओं के लिए महाराष्ट्र पीएसयू अनुभाग देखें।", mr: "हे भरती चक्र बंद झाले आहे. पुढील अधिकृत जाहिरातींसाठी महाराष्ट्र पीएसयू विभाग पहा." },
    ],
    links: [
      {
        linkType: "official_apply",
        label: { en: "Expired Application Portal", hi: "समाप्त आवेदन पोर्टल", mr: "मुदत संपलेले अर्ज पोर्टल" },
        url: "https://www.mahadiscom.in/",
        isVerifiedOfficial: false,
        linkStatus: "valid",
        isExpired: true,
      },
      {
        linkType: "official_website",
        label: { en: "Official MSEDCL Website (Sample Preview URL)", hi: "आधिकारिक महावितरण वेबसाइट (नमूना)", mr: "अधिकृत महावितरण संकेतस्थळ (नमुना)" },
        url: "https://www.mahadiscom.in/",
        isVerifiedOfficial: false,
        linkStatus: "requires_review",
      },
    ],
    faqs: [],
    sourceCitations: [
      {
        sourceName: "Phase 2 Synthetic Fixture (Closed Record Test)",
        officialDomain: "mahadiscom.in",
        documentReference: "SAMPLE-MSEDCL-2025-08",
        retrievedAt: "2026-05-02T10:00:00Z",
      },
    ],
    updateHistory: [
      {
        updatedAt: "2026-05-02T10:00:00Z",
        summary: { en: "Marked Application Closed after closing date elapsed.", hi: "अंतिम तिथि बीतने के बाद आवेदन बंद चिह्नित।", mr: "अंतिम तारीख संपल्यानंतर अर्ज बंद म्हणून नोंदवले." },
        sourceReference: "SAMPLE-MSEDCL-2025-08",
      },
    ],
  },
] as const;

export function getRecruitmentBySlug(slug: string): RecruitmentRecord | undefined {
  return MOCK_RECRUITMENTS.find((r) => r.slug === slug);
}
