/**
 * Cache with Redis when available, otherwise an in-process memory fallback.
 * Keeps local/dev fast even when REDIS_URL is unset.
 */
import Redis from "ioredis";

let client: Redis | null | undefined;
let connectPromise: Promise<Redis | null> | null = null;
const memory = new Map<string, { exp: number; value: string }>();

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
        connectTimeout: 2500,
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

/** Single shared connect. Avoids reconnect storms on every cacheGet. */
export async function ensureRedis(): Promise<Redis | null> {
  const redis = getRedis();
  if (!redis) return null;
  if (redis.status === "ready") return redis;
  if (!connectPromise) {
    connectPromise = redis
      .connect()
      .then(() => redis)
      .catch(() => null)
      .finally(() => {
        connectPromise = null;
      });
  }
  return connectPromise;
}

function memoryGet<T>(key: string): T | null {
  const hit = memory.get(key);
  if (!hit) return null;
  if (hit.exp <= Date.now()) {
    memory.delete(key);
    return null;
  }
  try {
    return JSON.parse(hit.value) as T;
  } catch {
    memory.delete(key);
    return null;
  }
}

function memorySet(key: string, value: unknown, ttlSeconds: number) {
  memory.set(key, {
    exp: Date.now() + Math.max(1, ttlSeconds) * 1000,
    value: JSON.stringify(value),
  });
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = await ensureRedis();
  if (redis) {
    try {
      const raw = await redis.get(key);
      if (raw) return JSON.parse(raw) as T;
    } catch {
      /* fall through to memory */
    }
  }
  return memoryGet<T>(key);
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = 60): Promise<void> {
  memorySet(key, value, ttlSeconds);
  const redis = await ensureRedis();
  if (!redis) return;
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    /* ignore cache write failures */
  }
}

export async function cacheDel(key: string): Promise<void> {
  memory.delete(key);
  const redis = await ensureRedis();
  if (!redis) return;
  try {
    await redis.del(key);
  } catch {
    /* ignore */
  }
}

export const CacheKeys = {
  homeCatalog: "huza:home:catalog:v2",
  bestSellers: "huza:home:bestsellers",
  productsList: (key: string) => `huza:products:${key}`,
  searchSuggest: (q: string) => `huza:search:suggest:${q}`,
  faq: "huza:faq:published",
  faqList: "huza:faq:list",
  cart: (userId: string) => `huza:cart:${userId}`,
  session: (sid: string) => `huza:session:${sid}`,
  adminLiveLite: (userId: string) => `huza:admin:live:lite:${userId}`,
} as const;
