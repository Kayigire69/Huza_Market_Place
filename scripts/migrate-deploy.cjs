#!/usr/bin/env node
/**
 * Run `prisma migrate deploy` against a Neon *direct* host when possible.
 *
 * Neon pooler (-pooler) uses PgBouncer transaction mode, which cannot hold
 * session advisory locks → Prisma P1002 on migrate.
 *
 * Preference order:
 * 1. DIRECT_URL (explicit non-pooler URL)
 * 2. DATABASE_URL with "-pooler" stripped from the hostname
 * 3. DATABASE_URL as-is (local Postgres)
 */
const { spawnSync } = require("child_process");

function resolveMigrateUrl() {
  const direct = process.env.DIRECT_URL?.trim();
  if (direct) return direct;

  const pooled = process.env.DATABASE_URL?.trim();
  if (!pooled) {
    console.error("[migrate] DATABASE_URL is not set");
    process.exit(1);
  }

  try {
    const url = new URL(pooled);
    if (url.hostname.includes("-pooler")) {
      url.hostname = url.hostname.replace("-pooler", "");
      url.searchParams.delete("pgbouncer");
      console.log(
        `[migrate] Using direct Neon host (stripped -pooler): ${url.hostname}`
      );
      return url.toString();
    }
  } catch {
    // Fall through and use raw DATABASE_URL
  }

  return pooled;
}

const migrateUrl = resolveMigrateUrl();
const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: migrateUrl },
  shell: true,
});

process.exit(result.status ?? 1);
