import { describe, expect, it } from "vitest";
import {
  buildLanguageSwitchPath,
  extractDestinationDomain,
  formatCalendarDate,
  formatCurrencyInr,
  formatVacancyCount,
  formatVerifiedTimestamp,
  isApplicationActive,
  isRecruitmentClosed,
  isSafeHttpUrl,
  normalizeSlug,
  resolveLocalizedText,
} from "@/lib/utils/formatters";

describe("formatCalendarDate (Blueprint Ch. 09 — no invented deadline times)", () => {
  it("formats a valid YYYY-MM-DD date cleanly without appending 11:59 PM", () => {
    const out = formatCalendarDate("2026-12-18", "en");
    expect(out).toContain("2026");
    expect(out).not.toContain("11:59");
    expect(out).not.toContain("23:59");
  });

  it("includes explicit time label only when officially stated", () => {
    const out = formatCalendarDate("2026-12-18", "en", "5:00 PM IST");
    expect(out).toContain("5:00 PM IST");
  });

  it("returns honest localized not-specified label for null or invalid calendar dates", () => {
    expect(formatCalendarDate(null, "en")).toBe("Not specified in the notification");
    expect(formatCalendarDate("2026-02-30", "en")).toBe(
      "Not specified in the notification"
    );
    expect(formatCalendarDate("invalid", "hi")).toBe("अधिसूचना में निर्दिष्ट नहीं");
    expect(formatCalendarDate(undefined, "mr")).toBe("अधिसूचनेत नमूद नाही");
  });
});

describe("formatVerifiedTimestamp (Asia/Kolkata IST)", () => {
  it("renders UTC timestamps in Asia/Kolkata IST", () => {
    const out = formatVerifiedTimestamp("2026-11-23T09:15:00Z", "en");
    expect(out).toContain("IST");
    expect(out).toContain("2026");
  });

  it("handles malformed timestamps gracefully", () => {
    expect(formatVerifiedTimestamp("not-a-timestamp", "en")).toBe(
      "Not specified in the notification"
    );
  });
});

describe("formatVacancyCount & formatCurrencyInr", () => {
  it("separates null from explicit zero and positive counts", () => {
    expect(formatVacancyCount(null, "en")).toBe("Not specified in the notification");
    expect(formatVacancyCount(-5, "en")).toBe("Not specified in the notification");
    expect(formatVacancyCount(0, "en")).toBe("0");
    expect(formatVacancyCount(2150, "en")).toBe("2,150");
  });

  it("formats ₹0 as Exempt/Nil and null as not specified", () => {
    expect(formatCurrencyInr(0, "en")).toContain("Exempt");
    expect(formatCurrencyInr(0, "mr")).toContain("निःशुल्क");
    expect(formatCurrencyInr(null, "en")).toBe("Not specified in the notification");
    expect(formatCurrencyInr(394, "en")).toBe("₹394");
  });
});

describe("URL safety & domain extraction (Blueprint Ch. 23)", () => {
  it("accepts https/http official domains and rejects unsafe schemes", () => {
    expect(isSafeHttpUrl("https://mpsc.gov.in/notice")).toBe(true);
    expect(extractDestinationDomain("https://MPSC.GOV.IN/notice")).toBe("mpsc.gov.in");
    expect(isSafeHttpUrl("javascript:alert(1)")).toBe(false);
    expect(extractDestinationDomain("javascript:alert(1)")).toBeNull();
    expect(extractDestinationDomain("data:text/html,hi")).toBeNull();
    expect(extractDestinationDomain("not-a-url")).toBeNull();
  });
});

describe("Slug normalization & lifecycle separation", () => {
  it("produces stable lowercase hyphenated slugs", () => {
    expect(normalizeSlug("MPSC Group-B (Non-Gazetted) 2026!")).toBe(
      "mpsc-group-b-non-gazetted-2026"
    );
  });

  it("distinguishes active vs closed recruitment lifecycle states", () => {
    expect(isApplicationActive("application_open")).toBe(true);
    expect(isApplicationActive("closing_soon")).toBe(true);
    expect(isApplicationActive("application_closed")).toBe(false);
    expect(isRecruitmentClosed("application_closed")).toBe(true);
    expect(isRecruitmentClosed("completed")).toBe(true);
    expect(isRecruitmentClosed("application_open")).toBe(false);
  });
});

describe("Multilingual switcher & fallback (Blueprint Ch. 14)", () => {
  it("preserves exact inner route when switching languages", () => {
    expect(buildLanguageSwitchPath("/en/jobs/mpsc-2026", "mr")).toEqual({
      href: "/mr/jobs/mpsc-2026",
      isFallback: false,
    });
    expect(buildLanguageSwitchPath("/hi/states/maharashtra", "en")).toEqual({
      href: "/en/states/maharashtra",
      isFallback: false,
    });
  });

  it("falls back to verified English master when target translation is unavailable", () => {
    expect(
      buildLanguageSwitchPath("/en/jobs/ssc-chsl", "mr", ["en", "hi"])
    ).toEqual({
      href: "/en/jobs/ssc-chsl",
      isFallback: true,
    });
  });

  it("resolves localized text with honest fallback flag", () => {
    const partial = { en: "Official Notice", hi: "आधिकारिक अधिसूचना" };
    expect(resolveLocalizedText(partial, "hi")).toEqual({
      value: "आधिकारिक अधिसूचना",
      isFallback: false,
    });
    expect(resolveLocalizedText(partial, "mr")).toEqual({
      value: "Official Notice",
      isFallback: true,
    });
  });
});
