#!/usr/bin/env node
/**
 * Production build for App Platform.
 *
 * Neon pooler URLs break Prisma advisory locks (P1002).
 * Neon *direct* hosts are often unreachable from DO build containers (P1001).
 * Schema migrations are applied out-of-band: `npm run db:deploy` against Neon
 * (from a machine that can reach the DB), not during `next build`.
 */
const { spawnSync } = require("child_process");

function run(cmd, args) {
  const result = spawnSync(cmd, args, {
    stdio: "inherit",
    env: process.env,
    shell: true,
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (!process.env.DATABASE_URL?.trim()) {
  console.error("[build] DATABASE_URL is required");
  process.exit(1);
}

run("prisma", ["generate"]);
run("next", ["build"]);
