import { LanguageCode } from "@/lib/types/recruitment";

/**
 * All 10 Blueprint Ch. 22 Privacy-Safe Analytics Events.
 * Never transmits PII, candidate application details, or raw search strings.
 */
export type AnalyticsEventName =
  | "search_submitted"
  | "filter_applied"
  | "recruitment_opened"
  | "official_notification_clicked"
  | "official_application_clicked"
  | "pdf_downloaded"
  | "bookmark_added"
  | "language_changed"
  | "alert_subscribed"
  | "correction_reported";

const ALLOWED_PARAMS_BY_EVENT: Readonly<
  Record<AnalyticsEventName, readonly string[]>
> = {
  search_submitted: ["language", "has_filters", "result_count_bucket"],
  filter_applied: ["language", "filter_type", "filter_slug"],
  recruitment_opened: [
    "language",
    "recruitment_id",
    "category_slug",
    "state_code",
    "lifecycle_status",
  ],
  official_notification_clicked: [
    "language",
    "recruitment_id",
    "destination_domain",
  ],
  official_application_clicked: [
    "language",
    "recruitment_id",
    "destination_domain",
  ],
  pdf_downloaded: ["language", "pdf_id", "document_type"],
  bookmark_added: ["language", "recruitment_id"],
  language_changed: ["from_lang", "to_lang", "page_type"],
  alert_subscribed: ["language", "channel", "frequency"],
  correction_reported: ["language", "page_type", "issue_type"],
};

const PII_VALUE_PATTERNS: readonly RegExp[] = [
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i, // Email
  /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // Aadhaar-like 12-digit number
  /\b[A-Z]{5}\d{4}[A-Z]\b/, // Indian PAN pattern
  /\b(?:\+91[\s-]?)?[6-9]\d{9}\b/, // Indian mobile phone number
];

export interface SanitizedAnalyticsPayload {
  event: AnalyticsEventName;
  timestamp_utc: string;
  params: Record<string, string | number | boolean>;
  strippedKeys: string[];
}

export function bucketResultCount(count: number): string {
  if (count <= 0) return "0";
  if (count <= 5) return "1-5";
  if (count <= 20) return "6-20";
  return "21+";
}

/**
 * Strips disallowed keys (such as raw search queries `q`, `email`, `phone`, `aadhaar`)
 * and redacts any value matching PII patterns (Blueprint Ch. 22).
 */
export function sanitizeAnalyticsEvent(
  event: AnalyticsEventName,
  rawParams: Record<string, unknown>
): SanitizedAnalyticsPayload {
  const allowed = new Set(ALLOWED_PARAMS_BY_EVENT[event]);
  const cleanParams: Record<string, string | number | boolean> = {};
  const strippedKeys: string[] = [];

  for (const [key, value] of Object.entries(rawParams)) {
    if (!allowed.has(key)) {
      strippedKeys.push(key);
      continue;
    }
    if (typeof value === "boolean" || typeof value === "number") {
      cleanParams[key] = value;
      continue;
    }
    if (typeof value === "string") {
      const trimmed = value.trim().slice(0, 120);
      const containsPii = PII_VALUE_PATTERNS.some((rx) => rx.test(trimmed));
      if (containsPii) {
        strippedKeys.push(key);
        continue;
      }
      cleanParams[key] = trimmed;
      continue;
    }
    strippedKeys.push(key);
  }

  return {
    event,
    timestamp_utc: new Date().toISOString(),
    params: cleanParams,
    strippedKeys,
  };
}

export function trackSafeEvent(
  event: AnalyticsEventName,
  params: Record<string, unknown> & { language?: LanguageCode }
): SanitizedAnalyticsPayload {
  return sanitizeAnalyticsEvent(event, params);
}
