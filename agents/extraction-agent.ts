import "server-only";
import {
  ExtractionOutput,
  ExtractionOutputSchema,
} from "@/lib/schemas/extraction";
import {
  APPENDIX_D_SYSTEM_INSTRUCTION,
  buildExtractionUserPrompt,
  EXTRACTION_PROMPT_VERSION,
} from "@/prompts/extraction-v1";
import { AiModelProvider } from "@/server/ai/provider";
import {
  ParsedSourceDocument,
  wrapUntrustedSourceContent,
} from "@/workers/parsers/document-parser";

export interface ExtractionAgentInput {
  sourceId: string;
  sourceUrl: string;
  contentHash: string;
  retrievedAt: string;
  parsedDocument: ParsedSourceDocument;
  provider: AiModelProvider;
  modelTier?: "fast" | "capable";
}

export type ExtractionAgentResult =
  | {
      ok: true;
      output: ExtractionOutput;
      promptVersion: string;
      modelVersion: string;
      estimatedTokens: number;
      promptInjectionSignals: string[];
    }
  | {
      ok: false;
      errorCode: "MALFORMED_JSON" | "SCHEMA_VALIDATION_FAILED" | "PROVIDER_ERROR";
      message: string;
      promptVersion: string;
      promptInjectionSignals: string[];
    };

/**
 * Extraction Agent implementing Blueprint Appendix C & D contracts:
 * wraps untrusted source content, calls replaceable server-side AI provider,
 * and rejects malformed or extra untrusted fields via strict JSON Schema validation.
 */
export async function runExtractionAgent(
  input: ExtractionAgentInput
): Promise<ExtractionAgentResult> {
  const wrapped = wrapUntrustedSourceContent(
    input.parsedDocument.cleanText,
    input.sourceUrl
  );

  const userPrompt = buildExtractionUserPrompt({
    sourceId: input.sourceId,
    sourceUrl: input.sourceUrl,
    contentHash: input.contentHash,
    retrievedAt: input.retrievedAt,
    wrappedUntrustedContent: wrapped,
  });

  let rawResponseText: string;
  let modelVersion: string;
  let estimatedTokens = 0;

  try {
    const aiRes = await input.provider.generateStructuredJson({
      systemInstruction: APPENDIX_D_SYSTEM_INSTRUCTION,
      userPrompt,
      modelTier: input.modelTier ?? "fast",
      maxOutputTokens: 2500,
      temperature: 0.1,
    });
    rawResponseText = aiRes.rawText;
    modelVersion = aiRes.modelVersion;
    estimatedTokens = aiRes.estimatedInputTokens + aiRes.estimatedOutputTokens;
  } catch (err) {
    return {
      ok: false,
      errorCode: "PROVIDER_ERROR",
      message: err instanceof Error ? err.message : "AI extraction provider failed.",
      promptVersion: EXTRACTION_PROMPT_VERSION,
      promptInjectionSignals: input.parsedDocument.promptInjectionSignals,
    };
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawResponseText);
  } catch {
    return {
      ok: false,
      errorCode: "MALFORMED_JSON",
      message: "AI extractor returned non-JSON output.",
      promptVersion: EXTRACTION_PROMPT_VERSION,
      promptInjectionSignals: input.parsedDocument.promptInjectionSignals,
    };
  }

  const validated = ExtractionOutputSchema.safeParse(parsedJson);
  if (!validated.success) {
    return {
      ok: false,
      errorCode: "SCHEMA_VALIDATION_FAILED",
      message: `Schema validation failed: ${validated.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ")}`,
      promptVersion: EXTRACTION_PROMPT_VERSION,
      promptInjectionSignals: input.parsedDocument.promptInjectionSignals,
    };
  }

  return {
    ok: true,
    output: validated.data,
    promptVersion: EXTRACTION_PROMPT_VERSION,
    modelVersion,
    estimatedTokens,
    promptInjectionSignals: input.parsedDocument.promptInjectionSignals,
  };
}
