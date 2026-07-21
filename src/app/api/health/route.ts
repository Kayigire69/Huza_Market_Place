import { NextResponse } from "next/server";
import { prisma, withPrismaRetry } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Liveness probe for App Platform. Default: process is up (no DB required).
 * Optional `?db=1` reports DB status without failing the HTTP check.
 */
export async function GET(req: Request) {
  const checkDb = new URL(req.url).searchParams.get("db") === "1";

  if (!checkDb) {
    return NextResponse.json({ status: "ok" }, { status: 200 });
  }

  try {
    await withPrismaRetry((client) => client.$queryRaw`SELECT 1`);
    return NextResponse.json({ status: "ok", db: "connected" }, { status: 200 });
  } catch {
    return NextResponse.json({ status: "degraded", db: "unavailable" }, { status: 200 });
  }
}
