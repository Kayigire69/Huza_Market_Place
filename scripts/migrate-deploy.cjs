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
const path = require("path");

// Load local .env when run from a developer machine (DO App Platform already injects env).
try {
  require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
} catch {
  // dotenv optional at runtime on App Platform if not resolved; env vars still work.
}

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

const MAX_ATTEMPTS = 4;
const RETRY_MS = 12_000;

function sleep(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    /* block until retry window elapses */
  }
}

let lastStatus = 1;
for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
  if (attempt > 1) {
    console.log(`[migrate] Retry ${attempt}/${MAX_ATTEMPTS} in ${RETRY_MS / 1000}s…`);
    sleep(RETRY_MS);
  } else {
    console.log(`[migrate] Attempt ${attempt}/${MAX_ATTEMPTS}`);
  }

  const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: migrateUrl },
    shell: true,
  });

  lastStatus = result.status ?? 1;
  if (lastStatus === 0) {
    process.exit(0);
  }
}

console.error(
  "[migrate] Failed after retries. If logs show P1002 (advisory lock), restart the app or set DIRECT_URL on App Platform."
);
process.exit(lastStatus);
