import { describe, expect, it } from "vitest";
import {
  EXTRACTION_SCHEMA_VERSION,
  ExtractionOutput,
} from "@/lib/schemas/extraction";
import {
  detectDuplicates,
  normalizeOrganisationName,
} from "@/agents/duplicate-detector";
import {
  evaluateVerificationGate,
  VERIFICATION_RULESET_VERSION,
} from "@/agents/verification-engine";
import { getPilotSourceById, SourceRegistryEntry } from "@/workers/sources/registry";

const APPROVED_MPSC_SOURCE: SourceRegistryEntry = {
  ...getPilotSourceById("src-mh-mpsc")!,
  trustPolicy: "auto_eligible",
  onboardingStatus: "approved",
};

const VALID_OFFICIAL_TEXT = `
  Maharashtra Public Service Commission (MPSC)
  Advertisement No. 01/2026 — Group-B Combined Services
  Total Vacancies: 480 (ASO: 160, STI: 200, PSI: 120)
  Online Application Start Date: 20-11-2026
  Closing Date: 18 Dec 2026
  Apply online at https://mpsconline.gov.in/
`;

function makeValidExtraction(overrides?: Partial<ExtractionOutput>): ExtractionOutput {
  return {
    schema_version: EXTRACTION_SCHEMA_VERSION,
    source_id: APPROVED_MPSC_SOURCE.id,
    source_url: "https://mpsc.gov.in/adv_notification/8",
    retrieved_at: "2026-11-23T10:00:00Z",
    content_hash: "a".repeat(64),
    document_reference: "01/2026",
    parser_version: "v1.0.0",
    model_version: "gemini-2.5-flash",
    ai_confidence_priority: 0.96,
    is_corrigendum: false,
    supersedes_reference: null,
    facts: {
      title: "Maharashtra Group-B Combined Services 2026",
      organisation: "Maharashtra Public Service Commission (MPSC)",
      department: "General Administration Department",
      state_code: "MH",
      cycle_label: "2026",
      vacancy_total: 480,
      posts: [
        { post_name: "ASO", vacancy_count: 160 },
        { post_name: "STI", vacancy_count: 200 },
        { post_name: "PSI", vacancy_count: 120 },
      ],
      qualifications: ["graduate"],
      min_age: 18,
      max_age: 38,
      age_cut_off_date: "2027-01-01",
      category_relaxation: "5 years for Backward Classes per notice.",
      fees: [{ category: "Open", amount_inr: 394 }],
      pay_summary: "Pay Level S-14",
      application_start: "2026-11-20",
      application_end: "2026-12-18",
      selection_stages: ["Preliminary", "Main"],
      official_notification_url: "https://mpsc.gov.in/files/adv-01-2026.pdf",
      official_apply_url: "https://mpsconline.gov.in/",
    },
    evidence: [
      {
        field: "application_end",
        value: "2026-12-18",
        status_kind: "present",
        source_url: "https://mpsc.gov.in/files/adv-01-2026.pdf",
        locator: {
          document_page: 2,
          row_context: "Schedule Table",
          evidence_excerpt: "Closing Date: 18 Dec 2026",
        },
        verification_status: "pending",
      },
    ],
    ...overrides,
  };
}

describe("Verification Engine & Publication Gates (Blueprint Ch. 11, 12, 33)", () => {
  it("approves a clean trusted official fixture and respects kill switch & trust policy", () => {
    const extraction = makeValidExtraction();

    const withKillSwitchOff = evaluateVerificationGate({
      extraction,
      source: APPROVED_MPSC_SOURCE,
      originalSourceText: VALID_OFFICIAL_TEXT,
      ocrConfidenceFlag: "high",
      promptInjectionSignals: [],
      duplicateMatches: [],
      killSwitches: { pausePublishing: false },
    });

    expect(withKillSwitchOff.rulesetVersion).toBe(VERIFICATION_RULESET_VERSION);
    expect(withKillSwitchOff.decision).toBe("verified");
    expect(withKillSwitchOff.autoPublishEligible).toBe(true);

    // Emergency kill switch ON prevents auto-publish even when verified
    const withKillSwitchOn = evaluateVerificationGate({
      extraction,
      source: APPROVED_MPSC_SOURCE,
      originalSourceText: VALID_OFFICIAL_TEXT,
      ocrConfidenceFlag: "high",
      promptInjectionSignals: [],
      duplicateMatches: [],
      killSwitches: { pausePublishing: true },
    });
    expect(withKillSwitchOn.decision).toBe("verified");
    expect(withKillSwitchOn.autoPublishEligible).toBe(false);

    // Unapproved / manual_only source cannot auto-publish
    const manualOnlySource = getPilotSourceById("src-mh-mpsc")!;
    const withManualSource = evaluateVerificationGate({
      extraction,
      source: manualOnlySource,
      originalSourceText: VALID_OFFICIAL_TEXT,
      ocrConfidenceFlag: "high",
      promptInjectionSignals: [],
      duplicateMatches: [],
      killSwitches: { pausePublishing: false },
    });
    expect(withManualSource.decision).toBe("verified");
    expect(withManualSource.autoPublishEligible).toBe(false);
  });

  it("CRITICAL ACCEPTANCE TEST: detects a deliberately altered closing date and blocks publication", () => {
    const altered = makeValidExtraction();
    // Official text says 18 Dec 2026; alter extracted date to 2026-12-29
    altered.facts.application_end = "2026-12-29";
    altered.ai_confidence_priority = 0.99; // High AI confidence MUST NOT override!

    const report = evaluateVerificationGate({
      extraction: altered,
      source: APPROVED_MPSC_SOURCE,
      originalSourceText: VALID_OFFICIAL_TEXT,
      ocrConfidenceFlag: "high",
      promptInjectionSignals: [],
      duplicateMatches: [],
      killSwitches: { pausePublishing: false },
    });

    expect(report.checks.datesMatchSourceText).toBe(false);
    expect(report.decision).toBe("review_required");
    expect(report.autoPublishEligible).toBe(false);
  });

  it("detects post-wise vacancy sum mismatch and blocks publication", () => {
    const mismatched = makeValidExtraction();
    mismatched.facts.posts = [
      { post_name: "ASO", vacancy_count: 100 },
      { post_name: "STI", vacancy_count: 100 },
    ]; // Sum 200 != vacancy_total 480

    const report = evaluateVerificationGate({
      extraction: mismatched,
      source: APPROVED_MPSC_SOURCE,
      originalSourceText: VALID_OFFICIAL_TEXT,
      ocrConfidenceFlag: "high",
      promptInjectionSignals: [],
      duplicateMatches: [],
      killSwitches: { pausePublishing: false },
    });

    expect(report.checks.vacanciesConsistent).toBe(false);
    expect(report.decision).toBe("review_required");
    expect(report.autoPublishEligible).toBe(false);
  });

  it("rejects lookalike/unapproved apply URLs and competitor sources", () => {
    const phishing = makeValidExtraction();
    phishing.facts.official_apply_url = "https://mpsc-online-apply.fake.example/";

    const phishReport = evaluateVerificationGate({
      extraction: phishing,
      source: APPROVED_MPSC_SOURCE,
      originalSourceText: VALID_OFFICIAL_TEXT,
      ocrConfidenceFlag: "high",
      promptInjectionSignals: [],
      duplicateMatches: [],
      killSwitches: { pausePublishing: false },
    });
    expect(phishReport.decision).toBe("rejected");
    expect(phishReport.autoPublishEligible).toBe(false);

    const competitorSource: SourceRegistryEntry = {
      ...APPROVED_MPSC_SOURCE,
      sourceTier: "competitor_untrusted",
    };
    const compReport = evaluateVerificationGate({
      extraction: makeValidExtraction(),
      source: competitorSource,
      originalSourceText: VALID_OFFICIAL_TEXT,
      ocrConfidenceFlag: "high",
      promptInjectionSignals: [],
      duplicateMatches: [],
      killSwitches: { pausePublishing: false },
    });
    expect(compReport.decision).toBe("rejected");
  });

  it("holds uncertain OCR scans and prompt-injection flagged documents for human review", () => {
    const ocrReport = evaluateVerificationGate({
      extraction: makeValidExtraction(),
      source: APPROVED_MPSC_SOURCE,
      originalSourceText: VALID_OFFICIAL_TEXT,
      ocrConfidenceFlag: "uncertain",
      promptInjectionSignals: [],
      duplicateMatches: [],
      killSwitches: { pausePublishing: false },
    });
    expect(ocrReport.decision).toBe("review_required");
    expect(ocrReport.checks.ocrReadable).toBe(false);

    const injectionReport = evaluateVerificationGate({
      extraction: makeValidExtraction(),
      source: APPROVED_MPSC_SOURCE,
      originalSourceText: VALID_OFFICIAL_TEXT,
      ocrConfidenceFlag: "high",
      promptInjectionSignals: ["instruction_override", "forced_publish_command"],
      duplicateMatches: [],
      killSwitches: { pausePublishing: false },
    });
    expect(injectionReport.decision).toBe("review_required");
    expect(injectionReport.checks.promptInjectionClear).toBe(false);
  });

  it("handles material official corrigendum conflicts without averaging and escalates to review queue", () => {
    const corrigendum = makeValidExtraction({
      is_corrigendum: true,
      supersedes_reference: "01/2026",
    });
    corrigendum.facts.application_end = "2026-12-25";

    const report = evaluateVerificationGate({
      extraction: corrigendum,
      source: APPROVED_MPSC_SOURCE,
      originalSourceText: `${VALID_OFFICIAL_TEXT}\nCorrigendum: Closing Date extended to 25 Dec 2026.`,
      ocrConfidenceFlag: "high",
      promptInjectionSignals: [],
      duplicateMatches: [],
      priorOfficialSnapshot: {
        documentReference: "01/2026",
        retrievedAt: "2026-11-18T06:00:00Z",
        applicationEnd: "2026-12-18",
        vacancyTotal: 480,
      },
      killSwitches: { pausePublishing: false },
    });

    expect(report.decision).toBe("review_required");
    expect(report.autoPublishEligible).toBe(false);
    expect(report.conflicts.length).toBe(1);
    expect(report.conflicts[0].priorValue).toBe("2026-12-18");
    expect(report.conflicts[0].incomingValue).toBe("2026-12-25");
    expect(report.conflicts[0].resolutionPolicy).toBe(
      "prefer_latest_corrigendum_hold_for_review"
    );
  });
});

describe("Duplicate Detector & Alias Normalisation (Blueprint Ch. 12 & Ch. 33)", () => {
  it("normalises organisation aliases such as Mahavitran -> MSEDCL", () => {
    expect(normalizeOrganisationName("Mahavitran")).toBe(
      normalizeOrganisationName("MSEDCL")
    );
    expect(normalizeOrganisationName("SSC")).toBe(
      normalizeOrganisationName("Staff Selection Commission (SSC)")
    );
  });

  it("detects exact duplicates on notification reference + source + cycle without merging distinct annual cycles", () => {
    const existing = [
      {
        id: "rec-2025",
        sourceId: "src-mh-mpsc",
        notificationReference: "01/2025",
        organisation: "MPSC",
        title: "Maharashtra Group-B Non-Gazetted Combined Services",
        cycleLabel: "2025",
        applicationEnd: "2025-12-18",
        vacancyTotal: 450,
      },
      {
        id: "rec-2026",
        sourceId: "src-mh-mpsc",
        notificationReference: "01/2026",
        organisation: "Maharashtra Public Service Commission (MPSC)",
        title: "Maharashtra Group-B Non-Gazetted Combined Services",
        cycleLabel: "2026",
        applicationEnd: "2026-12-18",
        vacancyTotal: 480,
      },
    ];

    const exactMatches = detectDuplicates(
      {
        sourceId: "src-mh-mpsc",
        notificationReference: "01 / 2026",
        organisation: "MPSC",
        title: "Maharashtra Group-B Non-Gazetted Combined Services",
        cycleLabel: "2026",
        applicationEnd: "2026-12-18",
        vacancyTotal: 480,
      },
      existing
    );

    expect(
      exactMatches.some(
        (m) => m.existingId === "rec-2026" && m.matchType === "exact_duplicate"
      )
    ).toBe(true);
    // Distinct 2025 cycle must be classified `distinct_cycle` — NEVER merged!
    expect(
      exactMatches.some(
        (m) => m.existingId === "rec-2025" && m.matchType === "distinct_cycle"
      )
    ).toBe(true);
  });
});
