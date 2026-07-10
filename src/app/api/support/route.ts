import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supportAutoReply } from "@/lib/support-bot";

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
  const locale = body.locale as string | undefined;

  if (body.action === "start") {
    const welcome = supportAutoReply(body.body || "hello", locale);
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
              body: welcome,
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

    const reply = supportAutoReply(String(body.body || ""), locale);

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
