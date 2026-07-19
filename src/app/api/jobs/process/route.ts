import { NextResponse } from "next/server";
import { timingSafeEqualString } from "@/lib/security-access";
import { processDueJobs } from "@/jobs/processors";
import { scanAndNotifyStockLevels } from "@/lib/stock-alerts";

/**
 * Internal/cron endpoint to drain the background job queue.
 * Also runs a throttled stock-level scan (alerts ≥1h apart, with % remaining).
 * Requires JOBS_SECRET via Authorization: Bearer <secret> only (never query string).
 * Schedule at least hourly so empty/low stock always reaches admins.
 */
function authorize(req: Request): boolean {
  const secret = process.env.JOBS_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") || "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) return false;
  return timingSafeEqualString(match[1].trim(), secret);
}

async function runJobsAndStockScan(limit: number) {
  const [jobs, stockAlerts] = await Promise.all([
    processDueJobs(limit),
    scanAndNotifyStockLevels(80),
  ]);
  return { ...jobs, stockAlerts };
}

export async function POST(req: Request) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const limit = Math.min(Number((body as { limit?: number }).limit) || 10, 50);
  const result = await runJobsAndStockScan(limit);
  return NextResponse.json(result);
}

export async function GET(req: Request) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const limit = Math.min(Number(new URL(req.url).searchParams.get("limit")) || 10, 50);
  const result = await runJobsAndStockScan(limit);
  return NextResponse.json(result);
}
