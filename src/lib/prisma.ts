import { PrismaClient } from "@prisma/client";
import { resolveDatabaseUrl } from "@/lib/db-url";

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

function createPrismaClient() {
  const raw = process.env.DATABASE_URL?.trim();
  // Next.js imports this module while compiling pages. Allow build without a live DB.
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

if (
  !globalForPrisma.prismaConnecting &&
  process.env.DATABASE_URL?.trim() &&
  !isProductionBuild()
) {
  globalForPrisma.prismaConnecting = connectWithRetry(prisma).catch((err) => {
    console.error("[prisma] database connect failed after retries:", err);
  });
}

// Reuse one client across hot reloads and warm serverless isolates.
globalForPrisma.prisma = prisma;
