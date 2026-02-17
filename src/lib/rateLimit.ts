/**
 * In-memory rate limiter: 60 requests per minute per user.
 * For production with multiple instances, consider Redis (e.g. @upstash/ratelimit).
 */
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 60;

const store = new Map<
  string,
  { count: number; windowStart: number }
>();

export function checkRateLimit(userId: string): { allowed: boolean } {
  const now = Date.now();
  const entry = store.get(userId);

  if (!entry) {
    store.set(userId, { count: 1, windowStart: now });
    return { allowed: true };
  }

  if (now - entry.windowStart > WINDOW_MS) {
    entry.count = 1;
    entry.windowStart = now;
    return { allowed: true };
  }

  entry.count++;
  if (entry.count > MAX_REQUESTS) {
    return { allowed: false };
  }
  return { allowed: true };
}
