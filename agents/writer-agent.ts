import { z } from "zod";
import { RecruitmentRecord } from "@/lib/types/recruitment";
import {
  extractDestinationDomain,
  formatCalendarDate,
  formatCurrencyInr,
  formatVacancyCount,
  isSafeHttpUrl,
} from "@/lib/utils/formatters";
import { ARTICLE_PROMPT_VERSION } from "@/prompts/editorial-v1";

export const REQUIRED_ARTICLE_SECTION_KEYS = [
  "overview",
  "important_dates",
  "vacancy_distribution",
  "post_details",
  "qualification",
  "experience",
  "age_limit",
  "category_relaxation",
  "fee",
  "salary_pay_level",
  "selection_process",
  "exam_pattern",
  "documents",
  "application_steps",
  "official_links",
  "faqs",
  "source_citations",
  "update_history",
  "disclaimer",
] as const;

export type ArticleSectionKey = (typeof REQUIRED_ARTICLE_SECTION_KEYS)[number];

export const ArticleSectionSchema = z.object({
  key: z.enum(REQUIRED_ARTICLE_SECTION_KEYS),
  heading: z.string().trim().min(2),
  body: z.string().trim().min(1),
});

export const MasterArticleDraftSchema = z.object({
  recruitmentId: z.string().min(1),
  slug: z.string().min(2),
  languageCode: z.literal("en"),
  versionNumber: z.number().int().positive(),
  promptVersion: z.string().min(1),
  modelVersion: z.string().min(1),
  title: z.string().trim().min(5).max(240),
  summary: z.string().trim().min(20).max(600),
  seoTitle: z.string().trim().min(10).max(160),
  seoDescription: z.string().trim().min(30).max(320),
  canonicalPath: z.string().startsWith("/en/jobs/"),
  notificationReference: z.string().nullable(),
  vacancyTotal: z.number().int().nonnegative().nullable(),
  applicationEnd: z.string().nullable(),
  officialLinks: z.array(
    z.object({
      linkType: z.string(),
      label: z.string(),
      url: z.string().url(),
      destinationDomain: z.string().nullable(),
    })
  ),
  sections: z.array(ArticleSectionSchema),
  isApproximateSalaryLabelled: z.boolean(),
  generatedAt: z.string().datetime(),
});

export type MasterArticleDraft = z.infer<typeof MasterArticleDraftSchema>;

export interface EditorialQualityReport {
  passed: boolean;
  issues: string[];
}

const GENERIC_FILLER_PATTERNS: readonly RegExp[] = [
  /\blorem ipsum\b/i,
  /\b\[insert\b/i,
  /\btbd\b/i,
  /\bcoming soon\b/i,
  /\bplaceholder text\b/i,
  /\bguaranteed selection\b/i,
  /\b100% job guarantee\b/i,
];

/**
 * Editorial Quality Gate (Blueprint Ch. 13 & Ch. 36):
 * Blocks articles with empty headings/sections, generic filler, unsupported salary claims,
 * unsafe links, or missing independent platform disclaimers.
 */
export function validateArticleQuality(
  draft: MasterArticleDraft
): EditorialQualityReport {
  const issues: string[] = [];

  const sectionByKey = new Map(draft.sections.map((s) => [s.key, s]));
  for (const key of REQUIRED_ARTICLE_SECTION_KEYS) {
    const sec = sectionByKey.get(key);
    if (!sec) {
      // FAQs may be omitted if no grounded FAQs exist; all other 18 sections are mandatory
      if (key !== "faqs") {
        issues.push(`Missing required article section: '${key}'.`);
      }
      continue;
    }
    if (sec.heading.trim().length < 2 || sec.body.trim().length < 8) {
      issues.push(`Section '${key}' has an empty heading or insufficient body.`);
    }
    for (const filler of GENERIC_FILLER_PATTERNS) {
      if (filler.test(sec.body) || filler.test(sec.heading)) {
        issues.push(`Section '${key}' contains prohibited filler or misleading claim (${filler.source}).`);
      }
    }
  }

  // Official links & safe URL check
  if (draft.officialLinks.length === 0) {
    issues.push("At least one official source or portal link is required.");
  }
  for (const link of draft.officialLinks) {
    if (!isSafeHttpUrl(link.url) || !link.destinationDomain) {
      issues.push(`Unsafe or invalid official link URL: ${link.url}`);
    }
  }

  // Disclaimer check
  const disclaimer = sectionByKey.get("disclaimer")?.body.toLowerCase() ?? "";
  if (
    !disclaimer.includes("independent") ||
    !disclaimer.includes("official notification")
  ) {
    issues.push(
      "Disclaimer section must explicitly state SarkariPulse is independent and the official notification governs."
    );
  }

  // Approximate salary transparency check (Blueprint Ch. 13)
  const salaryBody = sectionByKey.get("salary_pay_level")?.body.toLowerCase() ?? "";
  if (
    salaryBody.includes("approx") &&
    !draft.isApproximateSalaryLabelled
  ) {
    issues.push(
      "Approximate salary explanation must be explicitly labelled with its underlying pay level or official source."
    );
  }

  return {
    passed: issues.length === 0,
    issues,
  };
}

/**
 * Deterministic English Master Article Writer Agent (Blueprint Appendix C & Ch. 13).
 * Refuses to draft from unverified/rejected records. Builds all required sections
 * strictly from verified structured facts with honest unknown labels.
 */
export function buildMasterArticleDraft(
  record: RecruitmentRecord,
  options?: { versionNumber?: number; modelVersion?: string }
): { ok: true; draft: MasterArticleDraft; quality: EditorialQualityReport } | { ok: false; error: string } {
  if (record.verificationStatus !== "verified") {
    return {
      ok: false,
      error: `Cannot generate publishable article from record with verificationStatus='${record.verificationStatus}'. Verification must pass first.`,
    };
  }

  const versionNumber = options?.versionNumber ?? 1;
  const notSpecified = "Not specified in the notification.";

  const datesLines = record.dates
    .map(
      (d) =>
        `${d.label.en}: ${formatCalendarDate(d.eventDate, "en", d.eventTimeLabel)}`
    )
    .join(" | ");

  const postsLines =
    record.posts.length > 0
      ? record.posts
          .map(
            (p) =>
              `${p.postName.en} — Vacancies: ${formatVacancyCount(p.vacancyCount, "en")}, Pay Level: ${p.payLevel ?? "Not specified"}, Qualification: ${p.qualificationSummary.en}`
          )
          .join("; ")
      : notSpecified;

  const feeLines =
    record.feeSchedule.length > 0
      ? record.feeSchedule
          .map((f) => `${f.category.en}: ${formatCurrencyInr(f.amountInr, "en")}`)
          .join("; ")
      : notSpecified;

  const salaryLine = record.paySummary.displayLabel
    ? `${record.paySummary.isApproximate ? "Approximate estimate based on official pay level: " : ""}${record.paySummary.displayLabel}. ${record.paySummary.sourceBasis.en}`
    : notSpecified;

  const officialLinks = record.links.map((l) => ({
    linkType: l.linkType,
    label: l.label.en,
    url: l.url,
    destinationDomain: extractDestinationDomain(l.url),
  }));

  const sections: z.infer<typeof ArticleSectionSchema>[] = [
    {
      key: "overview",
      heading: "Recruitment Overview",
      body: `${record.organisation.en} (${record.department.en}) has issued recruitment cycle ${record.cycleLabel} (Notification Reference: ${record.notificationReference ?? "Not specified in the notification"}). ${record.summary.en}`,
    },
    {
      key: "important_dates",
      heading: "Important Dates",
      body: datesLines || notSpecified,
    },
    {
      key: "vacancy_distribution",
      heading: "Vacancy Distribution",
      body: `Total Vacancies: ${formatVacancyCount(record.vacancyTotal, "en")}. Confirm category-wise reservation tables in the original official notification.`,
    },
    {
      key: "post_details",
      heading: "Post-Wise Details",
      body: postsLines,
    },
    {
      key: "qualification",
      heading: "Educational Qualification",
      body:
        record.qualificationSlugs.length > 0
          ? `Eligible qualification categories: ${record.qualificationSlugs.join(", ")}. Confirm stream-specific requirements in the official notice.`
          : notSpecified,
    },
    {
      key: "experience",
      heading: "Experience Requirements",
      body: record.experienceRequirement.en || notSpecified,
    },
    {
      key: "age_limit",
      heading: "Age Limit",
      body:
        record.minAge !== null && record.maxAge !== null
          ? `Age limit: ${record.minAge} to ${record.maxAge} years as on cut-off date ${formatCalendarDate(record.ageCutOffDate, "en")}.`
          : notSpecified,
    },
    {
      key: "category_relaxation",
      heading: "Category Age Relaxation",
      body: record.ageRelaxationNote.en || notSpecified,
    },
    {
      key: "fee",
      heading: "Application Fee",
      body: `${feeLines}. Always confirm fee instructions directly on the official recruiting portal.`,
    },
    {
      key: "salary_pay_level",
      heading: "Salary & Pay Level",
      body: salaryLine,
    },
    {
      key: "selection_process",
      heading: "Selection Process",
      body:
        record.selectionStages.length > 0
          ? record.selectionStages.map((s, i) => `${i + 1}. ${s.en}`).join(" ")
          : notSpecified,
    },
    {
      key: "exam_pattern",
      heading: "Exam Pattern",
      body: record.examPatternSummary.en || notSpecified,
    },
    {
      key: "documents",
      heading: "Required Documents",
      body:
        record.requiredDocuments.length > 0
          ? record.requiredDocuments.map((d) => d.en).join("; ")
          : notSpecified,
    },
    {
      key: "application_steps",
      heading: "Step-by-Step Application Process",
      body:
        record.applicationSteps.length > 0
          ? record.applicationSteps.map((s, i) => `${i + 1}. ${s.en}`).join(" ")
          : notSpecified,
    },
    {
      key: "official_links",
      heading: "Official Links",
      body: officialLinks
        .map((l) => `${l.label}: ${l.url} (Domain: ${l.destinationDomain ?? "invalid"})`)
        .join(" | "),
    },
    {
      key: "source_citations",
      heading: "Official Source Citations",
      body: record.sourceCitations
        .map(
          (c) =>
            `${c.sourceName} (${c.officialDomain}, Ref: ${c.documentReference ?? "N/A"}, Verified: ${c.retrievedAt})`
        )
        .join("; "),
    },
    {
      key: "update_history",
      heading: "Update & Correction History",
      body: record.updateHistory
        .map((u) => `${u.updatedAt}: ${u.summary.en} (${u.sourceReference})`)
        .join("; "),
    },
    {
      key: "disclaimer",
      heading: "Important Disclaimer",
      body: "SarkariPulse is an independent recruitment-information platform and is not affiliated with or endorsed by any government authority. This article is an informational summary only; the original official notification published by the recruiting authority governs in all respects.",
    },
  ];

  if (record.faqs.length > 0) {
    sections.splice(15, 0, {
      key: "faqs",
      heading: "Frequently Asked Questions",
      body: record.faqs.map((f) => `Q: ${f.question.en} A: ${f.answer.en}`).join(" | "),
    });
  }

  const draft: MasterArticleDraft = {
    recruitmentId: record.id,
    slug: record.slug,
    languageCode: "en",
    versionNumber,
    promptVersion: ARTICLE_PROMPT_VERSION,
    modelVersion: options?.modelVersion ?? "deterministic-structured-v1",
    title: record.title.en,
    summary: record.summary.en,
    seoTitle: `${record.title.en} — Eligibility, Dates & Official Links`.slice(0, 160),
    seoDescription: `${record.organisation.en}: ${formatVacancyCount(record.vacancyTotal, "en")} vacancies, closing date ${formatCalendarDate(record.applicationEnd, "en")}. Verified eligibility & official links.`.slice(
      0,
      320
    ),
    canonicalPath: `/en/jobs/${record.slug}`,
    notificationReference: record.notificationReference,
    vacancyTotal: record.vacancyTotal,
    applicationEnd: record.applicationEnd,
    officialLinks,
    sections,
    isApproximateSalaryLabelled: !record.paySummary.isApproximate || salaryLine.toLowerCase().includes("approximate"),
    generatedAt: new Date().toISOString(),
  };

  const quality = validateArticleQuality(draft);
  return { ok: true, draft, quality };
}
