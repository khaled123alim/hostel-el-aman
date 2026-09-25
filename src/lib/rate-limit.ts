const store = new Map<string, number[]>();

/**
 * Minimal in-memory sliding-window rate limiter.
 * Good for single-instance deployments. For multi-instance setups swap the
 * backing store for Redis (preserve the same interface).
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<{ ok: boolean; retryAfter: number }> {
  const now = Date.now();
  const hits = (store.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    store.set(key, hits);
    return { ok: false, retryAfter: Math.ceil((windowMs - (now - hits[0])) / 1000) };
  }
  hits.push(now);
  store.set(key, hits);
  return { ok: true, retryAfter: 0 };
}

export function ipFromRequest(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "local";
}