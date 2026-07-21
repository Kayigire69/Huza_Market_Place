/**
 * Normalize DATABASE_URL for reliable Prisma ↔ Postgres connectivity.
 * - Longer connect_timeout: local Postgres startup / Neon cold start
 * - pool_timeout + connection_limit: avoid pool wait timeouts under Next.js load
 * - pgbouncer=true on Neon -pooler hosts
 * - Drop channel_binding=require (breaks some Prisma/pg clients intermittently)
 */
export function resolveDatabaseUrl(raw: string | undefined): string {
  if (!raw?.trim()) {
    throw new Error("DATABASE_URL is not set");
  }

  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new Error("DATABASE_URL is not a valid URL");
  }

  if (url.searchParams.get("channel_binding") === "require") {
    url.searchParams.delete("channel_binding");
  }

  const host = url.hostname.toLowerCase();
  const isNeonPooler = host.includes("-pooler") || host.endsWith(".neon.tech");
  const looksLikePooler = host.includes("-pooler");

  if (looksLikePooler && !url.searchParams.has("pgbouncer")) {
    url.searchParams.set("pgbouncer", "true");
  }

  if (isNeonPooler && !url.searchParams.has("sslmode")) {
    url.searchParams.set("sslmode", "require");
  }

  if (!url.searchParams.has("connect_timeout")) {
    // Neon cold start and local Postgres service start often exceed the 5s default.
    url.searchParams.set("connect_timeout", "30");
  }

  if (!url.searchParams.has("pool_timeout")) {
    url.searchParams.set("pool_timeout", "30");
  }

  if (!url.searchParams.has("connection_limit")) {
    // Neon PgBouncer + Next.js: keep the pool small on App Platform.
    url.searchParams.set("connection_limit", looksLikePooler ? "5" : "15");
  }

  return url.toString();
}
