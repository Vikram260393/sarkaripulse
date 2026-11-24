import {
  LanguageCode,
  RecruitmentLifecycleStatus,
} from "@/lib/types/recruitment";

export interface UiDictionary {
  brandName: string;
  tagline: string;
  skipToContent: string;
  independentBanner: string;
  samplePreviewNotice: string;
  languageName: Record<LanguageCode, string>;
  nav: {
    latestJobs: string;
    centralGovt: string;
    stateJobs: string;
    maharashtra: string;
    railway: string;
    banking: string;
    defence: string;
    police: string;
    psu: string;
    teaching: string;
    engineering: string;
    results: string;
    admitCards: string;
    answerKeys: string;
    syllabus: string;
    previousPapers: string;
    admissions: string;
    careerGuides: string;
    tools: string;
    downloads: string;
    moreMenu: string;
    closeMenu: string;
    allSections: string;
  };
  search: {
    placeholder: string;
    button: string;
    label: string;
    resultsFound: string;
    noResultsTitle: string;
    noResultsHint: string;
    resetAll: string;
    removeFilter: string;
    filtersHeading: string;
    stateLabel: string;
    categoryLabel: string;
    qualificationLabel: string;
    statusLabel: string;
    employmentTypeLabel: string;
    allOption: string;
  };
  home: {
    heroEyebrow: string;
    heroTitle: string;
    heroSubtitle: string;
    quickFiltersLabel: string;
    latestHeading: string;
    viewAllJobs: string;
    maharashtraHeading: string;
    maharashtraSubheading: string;
    lifecycleHeading: string;
    browseQualificationHeading: string;
    browseStateHeading: string;
    trustHeading: string;
    trustSubtitle: string;
  };
  statusLabels: Record<RecruitmentLifecycleStatus, string>;
  employmentTypes: {
    permanent: string;
    contractual: string;
    apprenticeship: string;
    fellowship: string;
  };
  card: {
    vacancies: string;
    lastDate: string;
    qualification: string;
    lastVerified: string;
    viewDetails: string;
    closedNote: string;
  };
  detail: {
    breadcrumbHome: string;
    breadcrumbJobs: string;
    translationFallbackBanner: string;
    readEnglishMaster: string;
    closedBannerTitle: string;
    closedBannerBody: string;
    verifiedSourceBadge: string;
    notificationNo: string;
    lastVerified: string;
    reportError: string;
    sections: {
      overview: string;
      importantDates: string;
      vacancyDistribution: string;
      postDetails: string;
      qualification: string;
      experience: string;
      ageLimit: string;
      categoryRelaxation: string;
      fee: string;
      salary: string;
      selectionProcess: string;
      examPattern: string;
      documents: string;
      applicationSteps: string;
      officialLinks: string;
      faqs: string;
      sourceCitations: string;
      updateHistory: string;
      disclaimer: string;
    };
    tableHeaders: {
      event: string;
      date: string;
      postName: string;
      vacancies: string;
      payLevel: string;
      qualification: string;
      age: string;
      category: string;
      feeAmount: string;
      notes: string;
    };
    externalLinkNote: string;
    destinationDomain: string;
    expiredLinkDisabled: string;
    paymentWarning: string;
    officialNoticeGoverns: string;
  };
  legal: {
    about: string;
    contact: string;
    privacy: string;
    terms: string;
    disclaimer: string;
    editorialPolicy: string;
    correctionPolicy: string;
    advertisingPolicy: string;
    footerDisclaimer: string;
    copyrightLine: string;
  };
  tools: {
    ageCalcTitle: string;
    ageCalcDisclaimer: string;
    dobLabel: string;
    cutoffLabel: string;
    calculateBtn: string;
    resultPrefix: string;
    years: string;
    months: string;
    days: string;
    invalidDates: string;
  };
}

export const DICTIONARIES: Record<LanguageCode, UiDictionary> = {
  en: {
    brandName: "SarkariPulse",
    tagline: "Your Career. Your Opportunity.",
    skipToContent: "Skip to main content",
    independentBanner:
      "Independent Information Platform: SarkariPulse is NOT affiliated with or endorsed by any government department, commission, or examination board. Always confirm details on the official recruiting portal.",
    samplePreviewNotice:
      "Phase 2 UI Preview: Records shown below are synthetic sample fixtures for layout, multilingual, and accessibility testing. Live verified official notices will be onboarded in Phases 3–4.",
    languageName: {
      en: "English",
      hi: "हिन्दी",
      mr: "मराठी",
    },
    nav: {
      latestJobs: "Latest Jobs",
      centralGovt: "Central Govt",
      stateJobs: "State Jobs",
      maharashtra: "Maharashtra",
      railway: "Railway",
      banking: "Banking",
      defence: "Defence",
      police: "Police",
      psu: "PSU",
      teaching: "Teaching",
      engineering: "Engineering",
      results: "Results",
      admitCards: "Admit Cards",
      answerKeys: "Answer Keys",
      syllabus: "Syllabus",
      previousPapers: "Previous Papers",
      admissions: "Admissions",
      careerGuides: "Career Guides",
      tools: "Tools",
      downloads: "Downloads",
      moreMenu: "Menu",
      closeMenu: "Close menu",
      allSections: "All Sections",
    },
    search: {
      placeholder: "Search by post, organisation, qualification, state, or notice no...",
      button: "Search",
      label: "Search government recruitments",
      resultsFound: "recruitments matched",
      noResultsTitle: "No matching recruitments found",
      noResultsHint:
        "Try removing one or more filters or searching with an abbreviation such as MPSC, UPSC, SSC, or 12th Pass.",
      resetAll: "Reset all filters",
      removeFilter: "Remove filter",
      filtersHeading: "Filter Recruitments",
      stateLabel: "State / Scope",
      categoryLabel: "Sector / Category",
      qualificationLabel: "Qualification",
      statusLabel: "Application Status",
      employmentTypeLabel: "Employment Type",
      allOption: "All",
    },
    home: {
      heroEyebrow: "Source-Led Indian Recruitment Information • Maharashtra Priority",
      heroTitle: "Verified Government Jobs, Results & Exam Updates — With Official Proof",
      heroSubtitle:
        "Discover central and state public-sector opportunities with clear dates, structured eligibility, and direct verified links to official recruitment portals.",
      quickFiltersLabel: "Quick discovery:",
      latestHeading: "Latest Recruitments",
      viewAllJobs: "View all jobs",
      maharashtraHeading: "Maharashtra Priority Opportunities",
      maharashtraSubheading:
        "Dedicated tracking for MPSC, Maharashtra Police, state departments, power utilities, and local bodies.",
      lifecycleHeading: "Track Recruitment Stages",
      browseQualificationHeading: "Browse by Qualification",
      browseStateHeading: "Browse by State & Scope",
      trustHeading: "How SarkariPulse Protects Candidate Trust",
      trustSubtitle:
        "Every critical fact is tied to an official recruiting authority notice, checked against deterministic rules, and time-stamped.",
    },
    statusLabels: {
      upcoming: "Upcoming Notice",
      application_open: "Application Open",
      closing_soon: "Closing Soon",
      application_closed: "Application Closed",
      admit_card_released: "Admit Card Released",
      exam_scheduled: "Exam Scheduled",
      answer_key_released: "Answer Key Released",
      result_declared: "Result Declared",
      completed: "Recruitment Completed",
      correction_required: "Under Verification",
      archived: "Archived",
    },
    employmentTypes: {
      permanent: "Permanent",
      contractual: "Contractual",
      apprenticeship: "Apprenticeship",
      fellowship: "Fellowship",
    },
    card: {
      vacancies: "Vacancies",
      lastDate: "Closing Date",
      qualification: "Qualification",
      lastVerified: "Verified",
      viewDetails: "View Eligibility & Official Links",
      closedNote: "Applications are closed. Retained for candidate reference.",
    },
    detail: {
      breadcrumbHome: "Home",
      breadcrumbJobs: "Latest Jobs",
      translationFallbackBanner:
        "This translation is not yet published. Showing the verified English master record below.",
      readEnglishMaster: "Open English Master",
      closedBannerTitle: "This recruitment application window is closed",
      closedBannerBody:
        "This page is retained as historical reference. Expired application links are disabled and not presented as active application routes.",
      verifiedSourceBadge: "Evidence-Backed Structured Summary",
      notificationNo: "Notification Reference",
      lastVerified: "Last Verified",
      reportError: "Report an Error or Correction",
      sections: {
        overview: "Recruitment Overview",
        importantDates: "Important Dates",
        vacancyDistribution: "Vacancy Distribution",
        postDetails: "Post-Wise Details",
        qualification: "Educational Qualification",
        experience: "Experience Requirements",
        ageLimit: "Age Limit",
        categoryRelaxation: "Category Age Relaxation",
        fee: "Application Fee",
        salary: "Salary & Pay Level",
        selectionProcess: "Selection Process",
        examPattern: "Exam Pattern",
        documents: "Required Documents",
        applicationSteps: "Step-by-Step Application Process",
        officialLinks: "Official Links",
        faqs: "Frequently Asked Questions",
        sourceCitations: "Official Source Citations",
        updateHistory: "Update & Correction History",
        disclaimer: "Important Disclaimer",
      },
      tableHeaders: {
        event: "Recruitment Event",
        date: "Official Date",
        postName: "Post Name",
        vacancies: "Vacancies",
        payLevel: "Pay Level",
        qualification: "Qualification",
        age: "Age Limit",
        category: "Candidate Category",
        feeAmount: "Fee",
        notes: "Notes",
      },
      externalLinkNote: "External official portal — opens in a new tab",
      destinationDomain: "Destination domain",
      expiredLinkDisabled: "Application link closed / expired",
      paymentWarning:
        "Safety Warning: SarkariPulse never collects application fees, passwords, OTPs, Aadhaar, or bank details. Confirm all fees and payment steps solely on the official recruiting portal.",
      officialNoticeGoverns:
        "This summary is for candidate convenience only and is not an official eligibility ruling. The original official notification published by the recruiting authority governs in all respects.",
    },
    legal: {
      about: "About Us",
      contact: "Contact",
      privacy: "Privacy Policy",
      terms: "Terms of Use",
      disclaimer: "Disclaimer",
      editorialPolicy: "Editorial Policy",
      correctionPolicy: "Correction Policy",
      advertisingPolicy: "Advertising Policy",
      footerDisclaimer:
        "SarkariPulse is an independent Indian recruitment-information platform and is not affiliated with, authorised by, or endorsed by any central or state government authority.",
      copyrightLine: "© 2026 SarkariPulse. Independent Career Information Service.",
    },
    tools: {
      ageCalcTitle: "Informational Age Calculator (Estimate Only)",
      ageCalcDisclaimer:
        "Assumptions & Disclaimer: Calculates calendar age difference between Date of Birth and Cut-Off Date using standard Gregorian calendar months. This tool provides an informational estimate only and is NOT an official eligibility determination. Always verify exact age rules and relaxations in the official notification.",
      dobLabel: "Date of Birth",
      cutoffLabel: "Official Cut-Off Date (as stated in notice)",
      calculateBtn: "Calculate Age",
      resultPrefix: "Estimated Age on Cut-Off Date:",
      years: "years",
      months: "months",
      days: "days",
      invalidDates: "Please enter a valid Date of Birth earlier than or equal to the Cut-Off Date.",
    },
  },
  hi: {
    brandName: "SarkariPulse",
    tagline: "आपका करियर। आपका अवसर।",
    skipToContent: "मुख्य सामग्री पर जाएं",
    independentBanner:
      "स्वतंत्र सूचना मंच: SarkariPulse किसी भी सरकारी विभाग, आयोग या परीक्षा बोर्ड से संबद्ध या समर्थित नहीं है। कृपया सभी विवरण आधिकारिक भर्ती पोर्टल पर सत्यापित करें।",
    samplePreviewNotice:
      "चरण 2 यूआई पूर्वावलोकन: नीचे दिखाए गए रिकॉर्ड केवल लेआउट, बहुभाषी और सुगम्यता परीक्षण हेतु नमूना डेटा हैं। सत्यापित आधिकारिक अधिसूचनाएं चरण 3–4 में जोड़ी जाएंगी।",
    languageName: {
      en: "English",
      hi: "हिन्दी",
      mr: "मराठी",
    },
    nav: {
      latestJobs: "नवीनतम नौकरियां",
      centralGovt: "केंद्र सरकार",
      stateJobs: "राज्य नौकरियां",
      maharashtra: "महाराष्ट्र",
      railway: "रेलवे",
      banking: "बैंकिंग",
      defence: "रक्षा",
      police: "पुलिस",
      psu: "पीएसयू",
      teaching: "शिक्षण",
      engineering: "इंजीनियरिंग",
      results: "परिणाम",
      admitCards: "प्रवेश पत्र",
      answerKeys: "उत्तर कुंजी",
      syllabus: "पाठ्यक्रम",
      previousPapers: "पिछले प्रश्न पत्र",
      admissions: "प्रवेश",
      careerGuides: "करियर गाइड",
      tools: "उपकरण",
      downloads: "डाउनलोड",
      moreMenu: "मेनू",
      closeMenu: "मेनू बंद करें",
      allSections: "सभी अनुभाग",
    },
    search: {
      placeholder: "पद, संस्था, योग्यता, राज्य या अधिसूचना संख्या खोजें...",
      button: "खोजें",
      label: "सरकारी भर्तियां खोजें",
      resultsFound: "भर्तियां मिलीं",
      noResultsTitle: "कोई मेल खाती भर्ती नहीं मिली",
      noResultsHint:
        "कृपया एक या अधिक फ़िल्टर हटाएं या MPSC, UPSC, SSC, या 12th Pass जैसे शब्दों से खोजें।",
      resetAll: "सभी फ़िल्टर रीसेट करें",
      removeFilter: "फ़िल्टर हटाएं",
      filtersHeading: "भर्तियां फ़िल्टर करें",
      stateLabel: "राज्य / क्षेत्र",
      categoryLabel: "श्रेणी / क्षेत्रक",
      qualificationLabel: "शैक्षणिक योग्यता",
      statusLabel: "आवेदन स्थिति",
      employmentTypeLabel: "रोजगार प्रकार",
      allOption: "सभी",
    },
    home: {
      heroEyebrow: "स्रोत-आधारित भारतीय भर्ती सूचना मंच • महाराष्ट्र प्राथमिकता",
      heroTitle: "सत्यापित सरकारी नौकरियां, परिणाम और परीक्षा अपडेट — आधिकारिक प्रमाण सहित",
      heroSubtitle:
        "स्पष्ट तिथियों, संरचित पात्रता और आधिकारिक भर्ती पोर्टलों के सीधे सत्यापित लिंक के साथ केंद्रीय और राज्य भर्तियां खोजें।",
      quickFiltersLabel: "त्वरित खोज:",
      latestHeading: "नवीनतम भर्तियां",
      viewAllJobs: "सभी नौकरियां देखें",
      maharashtraHeading: "महाराष्ट्र प्रमुख अवसर",
      maharashtraSubheading:
        "MPSC, महाराष्ट्र पुलिस, राज्य विभागों, बिजली कंपनियों और स्थानीय निकायों के लिए समर्पित ट्रैकिंग।",
      lifecycleHeading: "भर्ती चरण ट्रैक करें",
      browseQualificationHeading: "योग्यता के अनुसार देखें",
      browseStateHeading: "राज्य और क्षेत्र के अनुसार देखें",
      trustHeading: "SarkariPulse अभ्यर्थियों का भरोसा कैसे बनाए रखता है",
      trustSubtitle:
        "प्रत्येक महत्वपूर्ण तथ्य आधिकारिक भर्ती अधिसूचना से जुड़ा होता है, नियमों से जांचा जाता है और सत्यापन समय दर्ज होता है।",
    },
    statusLabels: {
      upcoming: "आगामी अधिसूचना",
      application_open: "आवेदन खुला है",
      closing_soon: "अंतिम तिथि निकट",
      application_closed: "आवेदन बंद",
      admit_card_released: "प्रवेश पत्र जारी",
      exam_scheduled: "परीक्षा निर्धारित",
      answer_key_released: "उत्तर कुंजी जारी",
      result_declared: "परिणाम घोषित",
      completed: "भर्ती पूर्ण",
      correction_required: "सत्यापन प्रक्रिया में",
      archived: "संग्रहीत",
    },
    employmentTypes: {
      permanent: "स्थायी",
      contractual: "संविदात्मक",
      apprenticeship: "अप्रेंटिसशिप",
      fellowship: "फेलोशिप",
    },
    card: {
      vacancies: "रिक्तियां",
      lastDate: "अंतिम तिथि",
      qualification: "योग्यता",
      lastVerified: "सत्यापित",
      viewDetails: "पात्रता और आधिकारिक लिंक देखें",
      closedNote: "आवेदन बंद हो चुके हैं। संदर्भ हेतु संरक्षित।",
    },
    detail: {
      breadcrumbHome: "मुख्य पृष्ठ",
      breadcrumbJobs: "नवीनतम नौकरियां",
      translationFallbackBanner:
        "यह अनुवाद अभी प्रकाशित नहीं हुआ है। नीचे सत्यापित अंग्रेज़ी मुख्य विवरण दिखाया जा रहा है।",
      readEnglishMaster: "अंग्रेज़ी मुख्य पृष्ठ खोलें",
      closedBannerTitle: "इस भर्ती की आवेदन अवधि समाप्त हो चुकी है",
      closedBannerBody:
        "यह पृष्ठ ऐतिहासिक संदर्भ के लिए रखा गया है। समाप्त हो चुके आवेदन लिंक निष्क्रिय कर दिए गए हैं।",
      verifiedSourceBadge: "साक्ष्य-आधारित संरचित सारांश",
      notificationNo: "अधिसूचना संख्या",
      lastVerified: "अंतिम सत्यापन",
      reportError: "त्रुटि या सुधार की रिपोर्ट करें",
      sections: {
        overview: "भर्ती अवलोकन",
        importantDates: "महत्वपूर्ण तिथियां",
        vacancyDistribution: "रिक्ति विवरण",
        postDetails: "पद-वार विवरण",
        qualification: "शैक्षणिक योग्यता",
        experience: "अनुभव आवश्यकता",
        ageLimit: "आयु सीमा",
        categoryRelaxation: "श्रेणी आयु छूट",
        fee: "आवेदन शुल्क",
        salary: "वेतन और वेतन स्तर",
        selectionProcess: "चयन प्रक्रिया",
        examPattern: "परीक्षा पैटर्न",
        documents: "आवश्यक दस्तावेज़",
        applicationSteps: "चरण-दर-चरण आवेदन प्रक्रिया",
        officialLinks: "आधिकारिक लिंक",
        faqs: "अक्सर पूछे जाने वाले प्रश्न",
        sourceCitations: "आधिकारिक स्रोत संदर्भ",
        updateHistory: "अपडेट और सुधार इतिहास",
        disclaimer: "महत्वपूर्ण अस्वीकरण",
      },
      tableHeaders: {
        event: "भर्ती चरण",
        date: "आधिकारिक तिथि",
        postName: "पद का नाम",
        vacancies: "रिक्तियां",
        payLevel: "वेतन स्तर",
        qualification: "योग्यता",
        age: "आयु सीमा",
        category: "अभ्यर्थी श्रेणी",
        feeAmount: "शुल्क",
        notes: "टिप्पणी",
      },
      externalLinkNote: "बाहरी आधिकारिक पोर्टल — नए टैब में खुलता है",
      destinationDomain: "गंतव्य डोमेन",
      expiredLinkDisabled: "आवेदन लिंक बंद / समाप्त",
      paymentWarning:
        "सुरक्षा चेतावनी: SarkariPulse कभी भी आवेदन शुल्क, पासवर्ड, OTP, आधार या बैंक विवरण नहीं मांगता। सभी शुल्क और भुगतान निर्देश केवल आधिकारिक पोर्टल पर जांचें।",
      officialNoticeGoverns:
        "यह सारांश केवल अभ्यर्थियों की सुविधा के लिए है और आधिकारिक पात्रता निर्णय नहीं है। भर्ती प्राधिकरण द्वारा जारी मूल आधिकारिक अधिसूचना ही सर्वमान्य होगी।",
    },
    legal: {
      about: "हमारे बारे में",
      contact: "संपर्क करें",
      privacy: "गोपनीयता नीति",
      terms: "उपयोग की शर्तें",
      disclaimer: "अस्वीकरण",
      editorialPolicy: "संपादकीय नीति",
      correctionPolicy: "सुधार नीति",
      advertisingPolicy: "विज्ञापन नीति",
      footerDisclaimer:
        "SarkariPulse एक स्वतंत्र भारतीय भर्ती-सूचना मंच है और किसी भी केंद्र या राज्य सरकारी प्राधिकरण से संबद्ध या अधिकृत नहीं है।",
      copyrightLine: "© 2026 SarkariPulse। स्वतंत्र करियर सूचना सेवा।",
    },
    tools: {
      ageCalcTitle: "सूचनात्मक आयु कैलकुलेटर (केवल अनुमान)",
      ageCalcDisclaimer:
        "मान्यताएं और अस्वीकरण: यह उपकरण जन्म तिथि और कट-ऑफ तिथि के बीच मानक कैलेंडर अंतर की गणना करता है। यह केवल सूचनात्मक अनुमान है, आधिकारिक पात्रता निर्णय नहीं। कृपया आधिकारिक अधिसूचना में आयु नियम और छूट अवश्य जांचें।",
      dobLabel: "जन्म तिथि",
      cutoffLabel: "आधिकारिक कट-ऑफ तिथि (अधिसूचना के अनुसार)",
      calculateBtn: "आयु गणना करें",
      resultPrefix: "कट-ऑफ तिथि पर अनुमानित आयु:",
      years: "वर्ष",
      months: "माह",
      days: "दिन",
      invalidDates: "कृपया कट-ऑफ तिथि से पहले या बराबर की वैध जन्म तिथि दर्ज करें।",
    },
  },
  mr: {
    brandName: "SarkariPulse",
    tagline: "तुमचे करिअर. तुमची संधी.",
    skipToContent: "मुख्य मजकुरावर जा",
    independentBanner:
      "स्वतंत्र माहिती मंच: SarkariPulse कोणत्याही शासकीय विभाग, आयोग किंवा परीक्षा मंडळाशी संलग्न किंवा मान्यताप्राप्त नाही. कृपया सर्व तपशील अधिकृत भरती पोर्टलवर तपासा.",
    samplePreviewNotice:
      "टप्पा २ यूआय पूर्वावलोकन: खालील नोंदी केवळ रचना, बहुभाषिक आणि सुलभता चाचणीसाठी नमुना डेटा आहेत. सत्यापित अधिकृत जाहिराती टप्पा ३–४ मध्ये जोडल्या जातील.",
    languageName: {
      en: "English",
      hi: "हिन्दी",
      mr: "मराठी",
    },
    nav: {
      latestJobs: "ताज्या नोकऱ्या",
      centralGovt: "केंद्र सरकार",
      stateJobs: "राज्य नोकऱ्या",
      maharashtra: "महाराष्ट्र",
      railway: "रेल्वे",
      banking: "बँकिंग",
      defence: "संरक्षण",
      police: "पोलीस",
      psu: "पीएसयू",
      teaching: "शिक्षण",
      engineering: "अभियांत्रिकी",
      results: "निकाल",
      admitCards: "प्रवेशपत्रे",
      answerKeys: "उत्तरतालिका",
      syllabus: "अभ्यासक्रम",
      previousPapers: "मागील प्रश्नपत्रिका",
      admissions: "प्रवेश",
      careerGuides: "करिअर मार्गदर्शक",
      tools: "साधने",
      downloads: "डाउनलोड्स",
      moreMenu: "मेनू",
      closeMenu: "मेनू बंद करा",
      allSections: "सर्व विभाग",
    },
    search: {
      placeholder: "पद, संस्था, पात्रता, राज्य किंवा जाहिरात क्रमांक शोधा...",
      button: "शोधा",
      label: "सरकारी भरती शोधा",
      resultsFound: "भरती नोंदी सापडल्या",
      noResultsTitle: "जुळणारी कोणतीही भरती सापडली नाही",
      noResultsHint:
        "कृपया एक किंवा अधिक फिल्टर काढा किंवा MPSC, UPSC, SSC, किंवा 12th Pass असे शोधून पहा.",
      resetAll: "सर्व फिल्टर रीसेट करा",
      removeFilter: "फिल्टर काढा",
      filtersHeading: "भरती फिल्टर करा",
      stateLabel: "राज्य / कार्यक्षेत्र",
      categoryLabel: "क्षेत्र / प्रवर्ग",
      qualificationLabel: "शैक्षणिक पात्रता",
      statusLabel: "अर्ज स्थिती",
      employmentTypeLabel: "नोकरीचा प्रकार",
      allOption: "सर्व",
    },
    home: {
      heroEyebrow: "स्रोत-आधारित भारतीय भरती माहिती मंच • महाराष्ट्र प्राधान्य",
      heroTitle: "सत्यापित सरकारी नोकऱ्या, निकाल आणि परीक्षा अद्यतने — अधिकृत पुराव्यासह",
      heroSubtitle:
        "अचूक तारखा, स्पष्ट पात्रता आणि अधिकृत भरती पोर्टलच्या थेट सत्यापित लिंकसह केंद्र व राज्य शासनाच्या संधी शोधा.",
      quickFiltersLabel: "त्वरित शोध:",
      latestHeading: "ताज्या भरती जाहिराती",
      viewAllJobs: "सर्व नोकऱ्या पहा",
      maharashtraHeading: "महाराष्ट्र प्राधान्य संधी",
      maharashtraSubheading:
        "MPSC, महाराष्ट्र पोलीस, राज्य विभाग, वीज कंपन्या आणि स्थानिक स्वराज्य संस्थांसाठी विशेष मागोवा.",
      lifecycleHeading: "भरती टप्पे पहा",
      browseQualificationHeading: "पात्रतेनुसार शोधा",
      browseStateHeading: "राज्यानुसार शोधा",
      trustHeading: "SarkariPulse उमेदवारांचा विश्वास कसा जपते",
      trustSubtitle:
        "प्रत्येक महत्त्वाची माहिती अधिकृत भरती जाहिरातीशी जोडलेली असते, नियमांद्वारे तपासली जाते आणि सत्यापन वेळेसह दर्शवली जाते.",
    },
    statusLabels: {
      upcoming: "आगामी जाहिरात",
      application_open: "अर्ज सुरू आहेत",
      closing_soon: "अंतिम तारीख जवळ",
      application_closed: "अर्ज बंद झाले",
      admit_card_released: "प्रवेशपत्र उपलब्ध",
      exam_scheduled: "परीक्षा निश्चित",
      answer_key_released: "उत्तरतालिका प्रसिद्ध",
      result_declared: "निकाल जाहीर",
      completed: "भरती पूर्ण",
      correction_required: "सत्यापन सुरू",
      archived: "संग्रहित",
    },
    employmentTypes: {
      permanent: "कायमस्वरूपी",
      contractual: "कंत्राटी",
      apprenticeship: "शिकाऊ (अप्रेंटिसशिप)",
      fellowship: "फेलोशिप",
    },
    card: {
      vacancies: "एकूण पदे",
      lastDate: "अंतिम तारीख",
      qualification: "पात्रता",
      lastVerified: "सत्यापित",
      viewDetails: "पात्रता व अधिकृत लिंक पहा",
      closedNote: "अर्ज प्रक्रिया बंद झाली आहे. संदर्भासाठी जतन केलेले आहे.",
    },
    detail: {
      breadcrumbHome: "मुख्यपृष्ठ",
      breadcrumbJobs: "ताज्या नोकऱ्या",
      translationFallbackBanner:
        "या नोंदीचे मराठी भाषांतर अद्याप प्रकाशित झालेले नाही. खाली सत्यापित इंग्रजी मूळ माहिती दाखवली आहे.",
      readEnglishMaster: "इंग्रजी मूळ पृष्ठ पहा",
      closedBannerTitle: "या भरतीची अर्ज मुदत संपली आहे",
      closedBannerBody:
        "हे पृष्ठ ऐतिहासिक संदर्भासाठी जतन केले आहे. मुदत संपलेल्या अर्जाच्या लिंक निष्क्रिय केल्या आहेत.",
      verifiedSourceBadge: "पुराव्यावर आधारित संरचित सारांश",
      notificationNo: "जाहिरात क्रमांक",
      lastVerified: "शेवटचे सत्यापन",
      reportError: "चूक किंवा दुरुस्ती कळवा",
      sections: {
        overview: "भरतीचा गोषवारा",
        importantDates: "महत्त्वाच्या तारखा",
        vacancyDistribution: "पदसंख्या तपशील",
        postDetails: "पदानुसार माहिती",
        qualification: "शैक्षणिक पात्रता",
        experience: "अनुभव आवश्यकता",
        ageLimit: "वयोमर्यादा",
        categoryRelaxation: "प्रवर्गानुसार वयोमर्यादा सूट",
        fee: "अर्ज शुल्क",
        salary: "वेतन व वेतनश्रेणी",
        selectionProcess: "निवड प्रक्रिया",
        examPattern: "परीक्षा स्वरूप",
        documents: "आवश्यक कागदपत्रे",
        applicationSteps: "अर्ज करण्याची टप्प्याटप्प्याने प्रक्रिया",
        officialLinks: "अधिकृत लिंक",
        faqs: "नेहमी विचारले जाणारे प्रश्न",
        sourceCitations: "अधिकृत स्रोत संदर्भ",
        updateHistory: "अद्यतन व दुरुस्ती इतिहास",
        disclaimer: "महत्त्वाची सूचना (अस्वीकरण)",
      },
      tableHeaders: {
        event: "भरती टप्पा",
        date: "अधिकृत तारीख",
        postName: "पदाचे नाव",
        vacancies: "पदे",
        payLevel: "वेतनश्रेणी",
        qualification: "पात्रता",
        age: "वयोमर्यादा",
        category: "उमेदवार प्रवर्ग",
        feeAmount: "शुल्क",
        notes: "टीप",
      },
      externalLinkNote: "बाह्य अधिकृत पोर्टल — नवीन टॅबमध्ये उघडेल",
      destinationDomain: "अधिकृत डोमेन",
      expiredLinkDisabled: "अर्ज लिंक बंद / मुदत संपली",
      paymentWarning:
        "सुरक्षा सूचना: SarkariPulse कधीही अर्ज शुल्क, पासवर्ड, OTP, आधार किंवा बँक तपशील मागत नाही. सर्व शुल्क व पेमेंट सूचना केवळ अधिकृत भरती पोर्टलवरच तपासा.",
      officialNoticeGoverns:
        "हा सारांश केवळ उमेदवारांच्या सोयीसाठी आहे आणि अधिकृत पात्रता निर्णय नाही. भरती प्राधिकरणाची मूळ अधिकृत जाहिरात सर्व बाबींमध्ये अंतिम राहील.",
    },
    legal: {
      about: "आमच्याबद्दल",
      contact: "संपर्क",
      privacy: "गोपनीयता धोरण",
      terms: "वापर अटी",
      disclaimer: "अस्वीकरण",
      editorialPolicy: "संपादकीय धोरण",
      correctionPolicy: "दुरुस्ती धोरण",
      advertisingPolicy: "जाहिरात धोरण",
      footerDisclaimer:
        "SarkariPulse हा एक स्वतंत्र भारतीय भरती-माहिती मंच आहे आणि तो कोणत्याही केंद्र किंवा राज्य शासकीय प्राधिकरणाशी संलग्न किंवा मान्यताप्राप्त नाही.",
      copyrightLine: "© २०२६ SarkariPulse. स्वतंत्र करिअर माहिती सेवा.",
    },
    tools: {
      ageCalcTitle: "माहितीसाठी वय गणकयंत्र (केवळ अंदाज)",
      ageCalcDisclaimer:
        "गृहीतके आणि अस्वीकरण: हे साधन जन्मतारीख आणि कट-ऑफ तारीख यातील मानक कॅलेंडर फरक मोजते. हा केवळ माहितीसाठीचा अंदाज आहे, अधिकृत पात्रता निर्णय नाही. अचूक वयोमर्यादा व सवलतींसाठी मूळ अधिकृत जाहिरात तपासा.",
      dobLabel: "जन्मतारीख",
      cutoffLabel: "अधिकृत कट-ऑफ तारीख (जाहिरातीनुसार)",
      calculateBtn: "वय मोजा",
      resultPrefix: "कट-ऑफ तारखेला अंदाजित वय:",
      years: "वर्षे",
      months: "महिने",
      days: "दिवस",
      invalidDates: "कृपया कट-ऑफ तारखेपेक्षा आधीची किंवा समान वैध जन्मतारीख प्रविष्ट करा.",
    },
  },
};

export function getDictionary(lang: LanguageCode): UiDictionary {
  return DICTIONARIES[lang] ?? DICTIONARIES.en;
}
