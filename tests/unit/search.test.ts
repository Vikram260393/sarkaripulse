import { describe, expect, it } from "vitest";
import { MOCK_RECRUITMENTS } from "@/lib/data/mock-recruitments";
import { filterRecruitments, serializeFilterQuery } from "@/lib/utils/search";

describe("filterRecruitments (Blueprint Ch. 16 structured search & combinable filters)", () => {
  it("returns all sample records when no filters are active", () => {
    expect(filterRecruitments(MOCK_RECRUITMENTS, {}).length).toBe(
      MOCK_RECRUITMENTS.length
    );
  });

  it("filters by Maharashtra state priority cleanly", () => {
    const mh = filterRecruitments(MOCK_RECRUITMENTS, { state: "maharashtra" });
    expect(mh.length).toBeGreaterThan(0);
    expect(mh.every((r) => r.stateCode === "MH")).toBe(true);
  });

  it("combines state, qualification, and lifecycle status filters", () => {
    const result = filterRecruitments(MOCK_RECRUITMENTS, {
      state: "maharashtra",
      qualification: "12th-pass",
      status: "closing_soon",
    });
    expect(result.length).toBe(1);
    expect(result[0].slug).toContain("police-constable");
  });

  it("searches across notification reference numbers and Devanagari text", () => {
    const byNotice = filterRecruitments(MOCK_RECRUITMENTS, {
      q: "SAMPLE-MPSC-2026-01",
    });
    expect(byNotice.length).toBe(1);

    const byMarathi = filterRecruitments(MOCK_RECRUITMENTS, {
      q: "महावितरण",
    });
    expect(byMarathi.length).toBe(1);
    expect(byMarathi[0].categorySlug).toBe("psu");
  });

  it("returns empty array cleanly when no records match", () => {
    const none = filterRecruitments(MOCK_RECRUITMENTS, {
      q: "nonexistent-org-xyz-999",
    });
    expect(none).toEqual([]);
  });

  it("serializes shareable query parameters omitting empty or 'all' values", () => {
    const qs = serializeFilterQuery({
      q: " MPSC ",
      state: "maharashtra",
      category: "all",
      qualification: "graduate",
    });
    expect(qs).toBe("q=MPSC&state=maharashtra&qualification=graduate");
  });
});
