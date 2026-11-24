import "server-only";

export interface StructuredAiRequest {
  systemInstruction: string;
  userPrompt: string;
  modelTier: "fast" | "capable";
  maxOutputTokens: number;
  temperature?: number;
}

export interface StructuredAiResponse {
  modelVersion: string;
  rawText: string;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
}

/**
 * Replaceable server-side AI model provider interface (Blueprint Ch. 04 & Ch. 28).
 * Keeps SarkariPulse decoupled from any single model or vendor.
 */
export interface AiModelProvider {
  readonly providerName: string;
  generateStructuredJson(request: StructuredAiRequest): Promise<StructuredAiResponse>;
}

const GEMINI_MODEL_MAP: Record<"fast" | "capable", string> = {
  fast: "gemini-2.5-flash",
  capable: "gemini-2.5-pro",
};

/**
 * Official Gemini API server-side adapter with per-job token caps and timeout.
 * Never logs or echoes `GEMINI_API_KEY`.
 */
export class GeminiAiProvider implements AiModelProvider {
  readonly providerName = "gemini";
  private readonly apiKey: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options: {
    apiKey: string;
    timeoutMs?: number;
    fetchImpl?: typeof fetch;
  }) {
    if (typeof window !== "undefined") {
      throw new Error("GeminiAiProvider is strictly server-only");
    }
    this.apiKey = options.apiKey;
    this.timeoutMs = options.timeoutMs ?? 25_000;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async generateStructuredJson(
    request: StructuredAiRequest
  ): Promise<StructuredAiResponse> {
    const model = GEMINI_MODEL_MAP[request.modelTier];
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await this.fetchImpl(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": this.apiKey,
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: request.systemInstruction }],
          },
          contents: [
            {
              role: "user",
              parts: [{ text: request.userPrompt }],
            },
          ],
          generationConfig: {
            temperature: request.temperature ?? 0.1,
            maxOutputTokens: Math.min(request.maxOutputTokens, 4096),
            responseMimeType: "application/json",
          },
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`Gemini provider returned HTTP ${res.status}`);
      }

      const payload = (await res.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
        usageMetadata?: {
          promptTokenCount?: number;
          candidatesTokenCount?: number;
        };
      };

      const rawText =
        payload.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";

      return {
        modelVersion: model,
        rawText,
        estimatedInputTokens: payload.usageMetadata?.promptTokenCount ?? 0,
        estimatedOutputTokens: payload.usageMetadata?.candidatesTokenCount ?? 0,
      };
    } finally {
      clearTimeout(timer);
    }
  }
}

export function getConfiguredAiProvider(): AiModelProvider | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }
  return new GeminiAiProvider({ apiKey });
}
