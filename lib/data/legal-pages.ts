import { LanguageCode, LocalizedText } from "@/lib/types/recruitment";

export type LegalSlug =
  | "about"
  | "contact"
  | "privacy-policy"
  | "terms"
  | "disclaimer"
  | "editorial-policy"
  | "correction-policy"
  | "advertising-policy";

export interface LegalDocument {
  slug: LegalSlug;
  title: LocalizedText;
  summary: LocalizedText;
  sections: {
    heading: LocalizedText;
    body: LocalizedText;
  }[];
}

export const LEGAL_PAGES: Record<LegalSlug, LegalDocument> = {
  about: {
    slug: "about",
    title: { en: "About SarkariPulse", hi: "SarkariPulse के बारे में", mr: "SarkariPulse विषयी" },
    summary: {
      en: "SarkariPulse is an independent Indian recruitment-information platform helping candidates discover verified central and state public-sector opportunities with Maharashtra priority.",
      hi: "SarkariPulse एक स्वतंत्र भारतीय भर्ती-सूचना मंच है जो अभ्यर्थियों को केंद्र और राज्य सरकार की सत्यापित भर्तियों तक पहुँचने में सहायता करता है।",
      mr: "SarkariPulse हा एक स्वतंत्र भारतीय भरती-माहिती मंच आहे जो उमेदवारांना केंद्र व राज्य शासनाच्या सत्यापित संधी शोधण्यास मदत करतो.",
    },
    sections: [
      {
        heading: { en: "Our Mission", hi: "हमारा उद्देश्य", mr: "आमचे ध्येय" },
        body: {
          en: "We organise official recruitment notifications into clear, mobile-friendly summaries in English, Hindi, and Marathi, linking every critical fact to its official primary source.",
          hi: "हम आधिकारिक भर्ती अधिसूचनाओं को अंग्रेज़ी, हिन्दी और मराठी में सरल व स्पष्ट सारांश के रूप में प्रस्तुत करते हैं और प्रत्येक तथ्य को आधिकारिक स्रोत से जोड़ते हैं।",
          mr: "आम्ही अधिकृत भरती जाहिराती इंग्रजी, हिंदी आणि मराठीत स्पष्ट सारांशात मांडतो आणि प्रत्येक महत्त्वाची माहिती मूळ अधिकृत स्रोताशी जोडतो.",
        },
      },
      {
        heading: { en: "Independence", hi: "स्वतंत्र पहचान", mr: "स्वतंत्र ओळख" },
        body: {
          en: "SarkariPulse is NOT a government agency, commission, or exam board. We do not process applications or collect fees.",
          hi: "SarkariPulse कोई सरकारी संस्था, आयोग या परीक्षा बोर्ड नहीं है। हम आवेदन स्वीकार या शुल्क संग्रह नहीं करते।",
          mr: "SarkariPulse ही शासकीय संस्था, आयोग किंवा परीक्षा मंडळ नाही. आम्ही अर्ज किंवा शुल्क स्वीकारत नाही.",
        },
      },
    ],
  },
  contact: {
    slug: "contact",
    title: { en: "Contact Us", hi: "संपर्क करें", mr: "संपर्क साधा" },
    summary: {
      en: "Reach the SarkariPulse editorial and rights team for factual corrections, broken official links, accessibility issues, or content takedown notices.",
      hi: "तथ्यात्मक सुधार, टूटे हुए आधिकारिक लिंक, सुगम्यता समस्याओं या कॉपीराइट सूचना के लिए SarkariPulse संपादकीय टीम से संपर्क करें।",
      mr: "तथ्यात्मक दुरुस्ती, बंद अधिकृत लिंक, सुलभता किंवा कॉपीराइट सूचनांसाठी SarkariPulse संपादकीय टीमशी संपर्क साधा.",
    },
    sections: [
      {
        heading: { en: "Official Contact Channels", hi: "आधिकारिक संपर्क माध्यम", mr: "अधिकृत संपर्क माध्यमे" },
        body: {
          en: "Production support email and public correction-report submission route will be activated upon staging/domain verification (Phase 6–8). Please never send Aadhaar, PAN, passwords, OTPs, or payment details.",
          hi: "उत्पादन सहायता ईमेल और सार्वजनिक सुधार-रिपोर्ट फ़ॉर्म डोमेन सत्यापन (चरण 6–8) के साथ सक्रिय होंगे। कृपया कभी भी आधार, पैन, पासवर्ड, OTP या भुगतान विवरण न भेजें।",
          mr: "अधिकृत ईमेल व सार्वजनिक दुरुस्ती-अहवाल फॉर्म डोमेन सत्यापनानंतर (टप्पा ६–८) सक्रिय होतील. कृपया कधीही आधार, पॅन, पासवर्ड, OTP किंवा पेमेंट तपशील पाठवू नका.",
        },
      },
    ],
  },
  "privacy-policy": {
    slug: "privacy-policy",
    title: { en: "Privacy Policy", hi: "गोपनीयता नीति", mr: "गोपनीयता धोरण" },
    summary: {
      en: "SarkariPulse follows Privacy by Design: full job browsing requires no registration, and we never collect sensitive identity documents.",
      hi: "SarkariPulse गोपनीयता-प्रथम सिद्धांत पर कार्य करता है: नौकरी खोजने हेतु पंजीकरण अनिवार्य नहीं है और हम संवेदनशील पहचान दस्तावेज़ नहीं मांगते।",
      mr: "SarkariPulse गोपनीयतेला प्राधान्य देते: नोकऱ्या पाहण्यासाठी नोंदणी आवश्यक नाही आणि आम्ही संवेदनशील ओळखपत्रे कधीही गोळा करत नाही.",
    },
    sections: [
      {
        heading: { en: "Data Minimisation", hi: "न्यूनतम डेटा संग्रह", mr: "किमान डेटा संकलन" },
        body: {
          en: "We do not collect Aadhaar, PAN, bank details, caste certificates, application passwords, or OTPs. Optional candidate accounts (Phase 3+) store only minimum preferences for bookmarks and alerts, with export and deletion controls.",
          hi: "हम आधार, पैन, बैंक विवरण, जाति प्रमाणपत्र, पासवर्ड या OTP एकत्र नहीं करते। वैकल्पिक खाते (चरण 3+) केवल बुकमार्क व अलर्ट प्राथमिकताएं सहेजते हैं।",
          mr: "आम्ही आधार, पॅन, बँक तपशील, जात प्रमाणपत्र, पासवर्ड किंवा OTP गोळा करत नाही. ऐच्छिक खाती (टप्पा ३+) केवळ बुकमार्क व अलर्ट पसंती जतन करतात.",
        },
      },
      {
        heading: { en: "Legal Review Notice", hi: "कानूनी समीक्षा सूचना", mr: "कायदेशीर पुनरावलोकन सूचना" },
        body: {
          en: "This policy template will undergo qualified legal review against applicable Indian data protection and consumer-protection laws prior to public production launch.",
          hi: "सार्वजनिक लॉन्च से पूर्व इस नीति की भारतीय डेटा संरक्षण और उपभोक्ता संरक्षण कानूनों के तहत योग्य कानूनी समीक्षा की जाएगी।",
          mr: "सार्वजनिक प्रकाशनापूर्वी या धोरणाचे भारतीय डेटा संरक्षण व ग्राहक संरक्षण कायद्यांनुसार तज्ज्ञ कायदेशीर पुनरावलोकन केले जाईल.",
        },
      },
    ],
  },
  terms: {
    slug: "terms",
    title: { en: "Terms of Use", hi: "उपयोग की शर्तें", mr: "वापर अटी" },
    summary: {
      en: "Conditions governing use of the SarkariPulse recruitment information website and informational guides.",
      hi: "SarkariPulse भर्ती सूचना वेबसाइट और मार्गदर्शिकाओं के उपयोग से संबंधित शर्तें।",
      mr: "SarkariPulse भरती माहिती संकेतस्थळ आणि मार्गदर्शक वापराच्या अटी.",
    },
    sections: [
      {
        heading: { en: "Informational Purpose Only", hi: "केवल सूचनात्मक उद्देश्य", mr: "केवळ माहितीसाठी" },
        body: {
          en: "All articles, summaries, calculators, and PDFs published on SarkariPulse are informational aids. The original notification issued by the official recruiting authority governs in every case.",
          hi: "SarkariPulse पर प्रकाशित सभी लेख, कैलकुलेटर और PDF केवल सूचनात्मक सहायता के लिए हैं। प्रत्येक मामले में मूल आधिकारिक अधिसूचना ही मान्य होगी।",
          mr: "SarkariPulse वरील सर्व लेख, गणकयंत्रे आणि PDF केवळ माहितीसाठी आहेत. प्रत्येक प्रकरणात भरती प्राधिकरणाची मूळ अधिकृत जाहिरात अंतिम राहील.",
        },
      },
    ],
  },
  disclaimer: {
    slug: "disclaimer",
    title: { en: "Disclaimer", hi: "अस्वीकरण", mr: "अस्वीकरण" },
    summary: {
      en: "SarkariPulse is an independent information platform and is NOT affiliated with, authorised by, or endorsed by any central or state government authority.",
      hi: "SarkariPulse एक स्वतंत्र सूचना मंच है और किसी भी केंद्र या राज्य सरकार से संबद्ध या समर्थित नहीं है।",
      mr: "SarkariPulse हा स्वतंत्र माहिती मंच आहे आणि कोणत्याही केंद्र किंवा राज्य शासनाशी संलग्न किंवा मान्यताप्राप्त नाही.",
    },
    sections: [
      {
        heading: { en: "Verify on Official Portals", hi: "आधिकारिक पोर्टल पर पुष्टि करें", mr: "अधिकृत पोर्टलवर खात्री करा" },
        body: {
          en: "While SarkariPulse verifies critical recruitment facts against official primary sources, dates, vacancies, and eligibility terms may change via corrigenda. Always confirm final instructions directly on the official recruiting website before applying or paying any fee.",
          hi: "यद्यपि SarkariPulse आधिकारिक स्रोतों से तथ्यों की जांच करता है, तिथियां और नियम शुद्धिपत्र द्वारा बदल सकते हैं। आवेदन या शुल्क भुगतान से पूर्व आधिकारिक पोर्टल पर अवश्य जांचें।",
          mr: "SarkariPulse अधिकृत स्रोतांमधून माहिती तपासते, तरीही तारखा व नियम शुद्धीपत्रकाद्वारे बदलू शकतात. अर्ज किंवा शुल्क भरण्यापूर्वी अधिकृत पोर्टलवर खात्री करा.",
        },
      },
    ],
  },
  "editorial-policy": {
    slug: "editorial-policy",
    title: { en: "Editorial & Verification Policy", hi: "संपादकीय एवं सत्यापन नीति", mr: "संपादकीय व सत्यापन धोरण" },
    summary: {
      en: "How SarkariPulse discovers, verifies, writes, and translates government recruitment notices without copying competitor sites.",
      hi: "SarkariPulse बिना किसी प्रतिस्पर्धी साइट की नकल किए सरकारी अधिसूचनाओं को कैसे सत्यापित, संपादित और अनुवादित करता है।",
      mr: "SarkariPulse कोणत्याही स्पर्धक साइटची कॉपी न करता सरकारी जाहिराती कशा सत्यापित, संपादित आणि भाषांतरित करते.",
    },
    sections: [
      {
        heading: { en: "Evidence-First Publishing", hi: "साक्ष्य-आधारित प्रकाशन", mr: "पुराव्यावर आधारित प्रकाशन" },
        body: {
          en: "Tier 1 official government notices and Tier 2 official employment publications are the sole accepted evidence for critical facts. Uncertain, incomplete, or conflicting records are held for human review rather than auto-published.",
          hi: "टियर 1 आधिकारिक सरकारी सूचनाएं और टियर 2 आधिकारिक रोजगार प्रकाशन ही मुख्य साक्ष्य हैं। अनिश्चित या परस्पर विरोधी रिकॉर्ड मानव समीक्षा कतार में रोके जाते हैं।",
          mr: "टियर १ अधिकृत शासकीय जाहिराती व टियर २ अधिकृत रोजगार प्रकाशने हेच मुख्य पुरावे आहेत. अस्पष्ट किंवा परस्परविरोधी नोंदी मानवी तपासणीसाठी थांबवल्या जातात.",
        },
      },
    ],
  },
  "correction-policy": {
    slug: "correction-policy",
    title: { en: "Correction Policy", hi: "सुधार नीति", mr: "दुरुस्ती धोरण" },
    summary: {
      en: "SarkariPulse corrects verified factual inaccuracies promptly and transparently without erasing historical change notes.",
      hi: "SarkariPulse सत्यापित तथ्यात्मक त्रुटियों को पारदर्शी रूप से शीघ्र सुधारता है और परिवर्तन इतिहास सुरक्षित रखता है।",
      mr: "SarkariPulse सत्यापित तथ्यात्मक चुका तात्काळ व पारदर्शकपणे दुरुस्त करते आणि बदलांचा इतिहास जतन ठेवते.",
    },
    sections: [
      {
        heading: { en: "Transparent Updates", hi: "पारदर्शी अपडेट", mr: "पारदर्शक अद्यतने" },
        body: {
          en: "When an official corrigendum or candidate error report confirms a change, we preserve the previous content snapshot, publish a clear update note with the supporting official source, update the Last Verified timestamp, and regenerate affected translations and PDF guides.",
          hi: "जब आधिकारिक शुद्धिपत्र या रिपोर्ट से सुधार की पुष्टि होती है, तो हम पिछला संस्करण सहेजते हैं, स्पष्ट अपडेट नोट प्रकाशित करते हैं और अनुवाद व PDF पुनः तैयार करते हैं।",
          mr: "अधिकृत शुद्धीपत्रक किंवा अहवालाद्वारे दुरुस्ती निश्चित झाल्यावर आम्ही मागील आवृत्ती जतन करून स्पष्ट अद्यतन टीप प्रकाशित करतो व भाषांतरे/PDF अद्ययावत करतो.",
        },
      },
    ],
  },
  "advertising-policy": {
    slug: "advertising-policy",
    title: { en: "Advertising & Trust Policy", hi: "विज्ञापन एवं विश्वास नीति", mr: "जाहिरात व विश्वास धोरण" },
    summary: {
      en: "Strict separation between editorial content, official recruitment links, and any future clearly labelled advertising.",
      hi: "संपादकीय सामग्री, आधिकारिक भर्ती लिंक और किसी भी भविष्य के विज्ञापन के बीच स्पष्ट विभाजन।",
      mr: "संपादकीय मजकूर, अधिकृत भरती लिंक आणि कोणत्याही भविष्यातील जाहिरातींमधील स्पष्ट वेगळेपणा.",
    },
    sections: [
      {
        heading: { en: "Candidate-First Advertising Rules", hi: "अभ्यर्थी-प्रथम विज्ञापन नियम", mr: "उमेदवार-प्रथम जाहिरात नियम" },
        body: {
          en: "Public notification facts and official links are never paywalled. Any advertisements or sponsorships are clearly labelled, visually separated from official application links, and never permitted to obscure deadlines, eligibility, fees, or safety warnings.",
          hi: "सार्वजनिक अधिसूचना तथ्य और आधिकारिक लिंक कभी सशुल्क नहीं होंगे। विज्ञापन स्पष्ट रूप से चिह्नित और आधिकारिक लिंक से अलग रखे जाएंगे।",
          mr: "सार्वजनिक जाहिरात माहिती व अधिकृत लिंक कधीही सशुल्क नसतील. जाहिराती स्पष्टपणे वेगळ्या दाखवल्या जातील आणि तारखा किंवा अधिकृत लिंक झाकणार नाहीत.",
        },
      },
    ],
  },
};

export function getLegalDocument(slug: LegalSlug): LegalDocument {
  return LEGAL_PAGES[slug];
}

export function isLegalLangReady(lang: LanguageCode): boolean {
  return lang === "en" || lang === "hi" || lang === "mr";
}
