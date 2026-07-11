import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function logError(input: {
  source: string;
  message: string;
  stack?: string | null;
  path?: string | null;
  userId?: string | null;
  meta?: Prisma.InputJsonValue;
}) {
  console.error(`[${input.source}]`, input.message, input.stack || "");
  try {
    await prisma.errorLog.create({
      data: {
        source: input.source,
        message: input.message.slice(0, 2000),
        stack: input.stack?.slice(0, 8000) || null,
        path: input.path || null,
        userId: input.userId || null,
        meta: input.meta,
      },
    });
  } catch (err) {
    console.error("Failed to persist ErrorLog", err);
  }
}
