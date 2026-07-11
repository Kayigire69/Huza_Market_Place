import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { orderService } from "@/services/order.service";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { logError } from "@/lib/error-log";

export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    const rl = await rateLimit({ key: `orders:${ip}`, limit: 20, windowMs: 60_000 });
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Too many orders. Please wait a moment and try again." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const session = await getServerSession(authOptions);
    const result = await orderService.createOrder(body, session?.user?.id);
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    await logError({
      source: "api.orders",
      message: err instanceof Error ? err.message : "Failed to place order",
      stack: err instanceof Error ? err.stack : null,
      path: "/api/orders",
    });
    if (err instanceof z.ZodError) {
      const message = err.issues.map((i) => i.message).join(". ");
      return NextResponse.json({ error: message }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "Failed to place order";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
