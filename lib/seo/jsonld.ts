import { LanguageCode, RecruitmentRecord } from "@/lib/types/recruitment";
import {
  isApplicationActive,
  isRecruitmentClosed,
  resolveLocalizedText,
} from "@/lib/utils/formatters";
import { getCanonicalBaseUrl } from "@/lib/seo/metadata";

export function buildOrganizationJsonLd(baseUrl: string = getCanonicalBaseUrl()) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "SarkariPulse",
    url: baseUrl,
    description:
      "Independent Indian government recruitment-information platform covering central and state public-sector opportunities with Maharashtra priority.",
  };
}

export function buildWebSiteJsonLd(
  lang: LanguageCode,
  baseUrl: string = getCanonicalBaseUrl()
) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "SarkariPulse",
    url: `${baseUrl}/${lang}`,
    inLanguage: lang,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/${lang}/latest-jobs?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildBreadcrumbJsonLd(
  items: { name: string; path?: string }[],
  baseUrl: string = getCanonicalBaseUrl()
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      ...(item.path ? { item: `${baseUrl}${item.path}` } : {}),
    })),
  };
}

export function buildArticleJsonLd(
  record: RecruitmentRecord,
  lang: LanguageCode,
  baseUrl: string = getCanonicalBaseUrl()
) {
  const title = resolveLocalizedText(record.title, lang).value;
  const description = resolveLocalizedText(record.summary, lang).value;
  const pageUrl = `${baseUrl}/${lang}/jobs/${record.slug}`;

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    inLanguage: lang,
    mainEntityOfPage: pageUrl,
    datePublished: record.firstPublishedAt,
    dateModified: record.lastVerifiedAt,
    author: {
      "@type": "Organization",
      name: "SarkariPulse Editorial Team",
    },
    publisher: {
      "@type": "Organization",
      name: "SarkariPulse",
      url: baseUrl,
    },
  };
}

/**
 * Strictly compliant Schema.org JobPosting builder (Blueprint Ch. 21):
 * - NEVER emits JobPosting for sample/fictional previews, unverified/unpublished drafts,
 *   closed/completed recruitments, or expired application_end dates!
 * - Emits JobPosting ONLY when the record represents a real, verified, currently open
 *   specific job vacancy meeting search-engine eligibility rules.
 */
export function buildJobPostingJsonLd(
  record: RecruitmentRecord,
  lang: LanguageCode,
  options?: { baseUrl?: string; nowIsoDate?: string }
): Record<string, unknown> | null {
  if (record.isSamplePreview) return null;
  if (record.verificationStatus !== "verified") return null;
  if (record.editorialState !== "published") return null;
  if (
    isRecruitmentClosed(record.lifecycleStatus) ||
    !isApplicationActive(record.lifecycleStatus)
  ) {
    return null;
  }
  if (!record.applicationEnd) return null;

  const todayIso =
    options?.nowIsoDate ?? new Date().toISOString().slice(0, 10);
  if (record.applicationEnd < todayIso) {
    return null;
  }

  const baseUrl = options?.baseUrl ?? getCanonicalBaseUrl();
  const title = resolveLocalizedText(record.title, lang).value;
  const description = resolveLocalizedText(record.summary, lang).value;

  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title,
    description,
    datePosted: record.firstPublishedAt.slice(0, 10),
    validThrough: record.applicationEnd,
    employmentType:
      record.employmentType === "permanent"
        ? "FULL_TIME"
        : record.employmentType === "contractual"
        ? "CONTRACTOR"
        : "OTHER",
    hiringOrganization: {
      "@type": "Organization",
      name: record.officialEnglishOrganisation,
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressRegion: record.stateCode === "MH" ? "Maharashtra" : "India",
        addressCountry: "IN",
      },
    },
    identifier: {
      "@type": "PropertyValue",
      name: record.officialEnglishOrganisation,
      value: record.notificationReference ?? record.id,
    },
    url: `${baseUrl}/${lang}/jobs/${record.slug}`,
  };
}

/**
 * Escapes `<` to prevent `</script>` breakouts when embedding JSON-LD in HTML.
 */
export function serializeSafeJsonLd(payload: Record<string, unknown>): string {
  return JSON.stringify(payload).replace(/</g, "\\u003c");
}
