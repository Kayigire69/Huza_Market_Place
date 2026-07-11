import { prisma } from "@/lib/prisma";
import type { JobStatus, Prisma } from "@prisma/client";

export type JobType =
  | "PAYMENT_VERIFY"
  | "SEND_EMAIL"
  | "SEND_SMS"
  | "GENERATE_REPORT"
  | "UPDATE_ANALYTICS"
  | "PAYMENT_INITIATE";

export const jobRepository = {
  async create(input: {
    type: JobType;
    payload: Prisma.InputJsonValue;
    runAfter?: Date;
    maxAttempts?: number;
  }) {
    return prisma.backgroundJob.create({
      data: {
        type: input.type,
        payload: input.payload,
        runAfter: input.runAfter,
        maxAttempts: input.maxAttempts ?? 5,
      },
    });
  },

  async claimNext(limit = 5) {
    const now = new Date();
    const pending = await prisma.backgroundJob.findMany({
      where: {
        status: "PENDING",
        runAfter: { lte: now },
      },
      orderBy: { createdAt: "asc" },
      take: limit,
    });

    const claimed = [];
    for (const job of pending) {
      const updated = await prisma.backgroundJob.updateMany({
        where: { id: job.id, status: "PENDING" },
        data: { status: "PROCESSING", attempts: { increment: 1 } },
      });
      if (updated.count === 1) {
        claimed.push(await prisma.backgroundJob.findUniqueOrThrow({ where: { id: job.id } }));
      }
    }
    return claimed;
  },

  async complete(id: string) {
    return prisma.backgroundJob.update({
      where: { id },
      data: { status: "COMPLETED" as JobStatus, lastError: null },
    });
  },

  async fail(id: string, error: string, retryDelayMs = 15_000) {
    const job = await prisma.backgroundJob.findUnique({ where: { id } });
    if (!job) return null;
    if (job.attempts >= job.maxAttempts) {
      return prisma.backgroundJob.update({
        where: { id },
        data: { status: "FAILED", lastError: error },
      });
    }
    return prisma.backgroundJob.update({
      where: { id },
      data: {
        status: "PENDING",
        lastError: error,
        runAfter: new Date(Date.now() + retryDelayMs * job.attempts),
      },
    });
  },
};
