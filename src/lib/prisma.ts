import { PrismaClient } from "@prisma/client";
import { resolveDatabaseUrl } from "@/lib/db-url";
import { isStaleConnectionError, reconnectPrisma } from "@/lib/prisma-connection";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaConnecting: Promise<void> | undefined;
};

function isProductionBuild(): boolean {
  return (
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.npm_lifecycle_event === "build"
  );
}

function createBasePrismaClient() {
  const raw = process.env.DATABASE_URL?.trim();
  const url = raw
    ? resolveDatabaseUrl(raw)
    : "postgresql://build:build@127.0.0.1:5432/build?schema=public";

  return new PrismaClient({
    datasources: {
      db: { url },
    },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

function buildPrismaClient(): PrismaClient {
  const base = createBasePrismaClient();

  const extended = base.$extends({
    query: {
      async $allOperations({ args, query }) {
        const run = () => query(args);
        try {
          return await run();
        } catch (error) {
          if (!isStaleConnectionError(error)) throw error;
          await reconnectPrisma(base);
          return await run();
        }
      },
    },
  });

  // Keep PrismaClient typing for transactions and existing services.
  return extended as unknown as PrismaClient;
}

async function connectWithRetry(client: PrismaClient) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      await client.$connect();
      return;
    } catch (err) {
      lastError = err;
      await new Promise((r) => setTimeout(r, attempt * 1000));
    }
  }
  throw lastError;
}

/**
 * Single shared client (survives Next.js hot reload).
 * Retries once after Neon pooler idle disconnects ("connection closed").
 */
export const prisma = globalForPrisma.prisma ?? buildPrismaClient();

if (
  !globalForPrisma.prismaConnecting &&
  process.env.DATABASE_URL?.trim() &&
  !isProductionBuild()
) {
  globalForPrisma.prismaConnecting = connectWithRetry(prisma).catch((err) => {
    console.error("[prisma] database connect failed after retries:", err);
  });
}

globalForPrisma.prisma = prisma;

/** Explicit retry helper for raw queries outside the extension path. */
export async function withPrismaRetry<T>(fn: (client: PrismaClient) => Promise<T>): Promise<T> {
  try {
    return await fn(prisma);
  } catch (error) {
    if (!isStaleConnectionError(error)) throw error;
    await reconnectPrisma(prisma);
    return await fn(prisma);
  }
}
