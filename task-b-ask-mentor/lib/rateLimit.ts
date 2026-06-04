// In-memory rate limit (фиксиран прозорец), 10 заявки/мин/IP.
// За production с няколко инстанции: споделено хранилище (Redis/Upstash).

type Entry = { count: number; resetAt: number };

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;

const store = new Map<string, Entry>();

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
};

export const checkRateLimit = (ip: string): RateLimitResult => {
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now >= entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_REQUESTS - 1, retryAfterSec: 0 };
  }

  if (entry.count >= MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  entry.count += 1;
  return { allowed: true, remaining: MAX_REQUESTS - entry.count, retryAfterSec: 0 };
};
