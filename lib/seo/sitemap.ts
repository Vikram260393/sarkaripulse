import { MOCK_RECRUITMENTS } from "@/lib/data/mock-recruitments";
import { CATEGORIES, QUALIFICATIONS, STATES } from "@/lib/data/taxonomy";
import { LanguageCode, SUPPORTED_LANGUAGES } from "@/lib/types/recruitment";
import { getCanonicalBaseUrl } from "@/lib/seo/metadata";

export interface SitemapUrlEntry {
  url: string;
  lastModified: string;
  changeFrequency: "hourly" | "daily" | "weekly" | "monthly";
  priority: number;
  alternates?: Record<string, string>;
}

const STATIC_HUB_PATHS = [
  "",
  "/latest-jobs",
  "/results",
  "/admit-cards",
  "/answer-keys",
  "/syllabus",
  "/previous-papers",
  "/admissions",
  "/career-guides",
  "/tools",
  "/downloads",
  "/about",
  "/contact",
  "/privacy-policy",
  "/terms",
  "/disclaimer",
  "/editorial-policy",
  "/correction-policy",
  "/advertising-policy",
] as const;

function buildAlternatesMap(
  base: string,
  suffix: string,
  langs: readonly LanguageCode[]
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const l of langs) {
    map[l] = `${base}/${l}${suffix}`;
  }
  if (langs.includes("en")) {
    map["x-default"] = `${base}/en${suffix}`;
  }
  return map;
}

/**
 * Generates clean, language-scoped sitemap URLs (Blueprint Ch. 14 & Ch. 21).
 * Emits only published records and only includes hreflang alternates for actually
 * available translations. Never emits search/filter query-parameter URLs.
 */
export function buildLanguageSitemapEntries(
  lang: LanguageCode
): SitemapUrlEntry[] {
  const base = getCanonicalBaseUrl();
  const nowIso = new Date().toISOString();
  const entries: SitemapUrlEntry[] = [];

  for (const suffix of STATIC_HUB_PATHS) {
    entries.push({
      url: `${base}/${lang}${suffix}`,
      lastModified: nowIso,
      changeFrequency: suffix === "" || suffix === "/latest-jobs" ? "hourly" : "weekly",
      priority: suffix === "" ? 1.0 : suffix === "/latest-jobs" ? 0.9 : 0.6,
      alternates: buildAlternatesMap(base, suffix, SUPPORTED_LANGUAGES),
    });
  }

  for (const st of STATES) {
    const suffix = `/states/${st.slug}`;
    entries.push({
      url: `${base}/${lang}${suffix}`,
      lastModified: nowIso,
      changeFrequency: st.isPriority ? "daily" : "weekly",
      priority: st.isPriority ? 0.9 : 0.7,
      alternates: buildAlternatesMap(base, suffix, SUPPORTED_LANGUAGES),
    });
  }

  for (const cat of CATEGORIES) {
    const suffix = `/category/${cat.slug}`;
    entries.push({
      url: `${base}/${lang}${suffix}`,
      lastModified: nowIso,
      changeFrequency: "daily",
      priority: 0.75,
      alternates: buildAlternatesMap(base, suffix, SUPPORTED_LANGUAGES),
    });
  }

  for (const q of QUALIFICATIONS) {
    const suffix = `/qualification/${q.slug}`;
    entries.push({
      url: `${base}/${lang}${suffix}`,
      lastModified: nowIso,
      changeFrequency: "daily",
      priority: 0.75,
      alternates: buildAlternatesMap(base, suffix, SUPPORTED_LANGUAGES),
    });
  }

  for (const rec of MOCK_RECRUITMENTS) {
    if (rec.editorialState !== "published") continue;
    if (!rec.availableLanguages.includes(lang)) continue;
    const suffix = `/jobs/${rec.slug}`;
    entries.push({
      url: `${base}/${lang}${suffix}`,
      lastModified: rec.lastVerifiedAt,
      changeFrequency: "daily",
      priority: 0.85,
      alternates: buildAlternatesMap(base, suffix, rec.availableLanguages),
    });
  }

  return entries;
}

function escapeXml(val: string): string {
  return val
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function renderLanguageSitemapXml(lang: LanguageCode): string {
  const entries = buildLanguageSitemapEntries(lang);
  const urlNodes = entries
    .map((entry) => {
      const altLinks = entry.alternates
        ? Object.entries(entry.alternates)
            .map(
              ([hreflang, href]) =>
                `    <xhtml:link rel="alternate" hreflang="${escapeXml(hreflang)}" href="${escapeXml(href)}" />`
            )
            .join("\n")
        : "";
      return [
        "  <url>",
        `    <loc>${escapeXml(entry.url)}</loc>`,
        `    <lastmod>${escapeXml(entry.lastModified)}</lastmod>`,
        `    <changefreq>${entry.changeFrequency}</changefreq>`,
        `    <priority>${entry.priority.toFixed(1)}</priority>`,
        ...(altLinks ? [altLinks] : []),
        "  </url>",
      ].join("\n");
    })
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    urlNodes,
    "</urlset>",
  ].join("\n");
}
