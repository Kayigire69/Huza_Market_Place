#!/usr/bin/env node
/**
 * Production build: migrate on a non-pooler URL (Neon advisory locks), then next build.
 * Optional DIRECT_URL wins; otherwise derived from DATABASE_URL by stripping "-pooler".
 */
const { spawnSync } = require("child_process");
const { deriveDirectUrl } = require("./ensure-direct-url.cjs");

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  console.error("[build] DATABASE_URL is required");
  process.exit(1);
}

const migrateUrl = process.env.DIRECT_URL?.trim() || deriveDirectUrl(databaseUrl);
if (migrateUrl !== databaseUrl) {
  console.log("[build] prisma migrate deploy using non-pooler URL");
}

function run(cmd, args, env = process.env) {
  const result = spawnSync(cmd, args, { stdio: "inherit", env, shell: true });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run("prisma", ["generate"]);
run("prisma", ["migrate", "deploy"], {
  ...process.env,
  DATABASE_URL: migrateUrl,
});
run("next", ["build"]);
