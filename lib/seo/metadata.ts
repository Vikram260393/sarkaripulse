import type { Metadata } from "next";
import { LanguageCode, SUPPORTED_LANGUAGES } from "@/lib/types/recruitment";

export function getCanonicalBaseUrl(): string {
  const host = (process.env.NEXT_PUBLIC_CANONICAL_HOST || "sarkaripulse.in")
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "");
  return `https://${host}`;
}

/**
 * Builds canonical URL and bidirectional hreflang alternates strictly for
 * languages where an equivalent page is actually published (Blueprint Ch. 14 & Ch. 21).
 */
export function buildLocalizedAlternates(
  pathWithoutLang: string,
  currentLang: LanguageCode,
  availableLanguages: readonly LanguageCode[] = SUPPORTED_LANGUAGES
): Metadata["alternates"] {
  const base = getCanonicalBaseUrl();
  const suffix = pathWithoutLang
    ? pathWithoutLang.startsWith("/")
      ? pathWithoutLang
      : `/${pathWithoutLang}`
    : "";

  const effectiveLang: LanguageCode = availableLanguages.includes(currentLang)
    ? currentLang
    : availableLanguages.includes("en")
    ? "en"
    : availableLanguages[0];

  const languages: Record<string, string> = {};
  for (const lang of availableLanguages) {
    languages[lang] = `${base}/${lang}${suffix}`;
  }
  if (availableLanguages.includes("en")) {
    languages["x-default"] = `${base}/en${suffix}`;
  }

  return {
    canonical: `${base}/${effectiveLang}${suffix}`,
    languages,
  };
}

/**
 * Prevents indexing arbitrary search-result parameter combinations and empty filter pages
 * (Blueprint Ch. 21).
 */
export function shouldNoIndexDirectory(
  searchParams: Record<string, string | string[] | undefined>,
  resultCount: number
): boolean {
  if (resultCount === 0) return true;
  const filterKeys = ["q", "state", "category", "qualification", "status", "employmentType"];
  return filterKeys.some((key) => {
    const val = searchParams[key];
    return typeof val === "string" && val.trim().length > 0 && val !== "all";
  });
}
