import "server-only";

interface RateBucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateBucket>();

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Simple server-side fixed-window rate limiter for public & auth-sensitive APIs
 * (Blueprint Ch. 07 & Ch. 32). Production edge deployments may pair this with
 * Cloudflare WAF / distributed Redis rate limiting.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  nowMs: number = Date.now()
): RateLimitResult {
  const existing = buckets.get(key);
  if (!existing || nowMs >= existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: nowMs + windowMs });
    return {
      allowed: true,
      limit,
      remaining: Math.max(0, limit - 1),
      retryAfterSeconds: 0,
    };
  }

  if (existing.count >= limit) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((existing.resetAt - nowMs) / 1000)
    );
    return {
      allowed: false,
      limit,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    limit,
    remaining: Math.max(0, limit - existing.count),
    retryAfterSeconds: 0,
  };
}

export function resetRateLimitStore(): void {
  buckets.clear();
}

export function getClientRateKey(request: Request, routeScope: string): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "local";
  return `${routeScope}:${ip}`;
}
