import {
  CategoryInfo,
  QualificationInfo,
  StateInfo,
} from "@/lib/types/recruitment";

export const CATEGORIES: readonly CategoryInfo[] = [
  {
    slug: "central-government",
    group: "scope",
    name: { en: "Central Government", hi: "केंद्र सरकार", mr: "केंद्र सरकार" },
    description: {
      en: "All-India recruitments by UPSC, SSC, central ministries, and national commissions.",
      hi: "UPSC, SSC, केंद्रीय मंत्रालयों और राष्ट्रीय आयोगों की अखिल भारतीय भर्तियां।",
      mr: "UPSC, SSC, केंद्रीय मंत्रालये आणि राष्ट्रीय आयोगांच्या अखिल भारतीय भरती.",
    },
  },
  {
    slug: "state-jobs",
    group: "scope",
    name: { en: "State Jobs", hi: "राज्य नौकरियां", mr: "राज्य नोकऱ्या" },
    description: {
      en: "Public Service Commissions, state departments, and municipal recruitments across Indian states.",
      hi: "विभिन्न राज्यों के लोक सेवा आयोग, राज्य विभागों और नगर निकायों की भर्तियां।",
      mr: "विविध राज्यांतील लोकसेवा आयोग, राज्य विभाग आणि महानगरपालिका भरती.",
    },
  },
  {
    slug: "railway",
    group: "sector",
    name: { en: "Railway", hi: "रेलवे", mr: "रेल्वे" },
    description: {
      en: "Railway Recruitment Board (RRB) and RRC technical, non-technical, and apprentice notifications.",
      hi: "रेलवे भर्ती बोर्ड (RRB) और RRC की तकनीकी, गैर-तकनीकी और अप्रेंटिस अधिसूचनाएं।",
      mr: "रेल्वे भरती मंडळ (RRB) आणि RRC च्या तांत्रिक, अतांत्रिक व अप्रेंटिस जाहिराती.",
    },
  },
  {
    slug: "banking",
    group: "sector",
    name: { en: "Banking", hi: "बैंकिंग", mr: "बँकिंग" },
    description: {
      en: "IBPS, SBI, RBI, NABARD, and cooperative public-sector bank recruitments.",
      hi: "IBPS, SBI, RBI, NABARD और सार्वजनिक क्षेत्र के बैंकों की भर्तियां।",
      mr: "IBPS, SBI, RBI, NABARD आणि सार्वजनिक बँकांमधील भरती संधी.",
    },
  },
  {
    slug: "defence",
    group: "sector",
    name: { en: "Defence", hi: "रक्षा", mr: "संरक्षण" },
    description: {
      en: "Armed forces, DRDO, Coast Guard, and defence civilian recruitment notices.",
      hi: "सशस्त्र बल, DRDO, तटरक्षक बल और रक्षा नागरिक भर्ती अधिसूचनाएं।",
      mr: "सशस्त्र दल, DRDO, तटरक्षक दल आणि संरक्षण नागरी भरती जाहिराती.",
    },
  },
  {
    slug: "police",
    group: "sector",
    name: { en: "Police", hi: "पुलिस", mr: "पोलीस" },
    description: {
      en: "State police constable, sub-inspector, SRPF, and CAPF recruitment updates.",
      hi: "राज्य पुलिस कांस्टेबल, सब-इंस्पेक्टर, SRPF और CAPF भर्ती अपडेट।",
      mr: "राज्य पोलीस शिपाई, पोलीस उपनिरीक्षक, SRPF आणि CAPF भरती अद्यतने.",
    },
  },
  {
    slug: "psu",
    group: "sector",
    name: { en: "PSU", hi: "पीएसयू", mr: "पीएसयू" },
    description: {
      en: "Central and state public sector undertakings including Mahagenco, MSEDCL, ONGC, and BHEL.",
      hi: "केंद्रीय और राज्य सार्वजनिक उपक्रम (PSU) जैसे महावितरण, ONGC, BHEL की भर्तियां।",
      mr: "महावितरण, महापारेषण, ONGC, BHEL सारख्या केंद्र व राज्य सार्वजनिक उपक्रमांतील भरती.",
    },
  },
  {
    slug: "teaching",
    group: "sector",
    name: { en: "Teaching", hi: "शिक्षण", mr: "शिक्षण" },
    description: {
      en: "Government school teachers, TET/CTET, KVS, NVS, and public university faculty notices.",
      hi: "सरकारी विद्यालय शिक्षक, TET/CTET, KVS, NVS और विश्वविद्यालय संकाय भर्तियां।",
      mr: "शासकीय शाळा शिक्षक, TET/CTET, KVS, NVS आणि विद्यापीठ प्राध्यापक भरती.",
    },
  },
  {
    slug: "engineering",
    group: "sector",
    name: { en: "Engineering", hi: "इंजीनियरिंग", mr: "अभियांत्रिकी" },
    description: {
      en: "Junior Engineer (JE), Assistant Engineer (AE), GATE-based PSU, and technical cadre jobs.",
      hi: "कनिष्ठ अभियंता (JE), सहायक अभियंता (AE), GATE आधारित PSU और तकनीकी भर्तियां।",
      mr: "कनिष्ठ अभियंता (JE), सहाय्यक अभियंता (AE), GATE आधारित PSU आणि तांत्रिक पदे.",
    },
  },
] as const;

export const STATES: readonly StateInfo[] = [
  {
    code: "MH",
    slug: "maharashtra",
    isPriority: true,
    name: { en: "Maharashtra", hi: "महाराष्ट्र", mr: "महाराष्ट्र" },
    description: {
      en: "Priority Maharashtra recruitment hub covering MPSC, Maharashtra Police, state ministries, MSEDCL, Mahatransco, Zilla Parishads, and Municipal Corporations.",
      hi: "महाराष्ट्र प्रमुख भर्ती केंद्र: MPSC, महाराष्ट्र पुलिस, राज्य विभाग, महावितरण, महापारेषण, जिला परिषद और महानगरपालिका।",
      mr: "महाराष्ट्र प्राधान्य भरती केंद्र: MPSC, महाराष्ट्र पोलीस, राज्य विभाग, महावितरण, महापारेषण, जिल्हा परिषद आणि महानगरपालिका.",
    },
  },
  {
    code: "IN",
    slug: "all-india",
    name: { en: "All India (Central)", hi: "अखिल भारतीय (केंद्र)", mr: "अखिल भारतीय (केंद्र)" },
    description: {
      en: "Central government recruitments open to eligible Indian citizens nationwide.",
      hi: "देशभर के पात्र भारतीय नागरिकों के लिए केंद्र सरकार की भर्तियां।",
      mr: "देशभरातील पात्र भारतीय नागरिकांसाठी केंद्र शासनाच्या भरती.",
    },
  },
  {
    code: "DL",
    slug: "delhi",
    name: { en: "Delhi", hi: "दिल्ली", mr: "दिल्ली" },
    description: {
      en: "DSSSB, Delhi Police, and NCT Delhi public-sector notifications.",
      hi: "DSSSB, दिल्ली पुलिस और दिल्ली सरकार के विभागों की अधिसूचनाएं।",
      mr: "DSSSB, दिल्ली पोलीस आणि दिल्ली शासनाच्या विभागांतील जाहिराती.",
    },
  },
  {
    code: "UP",
    slug: "uttar-pradesh",
    name: { en: "Uttar Pradesh", hi: "उत्तर प्रदेश", mr: "उत्तर प्रदेश" },
    description: {
      en: "UPPSC, UPSSSC, UP Police, and state education recruitment updates.",
      hi: "UPPSC, UPSSSC, यूपी पुलिस और राज्य शिक्षा विभाग भर्ती अपडेट।",
      mr: "UPPSC, UPSSSC, उत्तर प्रदेश पोलीस आणि राज्य शिक्षण भरती अद्यतने.",
    },
  },
  {
    code: "GJ",
    slug: "gujarat",
    name: { en: "Gujarat", hi: "गुजरात", mr: "गुजरात" },
    description: {
      en: "GPSC, GSSSB, Gujarat Police, and state PSU recruitment notices.",
      hi: "GPSC, GSSSB, गुजरात पुलिस और राज्य पीएसयू भर्तियां।",
      mr: "GPSC, GSSSB, गुजरात पोलीस आणि राज्य पीएसयू भरती जाहिराती.",
    },
  },
  {
    code: "KA",
    slug: "karnataka",
    name: { en: "Karnataka", hi: "कर्नाटक", mr: "कर्नाटक" },
    description: {
      en: "KPSC, KEA, Karnataka Police, and state department recruitment updates.",
      hi: "KPSC, KEA, कर्नाटक पुलिस और राज्य विभागों की भर्तियां।",
      mr: "KPSC, KEA, कर्नाटक पोलीस आणि राज्य विभागांच्या भरती.",
    },
  },
] as const;

export const QUALIFICATIONS: readonly QualificationInfo[] = [
  {
    slug: "10th-pass",
    name: { en: "10th Pass (SSC)", hi: "10वीं पास", mr: "१०वी उत्तीर्ण" },
    description: {
      en: "Entry-level central and state public-sector posts open to matriculation / 10th-pass candidates.",
      hi: "मैट्रिक / 10वीं पास अभ्यर्थियों के लिए केंद्र और राज्य सरकार के पद।",
      mr: "१०वी उत्तीर्ण उमेदवारांसाठी केंद्र व राज्य शासनातील पदे.",
    },
  },
  {
    slug: "12th-pass",
    name: { en: "12th Pass (HSC)", hi: "12वीं पास", mr: "१२वी उत्तीर्ण" },
    description: {
      en: "Clerical, police constable, SSC CHSL, and junior assistant recruitments for 12th-pass applicants.",
      hi: "12वीं पास अभ्यर्थियों के लिए लिपिक, पुलिस कांस्टेबल, SSC CHSL और सहायक भर्तियां।",
      mr: "१२वी उत्तीर्ण उमेदवारांसाठी लिपिक, पोलीस शिपाई, SSC CHSL आणि सहाय्यक भरती.",
    },
  },
  {
    slug: "iti",
    name: { en: "ITI", hi: "आईटीआई (ITI)", mr: "आयटीआय (ITI)" },
    description: {
      en: "Technician, trade apprentice, railway workshop, and state power utility roles for ITI holders.",
      hi: "ITI धारकों के लिए तकनीशियन, ट्रेड अप्रेंटिस, रेलवे और बिजली विभाग की भर्तियां।",
      mr: "ITI धारकांसाठी तंत्रज्ञ, शिकाऊ उमेदवार, रेल्वे आणि वीज कंपनीतील पदे.",
    },
  },
  {
    slug: "diploma",
    name: { en: "Diploma", hi: "डिप्लोमा", mr: "डिप्लोमा" },
    description: {
      en: "Junior Engineer, technical assistant, and polytechnic diploma public-sector jobs.",
      hi: "पॉलिटेक्निक डिप्लोमा धारकों के लिए कनिष्ठ अभियंता और तकनीकी सहायक पद।",
      mr: "डिप्लोमा धारकांसाठी कनिष्ठ अभियंता आणि तांत्रिक सहाय्यक पदे.",
    },
  },
  {
    slug: "graduate",
    name: { en: "Graduate", hi: "स्नातक", mr: "पदवीधर" },
    description: {
      en: "UPSC, MPSC, SSC CGL, IBPS PO/Clerk, and administrative officer recruitments for graduates.",
      hi: "स्नातक अभ्यर्थियों के लिए UPSC, MPSC, SSC CGL, IBPS और प्रशासनिक अधिकारी भर्तियां।",
      mr: "पदवीधर उमेदवारांसाठी UPSC, MPSC, SSC CGL, IBPS आणि प्रशासकीय अधिकारी भरती.",
    },
  },
  {
    slug: "engineering",
    name: { en: "Engineering (B.E./B.Tech)", hi: "इंजीनियरिंग (B.E./B.Tech)", mr: "अभियांत्रिकी (B.E./B.Tech)" },
    description: {
      en: "Assistant Engineer, Scientist, and PSU graduate engineer trainee recruitments.",
      hi: "सहायक अभियंता, वैज्ञानिक और PSU ग्रेजुएट इंजीनियर ट्रेनी भर्तियां।",
      mr: "सहाय्यक अभियंता, शास्त्रज्ञ आणि PSU अभियांत्रिकी प्रशिक्षणार्थी भरती.",
    },
  },
  {
    slug: "postgraduate",
    name: { en: "Postgraduate", hi: "स्नातकोत्तर", mr: "पदव्युत्तर" },
    description: {
      en: "Specialist officer, research fellow, and university faculty opportunities.",
      hi: "विशेषज्ञ अधिकारी, शोध फेलो और विश्वविद्यालय संकाय अवसर।",
      mr: "विशेषज्ञ अधिकारी, संशोधन फेलो आणि विद्यापीठ प्राध्यापक संधी.",
    },
  },
] as const;

export function getCategoryBySlug(slug: string): CategoryInfo | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function getStateBySlug(slug: string): StateInfo | undefined {
  return STATES.find((s) => s.slug === slug);
}

export function getQualificationBySlug(slug: string): QualificationInfo | undefined {
  return QUALIFICATIONS.find((q) => q.slug === slug);
}
