"use client";

import { useState, FormEvent } from "react";
import { CheckCircle2, Flag, ShieldAlert } from "lucide-react";
import { LanguageCode } from "@/lib/types/recruitment";
import { trackSafeEvent } from "@/lib/analytics/events";

interface CorrectionReportFormProps {
  lang: LanguageCode;
  defaultPageUrl: string;
}

const COPY: Record<
  LanguageCode,
  {
    heading: string;
    subtitle: string;
    privacyNote: string;
    pageUrlLabel: string;
    issueTypeLabel: string;
    explanationLabel: string;
    explanationPlaceholder: string;
    contactLabel: string;
    submitBtn: string;
    submitting: string;
    successTitle: string;
    issues: { value: string; label: string }[];
  }
> = {
  en: {
    heading: "Report an Error or Official Corrigendum",
    subtitle:
      "No account required. Material factual reports are routed to our verification queue.",
    privacyNote:
      "Privacy reminder: Do NOT enter Aadhaar, PAN, bank details, passwords, or OTPs.",
    pageUrlLabel: "Page URL",
    issueTypeLabel: "Issue Type",
    explanationLabel: "Describe the inaccuracy or official update (include official link if available)",
    explanationPlaceholder:
      "Example: Official corrigendum extended the closing date to 25 Dec 2026...",
    contactLabel: "Optional Email (only if you want acknowledgement)",
    submitBtn: "Submit Correction Report",
    submitting: "Submitting...",
    successTitle: "Correction report received and queued for verification.",
    issues: [
      { value: "wrong_date", label: "Wrong or updated date" },
      { value: "wrong_vacancy", label: "Vacancy count discrepancy" },
      { value: "wrong_eligibility", label: "Eligibility / age / fee error" },
      { value: "broken_link", label: "Broken or incorrect official link" },
      { value: "translation_error", label: "Hindi / Marathi translation error" },
      { value: "other", label: "Other factual issue" },
    ],
  },
  hi: {
    heading: "त्रुटि या आधिकारिक शुद्धिपत्र की रिपोर्ट करें",
    subtitle:
      "किसी खाते की आवश्यकता नहीं। तथ्यात्मक रिपोर्ट हमारी सत्यापन कतार में भेजी जाती है।",
    privacyNote:
      "गोपनीयता सूचना: कृपया आधार, पैन, बैंक विवरण, पासवर्ड या OTP दर्ज न करें।",
    pageUrlLabel: "पृष्ठ URL",
    issueTypeLabel: "समस्या का प्रकार",
    explanationLabel: "त्रुटि या आधिकारिक अपडेट का विवरण लिखें",
    explanationPlaceholder: "उदाहरण: आधिकारिक शुद्धिपत्र द्वारा अंतिम तिथि बढ़ा दी गई है...",
    contactLabel: "वैकल्पिक ईमेल (केवल पावती हेतु)",
    submitBtn: "सुधार रिपोर्ट भेजें",
    submitting: "भेजा जा रहा है...",
    successTitle: "आपकी सुधार रिपोर्ट प्राप्त हो गई है और सत्यापन कतार में है।",
    issues: [
      { value: "wrong_date", label: "गलत या बदली हुई तिथि" },
      { value: "wrong_vacancy", label: "रिक्ति संख्या में अंतर" },
      { value: "wrong_eligibility", label: "पात्रता / आयु / शुल्क त्रुटि" },
      { value: "broken_link", label: "टूटा या गलत आधिकारिक लिंक" },
      { value: "translation_error", label: "हिन्दी / मराठी अनुवाद त्रुटि" },
      { value: "other", label: "अन्य तथ्यात्मक त्रुटि" },
    ],
  },
  mr: {
    heading: "चूक किंवा अधिकृत शुद्धीपत्रक कळवा",
    subtitle:
      "खात्याची आवश्यकता नाही. तथ्यात्मक अहवाल आमच्या सत्यापन रांगेत पाठवले जातात.",
    privacyNote:
      "गोपनीयता सूचना: कृपया आधार, पॅन, बँक तपशील, पासवर्ड किंवा OTP प्रविष्ट करू नका.",
    pageUrlLabel: "पृष्ठ URL",
    issueTypeLabel: "चुकीचा प्रकार",
    explanationLabel: "चूक किंवा अधिकृत अद्यतनाचा तपशील लिहा",
    explanationPlaceholder: "उदाहरण: अधिकृत शुद्धीपत्रकानुसार अंतिम तारीख वाढवली आहे...",
    contactLabel: "ऐच्छिक ईमेल (केवळ पोचपावतीसाठी)",
    submitBtn: "दुरुस्ती अहवाल पाठवा",
    submitting: "पाठवत आहे...",
    successTitle: "तुमचा दुरुस्ती अहवाल प्राप्त झाला असून सत्यापनासाठी रांगेत आहे.",
    issues: [
      { value: "wrong_date", label: "चुकीची किंवा बदललेली तारीख" },
      { value: "wrong_vacancy", label: "पदसंख्येत तफावत" },
      { value: "wrong_eligibility", label: "पात्रता / वय / शुल्क चूक" },
      { value: "broken_link", label: "बंद किंवा चुकीची अधिकृत लिंक" },
      { value: "translation_error", label: "हिंदी / मराठी भाषांतर चूक" },
      { value: "other", label: "इतर तथ्यात्मक चूक" },
    ],
  },
};

export function CorrectionReportForm({
  lang,
  defaultPageUrl,
}: CorrectionReportFormProps) {
  const t = COPY[lang];
  const [pageUrl, setPageUrl] = useState(defaultPageUrl);
  const [issueType, setIssueType] = useState("wrong_date");
  const [explanation, setExplanation] = useState("");
  const [contact, setContact] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successRef, setSuccessRef] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessRef(null);

    try {
      const res = await fetch("/api/public/correction-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          page_url: pageUrl,
          issue_type: issueType,
          explanation,
          reporter_contact: contact.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data?.error?.message || "Could not submit correction report.");
      } else {
        trackSafeEvent("correction_reported", {
          language: lang,
          page_type: "correction_form",
          issue_type: issueType,
        });
        setSuccessRef(data.report_id || data.correlation_id || "queued");
        setExplanation("");
        setContact("");
      }
    } catch {
      setErrorMsg("Network error submitting report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      id="report-correction"
      aria-labelledby="correction-form-heading"
      className="rounded-xl border border-sp-border bg-white p-6 shadow-xs"
    >
      <div className="flex items-center gap-2">
        <Flag className="h-5 w-5 text-sp-blue" aria-hidden="true" />
        <h2 id="correction-form-heading" className="text-lg font-extrabold text-sp-navy">
          {t.heading}
        </h2>
      </div>
      <p className="mt-1 text-sm text-sp-muted">{t.subtitle}</p>

      <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-950">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-800" aria-hidden="true" />
        <p>{t.privacyNote}</p>
      </div>

      {successRef && (
        <div
          role="status"
          className="mt-4 flex items-start gap-2 rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-950"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
          <div>
            <p className="font-semibold">{t.successTitle}</p>
            <p className="mt-0.5 font-mono text-xs">Reference: {successRef}</p>
          </div>
        </div>
      )}

      {errorMsg && (
        <p role="alert" className="mt-4 text-sm font-semibold text-rose-700">
          {errorMsg}
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="cr-page-url" className="mb-1 block text-xs font-semibold text-sp-navy">
              {t.pageUrlLabel}
            </label>
            <input
              id="cr-page-url"
              type="text"
              value={pageUrl}
              onChange={(e) => setPageUrl(e.target.value)}
              required
              className="w-full rounded-lg border border-sp-border bg-sp-bg px-3 py-2 text-sm text-sp-text"
            />
          </div>

          <div>
            <label htmlFor="cr-issue-type" className="mb-1 block text-xs font-semibold text-sp-navy">
              {t.issueTypeLabel}
            </label>
            <select
              id="cr-issue-type"
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
              className="w-full rounded-lg border border-sp-border bg-white px-3 py-2 text-sm text-sp-text"
            >
              {t.issues.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="cr-explanation" className="mb-1 block text-xs font-semibold text-sp-navy">
            {t.explanationLabel}
          </label>
          <textarea
            id="cr-explanation"
            rows={3}
            minLength={10}
            maxLength={2000}
            required
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder={t.explanationPlaceholder}
            className="w-full rounded-lg border border-sp-border bg-white px-3 py-2 text-sm text-sp-text"
          />
        </div>

        <div>
          <label htmlFor="cr-contact" className="mb-1 block text-xs font-semibold text-sp-navy">
            {t.contactLabel}
          </label>
          <input
            id="cr-contact"
            type="email"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="optional@example.com"
            className="w-full max-w-md rounded-lg border border-sp-border bg-white px-3 py-2 text-sm text-sp-text"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-sp-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-sp-navy-dark disabled:opacity-60 cursor-pointer"
        >
          {submitting ? t.submitting : t.submitBtn}
        </button>
      </form>
    </section>
  );
}
