import { NextResponse } from "next/server";
import { processDueJobs } from "@/jobs/processors";

/**
 * Internal/cron endpoint to drain the background job queue.
 * Protect with JOBS_SECRET in production:
 *   Authorization: Bearer <JOBS_SECRET>
 * or ?secret=<JOBS_SECRET>
 */
export async function POST(req: Request) {
  const secret = process.env.JOBS_SECRET;
  if (secret) {
    const header = req.headers.get("authorization") || "";
    const url = new URL(req.url);
    const ok =
      header === `Bearer ${secret}` || url.searchParams.get("secret") === secret;
    if (!ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const body = await req.json().catch(() => ({}));
  const limit = Math.min(Number((body as { limit?: number }).limit) || 10, 50);
  const result = await processDueJobs(limit);
  return NextResponse.json(result);
}

export async function GET(req: Request) {
  return POST(req);
}
