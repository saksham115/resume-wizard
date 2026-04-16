/**
 * In-memory sliding-window rate limit. Keyed by IP (best-effort from
 * x-forwarded-for / x-real-ip; falls back to "unknown").
 *
 * Scope: single Node process. On Vercel serverless this resets per warm
 * container, which is fine for MVP — the goal is defensive protection
 * against a single bad actor, not accurate billing. For production scale,
 * swap for Upstash/Redis. See plan M9.
 */

type WindowState = { count: number; windowStart: number };

const WINDOW_MS = 60_000;
const buckets = new Map<string, WindowState>();

// Periodic cleanup to prevent unbounded growth.
let lastSweep = Date.now();
function maybeSweep(now: number) {
  if (now - lastSweep < WINDOW_MS) return;
  for (const [k, v] of buckets) {
    if (now - v.windowStart >= WINDOW_MS) buckets.delete(k);
  }
  lastSweep = now;
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSec?: number;
};

export function checkRateLimit(
  key: string,
  limitPerMinute: number
): RateLimitResult {
  const now = Date.now();
  maybeSweep(now);

  const bucket = buckets.get(key);
  if (!bucket || now - bucket.windowStart >= WINDOW_MS) {
    buckets.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: limitPerMinute - 1 };
  }
  if (bucket.count >= limitPerMinute) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec: Math.ceil((bucket.windowStart + WINDOW_MS - now) / 1000),
    };
  }
  bucket.count += 1;
  return { allowed: true, remaining: limitPerMinute - bucket.count };
}

export function getClientKey(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

export function rateLimitResponse(r: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      error: "Too many requests — please slow down.",
      retryAfterSec: r.retryAfterSec,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(r.retryAfterSec ?? 60),
      },
    }
  );
}
