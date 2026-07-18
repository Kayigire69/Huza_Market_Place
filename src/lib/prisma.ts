import { PrismaClient } from "@prisma/client";
import { resolveDatabaseUrl } from "@/lib/db-url";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaConnecting: Promise<void> | undefined;
};

function createPrismaClient() {
  return new PrismaClient({
    datasources: {
      db: { url: resolveDatabaseUrl(process.env.DATABASE_URL) },
    },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

/**
 * Single shared client (survives Next.js hot reload).
 * Retries $connect a few times so brief Postgres startup / Neon wake gaps
 * do not surface as intermittent "Can't reach database server" errors.
 */
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

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

if (!globalForPrisma.prismaConnecting) {
  globalForPrisma.prismaConnecting = connectWithRetry(prisma).catch((err) => {
    console.error("[prisma] database connect failed after retries:", err);
  });
}

// Reuse one client across hot reloads and warm serverless isolates.
globalForPrisma.prisma = prisma;
