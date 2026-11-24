import { describe, expect, it } from "vitest";
import { MOCK_RECRUITMENTS } from "@/lib/data/mock-recruitments";
import {
  buildLocalizedAlternates,
  shouldNoIndexDirectory,
} from "@/lib/seo/metadata";
import {
  buildLanguageSitemapEntries,
  renderLanguageSitemapXml,
} from "@/lib/seo/sitemap";
import {
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildJobPostingJsonLd,
  buildOrganizationJsonLd,
  buildWebSiteJsonLd,
  serializeSafeJsonLd,
} from "@/lib/seo/jsonld";
import {
  bucketResultCount,
  sanitizeAnalyticsEvent,
} from "@/lib/analytics/events";

describe("Canonical URLs, hreflang & noindex hygiene (Blueprint Ch. 14 & Ch. 21)", () => {
  it("emits canonical and hreflang alternates strictly for available translations", () => {
    // SSC sample omits 'mr'
    const sscAlts = buildLocalizedAlternates(
      "/jobs/ssc-combined-higher-secondary-level-sample-preview",
      "mr",
      ["en", "hi"]
    );
    expect(sscAlts?.canonical).toBe(
      "https://sarkaripulse.in/en/jobs/ssc-combined-higher-secondary-level-sample-preview"
    );
    const langs = sscAlts?.languages as Record<string, string>;
    expect(langs.en).toContain("/en/jobs/");
    expect(langs.hi).toContain("/hi/jobs/");
    expect(langs["x-default"]).toContain("/en/jobs/");
    expect(langs.mr).toBeUndefined();
  });

  it("marks filtered search queries and empty directories as noindex", () => {
    expect(shouldNoIndexDirectory({}, 5)).toBe(false);
    expect(shouldNoIndexDirectory({ q: "MPSC" }, 2)).toBe(true);
    expect(shouldNoIndexDirectory({ state: "maharashtra" }, 2)).toBe(true);
    expect(shouldNoIndexDirectory({}, 0)).toBe(true);
  });
});

describe("Language-Specific XML Sitemaps (Blueprint Ch. 14 & Ch. 21)", () => {
  it("generates valid XML sitemaps and excludes unavailable translations", () => {
    const mrEntries = buildLanguageSitemapEntries("mr");
    // SSC sample omits Marathi -> must NOT appear in sitemap-mr.xml
    expect(
      mrEntries.some((e) =>
        e.url.includes("ssc-combined-higher-secondary-level-sample-preview")
      )
    ).toBe(false);
    // MPSC sample includes Marathi -> MUST appear
    expect(
      mrEntries.some((e) =>
        e.url.includes("/mr/jobs/maharashtra-group-b-non-gazetted-sample-preview")
      )
    ).toBe(true);
    // Must never contain query parameters
    expect(mrEntries.every((e) => !e.url.includes("?"))).toBe(true);

    const xml = renderLanguageSitemapXml("en");
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
    expect(xml).toContain('hreflang="x-default"');
  });
});

describe("Structured Data JSON-LD Governance (Blueprint Ch. 21)", () => {
  it("builds valid Organization, WebSite, BreadcrumbList, and Article JSON-LD", () => {
    expect(buildOrganizationJsonLd()["@type"]).toBe("Organization");
    expect(buildWebSiteJsonLd("hi")["@type"]).toBe("WebSite");
    expect(
      buildBreadcrumbJsonLd([{ name: "Home", path: "/en" }, { name: "Jobs" }])["@type"]
    ).toBe("BreadcrumbList");
    expect(buildArticleJsonLd(MOCK_RECRUITMENTS[0], "en")["@type"]).toBe("Article");
  });

  it("STRICTLY gates JobPosting: returns null for sample, closed, unverified, or expired jobs", () => {
    // Sample preview record MUST return null
    expect(buildJobPostingJsonLd(MOCK_RECRUITMENTS[0], "en")).toBeNull();

    // Real verified open job MUST emit valid JobPosting
    const liveVerifiedOpen = {
      ...MOCK_RECRUITMENTS[0],
      isSamplePreview: false,
      lifecycleStatus: "application_open" as const,
      applicationEnd: "2026-12-18",
    };
    const validPosting = buildJobPostingJsonLd(liveVerifiedOpen, "en", {
      nowIsoDate: "2026-11-23",
    });
    expect(validPosting).not.toBeNull();
    expect(validPosting?.["@type"]).toBe("JobPosting");
    expect(validPosting?.validThrough).toBe("2026-12-18");

    // Past closing date MUST return null even if status wasn't flipped yet
    const expiredPosting = buildJobPostingJsonLd(liveVerifiedOpen, "en", {
      nowIsoDate: "2026-12-25",
    });
    expect(expiredPosting).toBeNull();

    // Closed lifecycle status MUST return null
    const closedRecord = {
      ...liveVerifiedOpen,
      lifecycleStatus: "application_closed" as const,
    };
    expect(
      buildJobPostingJsonLd(closedRecord, "en", { nowIsoDate: "2026-11-23" })
    ).toBeNull();
  });

  it("escapes </script> sequences in serialized JSON-LD to prevent XSS", () => {
    const serialized = serializeSafeJsonLd({
      headline: "</script><script>alert(1)</script>",
    });
    expect(serialized).not.toContain("</script>");
    expect(serialized).toContain("\\u003c/script>");
  });
});

describe("Privacy-Safe Analytics Sanitizer (Blueprint Ch. 22)", () => {
  it("strips raw search queries, emails, mobile numbers, Aadhaar, and PAN patterns", () => {
    const clean = sanitizeAnalyticsEvent("search_submitted", {
      language: "en",
      has_filters: true,
      result_count_bucket: bucketResultCount(4),
      q: "Vikram 9876543210 user@example.com",
      email: "user@example.com",
      aadhaar: "1234 5678 9012",
    });

    expect(clean.params).toEqual({
      language: "en",
      has_filters: true,
      result_count_bucket: "1-5",
    });
    expect(clean.strippedKeys).toContain("q");
    expect(clean.strippedKeys).toContain("email");
    expect(clean.strippedKeys).toContain("aadhaar");

    // Even inside an allowed string field, embedded PII is stripped
    const piiInAllowedField = sanitizeAnalyticsEvent("filter_applied", {
      language: "en",
      filter_type: "state",
      filter_slug: "ABCDE1234F", // PAN pattern
    });
    expect(piiInAllowedField.params.filter_slug).toBeUndefined();
    expect(piiInAllowedField.strippedKeys).toContain("filter_slug");
  });
});
