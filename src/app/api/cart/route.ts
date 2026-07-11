import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { clearCachedCart, getCachedCart, setCachedCart } from "@/jobs/queue";

/**
 * Redis-backed cart sync for logged-in customers.
 * Guest carts stay in local Zustand; this mirrors server-side when Redis is on.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ items: null, source: "guest" });
  }
  const items = await getCachedCart(session.user.id);
  return NextResponse.json({
    items: items ?? null,
    source: items ? "redis" : "empty",
    redis: Boolean(process.env.REDIS_URL),
  });
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Login required to sync cart" }, { status: 401 });
  }
  const body = await req.json();
  const items = Array.isArray(body.items) ? body.items : [];
  await setCachedCart(session.user.id, items);
  return NextResponse.json({ ok: true, count: items.length });
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await clearCachedCart(session.user.id);
  return NextResponse.json({ ok: true });
}
