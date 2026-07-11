import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { orderService } from "@/services/order.service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const session = await getServerSession(authOptions);
    const result = await orderService.createOrder(body, session?.user?.id);
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    if (err instanceof z.ZodError) {
      const message = err.issues.map((i) => i.message).join(". ");
      return NextResponse.json({ error: message }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "Failed to place order";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
