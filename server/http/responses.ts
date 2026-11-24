import "server-only";
import { NextResponse } from "next/server";
import type { ApiErrorCode, ApiErrorEnvelope } from "@/lib/schemas/api";

export function createCorrelationId(): string {
  return crypto.randomUUID();
}

/**
 * Returns machine-readable JSON errors without ever leaking stack traces or secrets
 * (Blueprint Ch. 32).
 */
export function jsonApiError(
  status: number,
  code: ApiErrorCode,
  message: string,
  details?: Record<string, string[]>,
  extraHeaders?: Record<string, string>
): NextResponse<ApiErrorEnvelope> {
  const correlationId = createCorrelationId();
  return NextResponse.json(
    {
      error: {
        code,
        message,
        correlation_id: correlationId,
        ...(details ? { details } : {}),
      },
    },
    {
      status,
      headers: {
        "X-Correlation-Id": correlationId,
        "Cache-Control": "no-store",
        ...extraHeaders,
      },
    }
  );
}
