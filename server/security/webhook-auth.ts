import "server-only";
import crypto from "node:crypto";

export function computeHmacSha256Hex(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload, "utf8").digest("hex");
}

function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Verifies HMAC-SHA256 webhook signatures in constant time.
 * Fails closed when `WEBHOOK_SIGNING_SECRET` is missing.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string | undefined = process.env.WEBHOOK_SIGNING_SECRET
): boolean {
  const cleanSecret = secret?.trim();
  const cleanSig = signatureHeader?.trim().replace(/^sha256=/i, "");
  if (!cleanSecret || !cleanSig) {
    return false;
  }
  const expected = computeHmacSha256Hex(rawBody, cleanSecret);
  return timingSafeStringEqual(expected, cleanSig);
}

/**
 * Verifies Bearer `CRON_SECRET` in constant time for scheduled workers.
 * Fails closed when `CRON_SECRET` is missing.
 */
export function verifyCronBearerToken(
  authorizationHeader: string | null,
  secret: string | undefined = process.env.CRON_SECRET
): boolean {
  const cleanSecret = secret?.trim();
  if (!cleanSecret || !authorizationHeader) {
    return false;
  }
  const match = /^Bearer\s+(.+)$/i.exec(authorizationHeader.trim());
  if (!match) return false;
  return timingSafeStringEqual(match[1].trim(), cleanSecret);
}
