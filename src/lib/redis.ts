/**
 * Redis client with graceful fallback.
 * When REDIS_URL is unset, all ops no-op / return null so local/dev still works.
 */
import Redis from "ioredis";

let client: Redis | null | undefined;

export function isRedisEnabled(): boolean {
  return Boolean(process.env.REDIS_URL);
}

export function getRedis(): Redis | null {
  if (!process.env.REDIS_URL) return null;
  if (client === undefined) {
    try {
      client = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 2,
        lazyConnect: true,
        enableOfflineQueue: false,
      });
      client.on("error", (err) => {
        console.warn("[redis]", err.message);
      });
    } catch (err) {
      console.warn("[redis] init failed", err);
      client = null;
    }
  }
  return client;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  if (!redis) return null;
  try {
    if (redis.status !== "ready") await redis.connect().catch(() => null);
    const raw = await redis.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = 60): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    if (redis.status !== "ready") await redis.connect().catch(() => null);
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    /* ignore cache write failures */
  }
}

export async function cacheDel(key: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    if (redis.status !== "ready") await redis.connect().catch(() => null);
    await redis.del(key);
  } catch {
    /* ignore */
  }
}

export const CacheKeys = {
  homeCatalog: "huza:home:catalog",
  bestSellers: "huza:home:bestsellers",
  cart: (userId: string) => `huza:cart:${userId}`,
  session: (sid: string) => `huza:session:${sid}`,
} as const;
