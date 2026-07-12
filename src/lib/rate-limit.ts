/**
 * Simple sliding-window rate limiter.
 * Uses Redis when REDIS_URL is set; otherwise in-memory Map (per process).
 */
import { ensureRedis } from "@/lib/redis";

type Bucket = { count: number; resetAt: number };
const memory = new Map<string, Bucket>();

export async function rateLimit(opts: {
  key: string;
  limit: number;
  windowMs: number;
}): Promise<{ ok: boolean; remaining: number; retryAfterMs: number }> {
  const { key, limit, windowMs } = opts;
  const now = Date.now();
  const redis = await ensureRedis();

  if (redis) {
    try {
      const redisKey = `rl:${key}`;
      const count = await redis.incr(redisKey);
      if (count === 1) await redis.pexpire(redisKey, windowMs);
      const ttl = await redis.pttl(redisKey);
      return {
        ok: count <= limit,
        remaining: Math.max(0, limit - count),
        retryAfterMs: ttl > 0 ? ttl : windowMs,
      };
    } catch {
      /* fall through to memory */
    }
  }

  const bucket = memory.get(key);
  if (!bucket || bucket.resetAt <= now) {
    memory.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterMs: windowMs };
  }
  bucket.count += 1;
  memory.set(key, bucket);
  return {
    ok: bucket.count <= limit,
    remaining: Math.max(0, limit - bucket.count),
    retryAfterMs: Math.max(0, bucket.resetAt - now),
  };
}

export function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}
