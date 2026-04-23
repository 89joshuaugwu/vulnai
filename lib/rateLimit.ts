import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// Simple in-memory fallback for local dev
const rateMap = new Map<string, { count: number; resetAt: number }>();

function memoryRateLimit(identifier: string, maxRequests: number, windowMs: number) {
  const now = Date.now();
  const record = rateMap.get(identifier);

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

let redisCache: Redis | null = null;
let ratelimiterCache: Ratelimit | null = null;

export async function rateLimitAsync(
  identifier: string,
  maxRequests: number = 20,
  windowSeconds: number = 60
): Promise<{ allowed: boolean; remaining: number; retryAfterMs: number }> {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    if (!redisCache) {
      redisCache = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      ratelimiterCache = new Ratelimit({
        redis: redisCache,
        limiter: Ratelimit.slidingWindow(maxRequests, `${windowSeconds} s`),
        analytics: true,
      });
    }
    const { success, remaining, reset } = await ratelimiterCache!.limit(identifier);
    return { allowed: success, remaining, retryAfterMs: reset - Date.now() };
  }

  // Fallback to memory
  return memoryRateLimit(identifier, maxRequests, windowSeconds * 1000);
}

// Keeping the synchronous version for backward compatibility
export function rateLimit(
  identifier: string,
  maxRequests: number = 20,
  windowMs: number = 60 * 1000
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  return memoryRateLimit(identifier, maxRequests, windowMs);
}

export function getClientIP(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}
