import { describe, expect, it } from "vitest";
import { EXTRACTION_SCHEMA_VERSION } from "@/lib/schemas/extraction";
import { runExtractionAgent } from "@/agents/extraction-agent";
import { AiModelProvider } from "@/server/ai/provider";
import { parseHtmlSourceDocument } from "@/workers/parsers/document-parser";

describe("Extraction Agent — Schema Strictness & Prompt-Injection Boundary (Blueprint Appendix C & D)", () => {
  const sampleHtml = `
    <html>
      <head><title>MPSC Advt 01/2026</title></head>
      <body>
        <p>Advt No 01/2026. Vacancies: 480. Closing Date: 18 Dec 2026.</p>
      </body>
    </html>
  `;

  it("returns validated ExtractionOutput and records prompt & model versions", async () => {
    const validPayload = {
      schema_version: EXTRACTION_SCHEMA_VERSION,
      source_id: "src-mh-mpsc",
      source_url: "https://mpsc.gov.in/adv_notification/8",
      retrieved_at: "2026-11-23T10:00:00Z",
      content_hash: "b".repeat(64),
      document_reference: "01/2026",
      parser_version: "v1.0.0",
      model_version: "mock-gemini-flash",
      ai_confidence_priority: 0.92,
      is_corrigendum: false,
      facts: {
        title: "Maharashtra Group-B Combined Services 2026",
        organisation: "MPSC",
        department: null,
        state_code: "MH",
        cycle_label: "2026",
        vacancy_total: 480,
        posts: [],
        qualifications: ["graduate"],
        min_age: 18,
        max_age: 38,
        age_cut_off_date: null,
        category_relaxation: null,
        fees: [],
        pay_summary: null,
        application_start: "2026-11-20",
        application_end: "2026-12-18",
        selection_stages: ["Preliminary"],
        official_notification_url: "https://mpsc.gov.in/adv_notification/8",
        official_apply_url: "https://mpsconline.gov.in/",
      },
      evidence: [
        {
          field: "application_end",
          value: "2026-12-18",
          status_kind: "present",
          source_url: "https://mpsc.gov.in/adv_notification/8",
          locator: {
            document_page: 1,
            evidence_excerpt: "Closing Date: 18 Dec 2026",
          },
          verification_status: "pending",
        },
      ],
    };

    const mockProvider: AiModelProvider = {
      providerName: "mock",
      async generateStructuredJson(req) {
        // Verify untrusted content is wrapped in non-instruction tags & Appendix D guardrail is present
        expect(req.systemInstruction).toContain("untrusted source data");
        expect(req.userPrompt).toContain("<UNTRUSTED_SOURCE_DATA");
        return {
          modelVersion: "mock-gemini-flash",
          rawText: JSON.stringify(validPayload),
          estimatedInputTokens: 200,
          estimatedOutputTokens: 150,
        };
      },
    };

    const parsed = parseHtmlSourceDocument(sampleHtml, "https://mpsc.gov.in/");
    const res = await runExtractionAgent({
      sourceId: "src-mh-mpsc",
      sourceUrl: "https://mpsc.gov.in/adv_notification/8",
      contentHash: "b".repeat(64),
      retrievedAt: "2026-11-23T10:00:00Z",
      parsedDocument: parsed,
      provider: mockProvider,
    });

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.output.facts.vacancy_total).toBe(480);
      expect(res.promptVersion).toBe("extraction-prompt-v1.0.0");
      expect(res.estimatedTokens).toBe(350);
    }
  });

  it("rejects payloads with injected extra untrusted fields via strict JSON Schema", async () => {
    const extraFieldProvider: AiModelProvider = {
      providerName: "mock",
      async generateStructuredJson() {
        return {
          modelVersion: "mock-gemini-flash",
          rawText: JSON.stringify({
            schema_version: EXTRACTION_SCHEMA_VERSION,
            extra_injected_admin_flag: true,
          }),
          estimatedInputTokens: 100,
          estimatedOutputTokens: 50,
        };
      },
    };

    const parsed = parseHtmlSourceDocument(sampleHtml, "https://mpsc.gov.in/");
    const res = await runExtractionAgent({
      sourceId: "src-mh-mpsc",
      sourceUrl: "https://mpsc.gov.in/adv_notification/8",
      contentHash: "b".repeat(64),
      retrievedAt: "2026-11-23T10:00:00Z",
      parsedDocument: parsed,
      provider: extraFieldProvider,
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.errorCode).toBe("SCHEMA_VALIDATION_FAILED");
    }
  });
});
