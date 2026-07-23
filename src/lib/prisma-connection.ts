import type { PrismaClient } from "@prisma/client";

const globalForReconnect = globalThis as unknown as {
  prismaReconnect: Promise<void> | undefined;
};

/** Neon pooler / idle timeouts often surface as closed connections. */
export function isStaleConnectionError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const code =
    "code" in error && typeof error.code === "string" ? error.code : undefined;
  if (code && ["P1001", "P1002", "P1017", "P2024"].includes(code)) {
    return true;
  }

  const message =
    error instanceof Error
      ? error.message
      : "message" in error && typeof error.message === "string"
        ? error.message
        : String(error);

  return /closed|connection.*terminated|can't reach database|server has closed|kind:\s*Closed/i.test(
    message
  );
}

/**
 * Single-flight reconnect so concurrent requests after an idle disconnect
 * do not all race $disconnect/$connect on the shared client.
 */
export async function reconnectPrisma(client: PrismaClient): Promise<void> {
  if (globalForReconnect.prismaReconnect) {
    return globalForReconnect.prismaReconnect;
  }

  globalForReconnect.prismaReconnect = (async () => {
    try {
      try {
        await client.$disconnect();
      } catch {
        // Ignore disconnect errors on an already-dead socket.
      }

      let lastError: unknown;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          await client.$connect();
          return;
        } catch (err) {
          lastError = err;
          await new Promise((r) => setTimeout(r, attempt * 500));
        }
      }

      throw lastError;
    } finally {
      globalForReconnect.prismaReconnect = undefined;
    }
  })();

  return globalForReconnect.prismaReconnect;
}
