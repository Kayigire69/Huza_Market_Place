import { NextResponse } from "next/server";
import { timingSafeEqualString } from "@/lib/security-access";
import { processDueJobs } from "@/jobs/processors";

/**
 * Internal/cron endpoint to drain the background job queue.
 * Requires JOBS_SECRET via Authorization: Bearer <secret> only (never query string).
 */
function authorize(req: Request): boolean {
  const secret = process.env.JOBS_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") || "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) return false;
  return timingSafeEqualString(match[1].trim(), secret);
}

export async function POST(req: Request) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const limit = Math.min(Number((body as { limit?: number }).limit) || 10, 50);
  const result = await processDueJobs(limit);
  return NextResponse.json(result);
}

export async function GET(req: Request) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const limit = Math.min(Number(new URL(req.url).searchParams.get("limit")) || 10, 50);
  const result = await processDueJobs(limit);
  return NextResponse.json(result);
}
