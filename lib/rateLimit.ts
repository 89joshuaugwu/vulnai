// Simple in-memory rate limiter for API routes
// In production, use Redis for distributed rate limiting

const rateMap = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  identifier: string,
  maxRequests: number = 20,
  windowMs: number = 60 * 1000 // 1 minute
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const now = Date.now();
  const record = rateMap.get(identifier);

  // Clean up expired entries periodically
  if (rateMap.size > 10000) {
    for (const [key, val] of rateMap) {
      if (val.resetAt < now) rateMap.delete(key);
    }
  }

  if (!record || record.resetAt < now) {
    rateMap.set(identifier, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, retryAfterMs: 0 };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, retryAfterMs: record.resetAt - now };
  }

  record.count++;
  return { allowed: true, remaining: maxRequests - record.count, retryAfterMs: 0 };
}

export function getClientIP(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}
