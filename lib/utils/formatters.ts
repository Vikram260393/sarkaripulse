import {
  LanguageCode,
  LocalizedText,
  RecruitmentLifecycleStatus,
  SUPPORTED_LANGUAGES,
} from "@/lib/types/recruitment";

export function isValidLanguage(value: string): value is LanguageCode {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

export function resolveLocalizedText(
  text: LocalizedText,
  lang: LanguageCode
): { value: string; isFallback: boolean } {
  const localized = text[lang];
  if (localized && localized.trim().length > 0) {
    return { value: localized, isFallback: false };
  }
  return { value: text.en, isFallback: lang !== "en" };
}

const NOT_SPECIFIED_LABEL: Record<LanguageCode, string> = {
  en: "Not specified in the notification",
  hi: "अधिसूचना में निर्दिष्ट नहीं",
  mr: "अधिसूचनेत नमूद नाही",
};

const LOCALE_MAP: Record<LanguageCode, string> = {
  en: "en-IN",
  hi: "hi-IN",
  mr: "mr-IN",
};

/**
 * Formats a date-only string (YYYY-MM-DD) as a calendar date without inventing
 * any deadline time (e.g., never adds 11:59 PM) and avoiding UTC timezone shift.
 */
export function formatCalendarDate(
  dateStr: string | null | undefined,
  lang: LanguageCode = "en",
  timeLabel?: string | null
): string {
  if (!dateStr) {
    return NOT_SPECIFIED_LABEL[lang];
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim());
  if (!match) {
    return NOT_SPECIFIED_LABEL[lang];
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return NOT_SPECIFIED_LABEL[lang];
  }

  const utcDate = new Date(Date.UTC(year, month - 1, day));
  if (
    utcDate.getUTCFullYear() !== year ||
    utcDate.getUTCMonth() !== month - 1 ||
    utcDate.getUTCDate() !== day
  ) {
    return NOT_SPECIFIED_LABEL[lang];
  }

  const formatted = new Intl.DateTimeFormat(LOCALE_MAP[lang], {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(utcDate);

  if (timeLabel && timeLabel.trim().length > 0) {
    return `${formatted} (${timeLabel.trim()})`;
  }
  return formatted;
}

/**
 * Renders a UTC ISO-8601 timestamp in Asia/Kolkata (IST) for the Indian audience.
 */
export function formatVerifiedTimestamp(
  isoTimestamp: string,
  lang: LanguageCode = "en"
): string {
  const parsed = new Date(isoTimestamp);
  if (Number.isNaN(parsed.getTime())) {
    return NOT_SPECIFIED_LABEL[lang];
  }
  const formatted = new Intl.DateTimeFormat(LOCALE_MAP[lang], {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  }).format(parsed);
  return `${formatted} IST`;
}

/**
 * Separates null ("not specified") from explicit zero or positive vacancy counts.
 */
export function formatVacancyCount(
  count: number | null | undefined,
  lang: LanguageCode = "en"
): string {
  if (count === null || count === undefined || Number.isNaN(count) || count < 0) {
    return NOT_SPECIFIED_LABEL[lang];
  }
  return new Intl.NumberFormat(LOCALE_MAP[lang]).format(count);
}

export function formatCurrencyInr(
  amount: number | null | undefined,
  lang: LanguageCode = "en"
): string {
  if (amount === null || amount === undefined || Number.isNaN(amount) || amount < 0) {
    return NOT_SPECIFIED_LABEL[lang];
  }
  if (amount === 0) {
    const exemptLabels: Record<LanguageCode, string> = {
      en: "₹0 (Exempt / Nil)",
      hi: "₹0 (निःशुल्क / छूट)",
      mr: "₹0 (निःशुल्क / सूट)",
    };
    return exemptLabels[lang];
  }
  return `₹${new Intl.NumberFormat(LOCALE_MAP[lang]).format(amount)}`;
}

/**
 * Validates that a URL uses http/https only (blocks javascript:, data:, etc.).
 */
export function isSafeHttpUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Extracts destination hostname for transparent external link display (Blueprint Ch. 23).
 */
export function extractDestinationDomain(rawUrl: string): string | null {
  if (!isSafeHttpUrl(rawUrl)) {
    return null;
  }
  try {
    return new URL(rawUrl).hostname.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Generates stable, lowercase, hyphenated URL slugs (Blueprint Ch. 02).
 */
export function normalizeSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Separates real-world application-open state from editorial published state.
 */
export function isApplicationActive(status: RecruitmentLifecycleStatus): boolean {
  return status === "application_open" || status === "closing_soon";
}

export function isRecruitmentClosed(status: RecruitmentLifecycleStatus): boolean {
  return (
    status === "application_closed" ||
    status === "completed" ||
    status === "archived"
  );
}

/**
 * Builds the equivalent translated path for the language switcher (Blueprint Ch. 14).
 * Links directly to the corresponding translated page rather than always resetting to home.
 */
export function buildLanguageSwitchPath(
  currentPathname: string,
  targetLang: LanguageCode,
  availableLanguages?: LanguageCode[]
): { href: string; isFallback: boolean } {
  const cleanPath = currentPathname.startsWith("/")
    ? currentPathname
    : `/${currentPathname}`;
  const segments = cleanPath.split("/").filter(Boolean);
  const restSegments =
    segments.length > 0 && isValidLanguage(segments[0])
      ? segments.slice(1)
      : segments;

  if (
    availableLanguages &&
    availableLanguages.length > 0 &&
    !availableLanguages.includes(targetLang)
  ) {
    const fallbackLang: LanguageCode = availableLanguages.includes("en")
      ? "en"
      : availableLanguages[0];
    const fallbackPath =
      restSegments.length > 0
        ? `/${fallbackLang}/${restSegments.join("/")}`
        : `/${fallbackLang}`;
    return { href: fallbackPath, isFallback: true };
  }

  const targetPath =
    restSegments.length > 0
      ? `/${targetLang}/${restSegments.join("/")}`
      : `/${targetLang}`;
  return { href: targetPath, isFallback: false };
}
