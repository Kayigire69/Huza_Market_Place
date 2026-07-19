/**
 * Prisma migrations need a non-pooler Postgres URL (advisory locks).
 * If DIRECT_URL is unset, derive it from DATABASE_URL by stripping Neon "-pooler".
 */
function deriveDirectUrl(databaseUrl) {
  try {
    const u = new URL(databaseUrl);
    u.hostname = u.hostname.replace("-pooler.", ".");
    u.searchParams.delete("pgbouncer");
    if (u.searchParams.get("channel_binding") === "require") {
      u.searchParams.delete("channel_binding");
    }
    return u.toString();
  } catch {
    return databaseUrl.replace("-pooler.", ".");
  }
}

function ensureDirectUrl() {
  if (process.env.DIRECT_URL?.trim()) return;
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.error("[ensure-direct-url] DATABASE_URL is required");
    process.exit(1);
  }
  process.env.DIRECT_URL = deriveDirectUrl(databaseUrl);
  console.log(
    "[ensure-direct-url] DIRECT_URL was missing — derived non-pooler URL from DATABASE_URL"
  );
}

module.exports = { deriveDirectUrl, ensureDirectUrl };
