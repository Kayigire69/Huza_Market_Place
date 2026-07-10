import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const threadId = new URL(req.url).searchParams.get("threadId");
  if (!threadId) return NextResponse.json({ error: "threadId required" }, { status: 400 });

  const thread = await prisma.supportThread.findUnique({
    where: { id: threadId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!thread) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(thread);
}

export async function POST(req: Request) {
  const body = await req.json();

  if (body.action === "start") {
    const thread = await prisma.supportThread.create({
      data: {
        guestName: body.guestName || "Guest",
        guestPhone: body.guestPhone || null,
        messages: {
          create: [
            {
              sender: "CUSTOMER",
              body: body.body || "Hello",
            },
            {
              sender: "AGENT",
              body: "Muraho! Welcome to HUZA MARKETPLACE by Youth Huza. How can we help with your order or products today?",
            },
          ],
        },
      },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    return NextResponse.json({ threadId: thread.id, messages: thread.messages });
  }

  if (body.action === "message" && body.threadId) {
    await prisma.supportMessage.create({
      data: {
        threadId: body.threadId,
        sender: "CUSTOMER",
        body: body.body,
      },
    });

    // Simple auto-reply for common intents
    const lower = String(body.body || "").toLowerCase();
    let reply =
      "Thanks for your message. A Youth Huza agent will follow up shortly. You can also track orders at /track or call +250 788 000 000.";
    if (lower.includes("track") || lower.includes("order")) {
      reply =
        "To track an order, open Track Order and enter your order number (e.g. HUZA-…). Delivery updates appear there in real time.";
    } else if (lower.includes("pay") || lower.includes("momo") || lower.includes("airtel")) {
      reply =
        "After placing an order, approve the MoMo/Airtel prompt on your phone. Money goes directly to the seller’s number.";
    } else if (lower.includes("deliver")) {
      reply =
        "Youth Huza delivers directly (no middlemen): Kigali 2,000 RWF · Kamonyi/Ruyenzi 3,000 · Bugesera/Nyamata 3,000.";
    }

    await prisma.supportMessage.create({
      data: { threadId: body.threadId, sender: "AGENT", body: reply },
    });
    await prisma.supportThread.update({
      where: { id: body.threadId },
      data: { updatedAt: new Date() },
    });

    const thread = await prisma.supportThread.findUnique({
      where: { id: body.threadId },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    return NextResponse.json({ threadId: body.threadId, messages: thread?.messages || [] });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
