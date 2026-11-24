/**
 * Versioned Controlled Recruitment Glossary (Blueprint Ch. 14 & Ch. 32).
 * Ensures consistent Indian public-sector recruitment terminology across English,
 * Hindi (`hi`), and Marathi (`mr`), while preserving official English organisation
 * names, numerals, dates, notification numbers, and URLs.
 */
export const GLOSSARY_VERSION = "glossary-v1.0.0";

export interface GlossaryEntry {
  en: string;
  hi: string;
  mr: string;
  category: "qualification" | "reservation" | "exam_stage" | "document" | "status";
}

export const RECRUITMENT_GLOSSARY: readonly GlossaryEntry[] = [
  // Qualifications
  { en: "10th Pass (SSC)", hi: "10वीं पास (मैट्रिक)", mr: "१०वी उत्तीर्ण (SSC)", category: "qualification" },
  { en: "12th Pass (HSC)", hi: "12वीं पास (इंटरमीडिएट)", mr: "१२वी उत्तीर्ण (HSC)", category: "qualification" },
  { en: "Graduate", hi: "स्नातक", mr: "पदवीधर", category: "qualification" },
  { en: "Postgraduate", hi: "स्नातकोत्तर", mr: "पदव्युत्तर", category: "qualification" },
  { en: "Diploma", hi: "डिप्लोमा", mr: "डिप्लोमा", category: "qualification" },
  { en: "ITI", hi: "आईटीआई (ITI)", mr: "आयटीआय (ITI)", category: "qualification" },

  // Reservation Categories
  { en: "Unreserved / Open", hi: "अनारक्षित / सामान्य", mr: "अमागास / खुला प्रवर्ग", category: "reservation" },
  { en: "Other Backward Class (OBC)", hi: "अन्य पिछड़ा वर्ग (OBC)", mr: "इतर मागासवर्ग (OBC)", category: "reservation" },
  { en: "Scheduled Caste (SC)", hi: "अनुसूचित जाति (SC)", mr: "अनुसूचित जाती (SC)", category: "reservation" },
  { en: "Scheduled Tribe (ST)", hi: "अनुसूचित जनजाति (ST)", mr: "अनुसूचित जमाती (ST)", category: "reservation" },
  { en: "Economically Weaker Section (EWS)", hi: "आर्थिक रूप से कमजोर वर्ग (EWS)", mr: "आर्थिकदृष्ट्या दुर्बल घटक (EWS)", category: "reservation" },
  { en: "Persons with Benchmark Disabilities (PwBD)", hi: "दिव्यांगजन (PwBD)", mr: "दिव्यांग व्यक्ती (PwBD)", category: "reservation" },
  { en: "Ex-Servicemen (ESM)", hi: "पूर्व सैनिक (ESM)", mr: "माजी सैनिक (ESM)", category: "reservation" },

  // Exam & Selection Stages
  { en: "Preliminary Examination", hi: "प्रारंभिक परीक्षा", mr: "पूर्व परीक्षा", category: "exam_stage" },
  { en: "Main Examination", hi: "मुख्य परीक्षा", mr: "मुख्य परीक्षा", category: "exam_stage" },
  { en: "Computer Based Test (CBT)", hi: "कंप्यूटर आधारित परीक्षा (CBT)", mr: "संगणक आधारित परीक्षा (CBT)", category: "exam_stage" },
  { en: "Physical Efficiency Test (PET)", hi: "शारीरिक दक्षता परीक्षा (PET)", mr: "मैदानी / शारीरिक चाचणी (PET)", category: "exam_stage" },
  { en: "Document Verification", hi: "दस्तावेज़ सत्यापन", mr: "कागदपत्र पडताळणी", category: "exam_stage" },
  { en: "Medical Examination", hi: "चिकित्सा परीक्षा", mr: "वैद्यकीय तपासणी", category: "exam_stage" },
  { en: "Interview", hi: "साक्षात्कार", mr: "मुलाखत", category: "exam_stage" },

  // Documents & Statuses
  { en: "Official Notification", hi: "आधिकारिक अधिसूचना", mr: "अधिकृत जाहिरात", category: "document" },
  { en: "Corrigendum", hi: "शुद्धिपत्र", mr: "शुद्धीपत्रक", category: "document" },
  { en: "Admit Card", hi: "प्रवेश पत्र", mr: "प्रवेशपत्र", category: "document" },
  { en: "Answer Key", hi: "उत्तर कुंजी", mr: "उत्तरतालिका", category: "document" },
  { en: "Not specified in the notification", hi: "अधिसूचना में निर्दिष्ट नहीं", mr: "अधिसूचनेत नमूद नाही", category: "status" },
] as const;

export function formatGlossaryForPrompt(targetLang: "hi" | "mr"): string {
  return RECRUITMENT_GLOSSARY.map(
    (entry) => `- "${entry.en}" => "${entry[targetLang]}"`
  ).join("\n");
}
