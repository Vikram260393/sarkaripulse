import crypto from "node:crypto";
import { extractDestinationDomain, isSafeHttpUrl } from "@/lib/utils/formatters";
import {
  domainMatchesAllowlist,
  SourceRegistryEntry,
} from "@/workers/sources/registry";

export const SARKARIPULSE_USER_AGENT =
  "SarkariPulseBot/1.0 (+https://sarkaripulse.in/editorial-policy; independent-info-service)";

export const MAX_DOCUMENT_BYTES = 25 * 1024 * 1024; // 25 MB cap (Blueprint Ch. 24)

const PERMANENT_HTTP_STATUSES = new Set([400, 401, 403, 404, 410, 451]);

export interface FileSignatureCheck {
  valid: boolean;
  detectedType: "pdf" | "html" | "unknown" | "rejected_executable";
  reason?: string;
}

/**
 * Validates binary magic bytes & MIME type rather than trusting file extensions
 * (Blueprint Ch. 24: rejects executables, suspicious archives, and mismatched signatures).
 */
export function validateFileSignature(
  bytes: Uint8Array,
  declaredMimeType: string,
  maxBytes: number = MAX_DOCUMENT_BYTES
): FileSignatureCheck {
  if (bytes.byteLength === 0) {
    return { valid: false, detectedType: "unknown", reason: "Empty file payload." };
  }
  if (bytes.byteLength > maxBytes) {
    return {
      valid: false,
      detectedType: "unknown",
      reason: `File exceeds maximum allowed size (${maxBytes} bytes).`,
    };
  }

  // Reject Windows PE ("MZ"), ELF (0x7F 'E' 'L' 'F'), Mach-O, and ZIP/JAR/EXE archives
  const b0 = bytes[0];
  const b1 = bytes[1];
  const b2 = bytes[2];
  const b3 = bytes[3];

  if (b0 === 0x4d && b1 === 0x5a) {
    return {
      valid: false,
      detectedType: "rejected_executable",
      reason: "Executable binary signature (PE/MZ) rejected.",
    };
  }
  if (b0 === 0x7f && b1 === 0x45 && b2 === 0x4c && b3 === 0x46) {
    return {
      valid: false,
      detectedType: "rejected_executable",
      reason: "Executable binary signature (ELF) rejected.",
    };
  }
  if (b0 === 0x50 && b1 === 0x4b && b2 === 0x03 && b3 === 0x04) {
    return {
      valid: false,
      detectedType: "rejected_executable",
      reason: "Archive signature (ZIP/JAR/DOCX) rejected for raw notice ingestion.",
    };
  }

  const mime = declaredMimeType.toLowerCase().split(";")[0].trim();

  // PDF signature: %PDF-
  const isPdfHeader =
    bytes.byteLength >= 5 &&
    b0 === 0x25 &&
    b1 === 0x50 &&
    b2 === 0x44 &&
    b3 === 0x46 &&
    bytes[4] === 0x2d;

  if (mime === "application/pdf") {
    if (!isPdfHeader) {
      return {
        valid: false,
        detectedType: "unknown",
        reason: "Declared application/pdf does not start with %PDF- signature.",
      };
    }
    return { valid: true, detectedType: "pdf" };
  }

  if (mime === "text/html" || mime === "application/xhtml+xml" || mime === "text/plain") {
    return { valid: true, detectedType: "html" };
  }

  return {
    valid: false,
    detectedType: "unknown",
    reason: `Disallowed MIME type: ${mime || "unspecified"}`,
  };
}

/**
 * SSRF defence: blocks loopback, private RFC1918, link-local metadata IPs, and non-HTTP schemes
 * (Blueprint Ch. 23).
 */
export function isSsrfBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (
    h === "localhost" ||
    h.endsWith(".localhost") ||
    h.endsWith(".internal") ||
    h.endsWith(".local") ||
    h === "::1" ||
    h === "0.0.0.0"
  ) {
    return true;
  }
  if (/^127\./.test(h)) return true;
  if (/^10\./.test(h)) return true;
  if (/^169\.254\./.test(h)) return true;
  if (/^192\.168\./.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(h)) return true;
  if (/^fc00:|^fd|^fe80:/i.test(h)) return true;
  return false;
}

export function computeSha256Hex(content: Uint8Array | string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

export interface FetchSourceOptions {
  source: SourceRegistryEntry;
  targetUrl?: string;
  previousEtag?: string | null;
  previousLastModified?: string | null;
  previousContentHash?: string | null;
  timeoutMs?: number;
  maxRetries?: number;
  baseBackoffMs?: number;
  fetchImpl?: typeof fetch;
}

export interface FetchSourceResult {
  ok: boolean;
  status: "ok" | "not_modified" | "permanent_error" | "transient_error" | "blocked_policy";
  httpStatus: number | null;
  finalUrl: string;
  etag: string | null;
  lastModified: string | null;
  contentHash: string | null;
  changeDetected: boolean;
  mimeType: string | null;
  bodyBytes: Uint8Array | null;
  attempts: number;
  responseTimeMs: number;
  errorCode?: string;
  errorMessage?: string;
}

/**
 * Isolated source fetcher with allowlisted domain verification, SSRF guard,
 * conditional caching (ETag/Last-Modified), SHA-256 hashing, binary signature check,
 * and bounded retries on transient errors only (Blueprint Ch. 08, 10, 19, 23, 24).
 */
export async function fetchAllowlistedSource(
  options: FetchSourceOptions
): Promise<FetchSourceResult> {
  const urlToFetch = options.targetUrl ?? options.source.recruitmentUrl;
  const startedAt = Date.now();
  const allowedDomains = [
    options.source.officialDomain,
    ...options.source.authorisedApplyDomains,
  ];

  if (!isSafeHttpUrl(urlToFetch)) {
    return {
      ok: false,
      status: "blocked_policy",
      httpStatus: null,
      finalUrl: urlToFetch,
      etag: null,
      lastModified: null,
      contentHash: null,
      changeDetected: false,
      mimeType: null,
      bodyBytes: null,
      attempts: 0,
      responseTimeMs: 0,
      errorCode: "UNSAFE_URL_SCHEME",
      errorMessage: "Only http(s) URLs are allowed.",
    };
  }

  const host = extractDestinationDomain(urlToFetch);
  if (!host || isSsrfBlockedHost(host)) {
    return {
      ok: false,
      status: "blocked_policy",
      httpStatus: null,
      finalUrl: urlToFetch,
      etag: null,
      lastModified: null,
      contentHash: null,
      changeDetected: false,
      mimeType: null,
      bodyBytes: null,
      attempts: 0,
      responseTimeMs: 0,
      errorCode: "SSRF_HOST_BLOCKED",
      errorMessage: "Target host is blocked by SSRF policy.",
    };
  }

  if (!domainMatchesAllowlist(host, allowedDomains)) {
    return {
      ok: false,
      status: "blocked_policy",
      httpStatus: null,
      finalUrl: urlToFetch,
      etag: null,
      lastModified: null,
      contentHash: null,
      changeDetected: false,
      mimeType: null,
      bodyBytes: null,
      attempts: 0,
      responseTimeMs: 0,
      errorCode: "DOMAIN_NOT_ALLOWLISTED",
      errorMessage: `Host '${host}' is not on the source allowlist.`,
    };
  }

  const fetchFn = options.fetchImpl ?? fetch;
  const maxRetries = options.maxRetries ?? 2;
  const timeoutMs = options.timeoutMs ?? 12_000;
  const baseBackoffMs = options.baseBackoffMs ?? 50;

  let attempts = 0;
  let lastErrorCode = "FETCH_FAILED";
  let lastErrorMessage = "Unknown fetch error.";
  let lastHttpStatus: number | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    attempts = attempt + 1;
    const headers: Record<string, string> = {
      "User-Agent": SARKARIPULSE_USER_AGENT,
      Accept: "text/html,application/pdf,application/xhtml+xml;q=0.9",
    };
    if (options.previousEtag) {
      headers["If-None-Match"] = options.previousEtag;
    }
    if (options.previousLastModified) {
      headers["If-Modified-Since"] = options.previousLastModified;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetchFn(urlToFetch, {
        method: "GET",
        headers,
        redirect: "follow",
        signal: controller.signal,
      });
      clearTimeout(timer);
      lastHttpStatus = response.status;

      // Validate redirect destination remained on allowlisted official domain (open-redirect/SSRF guard)
      const finalUrl = response.url || urlToFetch;
      const finalHost = extractDestinationDomain(finalUrl);
      if (
        !finalHost ||
        isSsrfBlockedHost(finalHost) ||
        !domainMatchesAllowlist(finalHost, allowedDomains)
      ) {
        return {
          ok: false,
          status: "blocked_policy",
          httpStatus: response.status,
          finalUrl,
          etag: null,
          lastModified: null,
          contentHash: null,
          changeDetected: false,
          mimeType: null,
          bodyBytes: null,
          attempts,
          responseTimeMs: Date.now() - startedAt,
          errorCode: "REDIRECT_TO_UNAPPROVED_DOMAIN",
          errorMessage: `Redirect destination '${finalHost ?? "invalid"}' is not allowlisted.`,
        };
      }

      if (response.status === 304) {
        return {
          ok: true,
          status: "not_modified",
          httpStatus: 304,
          finalUrl,
          etag: response.headers.get("etag") ?? options.previousEtag ?? null,
          lastModified:
            response.headers.get("last-modified") ??
            options.previousLastModified ??
            null,
          contentHash: options.previousContentHash ?? null,
          changeDetected: false,
          mimeType: response.headers.get("content-type"),
          bodyBytes: null,
          attempts,
          responseTimeMs: Date.now() - startedAt,
        };
      }

      // Permanent HTTP errors: NEVER retry endlessly (Blueprint Ch. 19)
      if (PERMANENT_HTTP_STATUSES.has(response.status)) {
        return {
          ok: false,
          status: "permanent_error",
          httpStatus: response.status,
          finalUrl,
          etag: null,
          lastModified: null,
          contentHash: null,
          changeDetected: false,
          mimeType: response.headers.get("content-type"),
          bodyBytes: null,
          attempts,
          responseTimeMs: Date.now() - startedAt,
          errorCode: `HTTP_${response.status}`,
          errorMessage: `Permanent HTTP status ${response.status} from source.`,
        };
      }

      if (!response.ok) {
        lastErrorCode = `HTTP_${response.status}`;
        lastErrorMessage = `Transient HTTP ${response.status} from source.`;
      } else {
        const arrayBuf = await response.arrayBuffer();
        const bytes = new Uint8Array(arrayBuf);
        const mimeType = response.headers.get("content-type") ?? "";
        const sig = validateFileSignature(bytes, mimeType);

        if (!sig.valid) {
          return {
            ok: false,
            status: "blocked_policy",
            httpStatus: response.status,
            finalUrl,
            etag: null,
            lastModified: null,
            contentHash: null,
            changeDetected: false,
            mimeType,
            bodyBytes: null,
            attempts,
            responseTimeMs: Date.now() - startedAt,
            errorCode: "INVALID_FILE_SIGNATURE",
            errorMessage: sig.reason ?? "Rejected file signature.",
          };
        }

        const hash = computeSha256Hex(bytes);
        const changeDetected = options.previousContentHash
          ? hash !== options.previousContentHash
          : true;

        return {
          ok: true,
          status: "ok",
          httpStatus: response.status,
          finalUrl,
          etag: response.headers.get("etag"),
          lastModified: response.headers.get("last-modified"),
          contentHash: hash,
          changeDetected,
          mimeType,
          bodyBytes: bytes,
          attempts,
          responseTimeMs: Date.now() - startedAt,
        };
      }
    } catch (err) {
      clearTimeout(timer);
      lastErrorCode =
        err instanceof Error && err.name === "AbortError"
          ? "TIMEOUT"
          : "NETWORK_ERROR";
      lastErrorMessage =
        err instanceof Error ? err.message : "Network request failed.";
    }

    if (attempt < maxRetries) {
      const backoff = baseBackoffMs * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, backoff));
    }
  }

  return {
    ok: false,
    status: "transient_error",
    httpStatus: lastHttpStatus,
    finalUrl: urlToFetch,
    etag: null,
    lastModified: null,
    contentHash: null,
    changeDetected: false,
    mimeType: null,
    bodyBytes: null,
    attempts,
    responseTimeMs: Date.now() - startedAt,
    errorCode: lastErrorCode,
    errorMessage: lastErrorMessage,
  };
}
