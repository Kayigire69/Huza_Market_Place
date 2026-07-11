import { cacheDel, cacheGet, cacheSet, getRedis, CacheKeys } from "@/lib/redis";
import { jobRepository, type JobType } from "@/repositories/job.repository";
import type { Prisma } from "@prisma/client";

const REDIS_QUEUE = "huza:jobs";

export async function enqueueJob(
  type: JobType,
  payload: Prisma.InputJsonValue,
  opts?: { runAfter?: Date; maxAttempts?: number }
) {
  const job = await jobRepository.create({
    type,
    payload,
    runAfter: opts?.runAfter,
    maxAttempts: opts?.maxAttempts,
  });

  const redis = getRedis();
  if (redis) {
    try {
      if (redis.status !== "ready") await redis.connect().catch(() => null);
      await redis.lpush(REDIS_QUEUE, job.id);
    } catch {
      /* DB job row is enough */
    }
  }

  return job;
}

export async function enqueueEmail(to: string, subject: string, body: string) {
  return enqueueJob("SEND_EMAIL", { to, subject, body });
}

export async function enqueueSms(to: string, body: string) {
  return enqueueJob("SEND_SMS", { to, body });
}

export async function enqueueAnalytics(event: string, data: Record<string, unknown>) {
  return enqueueJob("UPDATE_ANALYTICS", { event, data } as Prisma.InputJsonValue);
}

export async function enqueueReport(reportType: string, params: Record<string, unknown>) {
  return enqueueJob("GENERATE_REPORT", { reportType, params } as Prisma.InputJsonValue);
}

/** Soft session cache helper (Redis when available) */
export async function getCachedSession<T>(sessionId: string) {
  return cacheGet<T>(CacheKeys.session(sessionId));
}

export async function setCachedSession(sessionId: string, value: unknown, ttl = 3600) {
  return cacheSet(CacheKeys.session(sessionId), value, ttl);
}

export async function getCachedCart<T>(userId: string) {
  return cacheGet<T>(CacheKeys.cart(userId));
}

export async function setCachedCart(userId: string, value: unknown, ttl = 60 * 60 * 24 * 7) {
  return cacheSet(CacheKeys.cart(userId), value, ttl);
}

export async function clearCachedCart(userId: string) {
  return cacheDel(CacheKeys.cart(userId));
}
