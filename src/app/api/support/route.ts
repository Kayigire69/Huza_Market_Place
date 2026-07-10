import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supportAutoReply } from "@/lib/support-bot";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const threadId = new URL(req.url).searchParams.get("threadId");
    if (!threadId) {
      return NextResponse.json({ error: "threadId required" }, { status: 400 });
    }

    const thread = await prisma.supportThread.findUnique({
      where: { id: threadId },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    if (!thread) {
      return NextResponse.json({ error: "Not found", messages: [] }, { status: 404 });
    }
    return NextResponse.json({
      threadId: thread.id,
      messages: thread.messages,
      status: thread.status,
    });
  } catch (err) {
    console.error("support GET", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Support lookup failed", messages: [] },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body", messages: [] }, { status: 400 });
    }

    const locale = typeof body.locale === "string" ? body.locale : undefined;
    const action = body.action;

    if (action === "start") {
      const firstMessage =
        (typeof body.body === "string" && body.body.trim()) ||
        (locale === "fr" ? "Bonjour" : locale === "rw" ? "Muraho" : "Hello");
      const welcome = supportAutoReply(firstMessage, locale);

      const thread = await prisma.supportThread.create({
        data: {
          guestName: (body.guestName as string) || "Guest",
          guestPhone: (body.guestPhone as string) || null,
          messages: {
            create: [
              { sender: "CUSTOMER", body: firstMessage },
              { sender: "AGENT", body: welcome },
            ],
          },
        },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      });

      return NextResponse.json({
        threadId: thread.id,
        messages: thread.messages,
      });
    }

    if (action === "message") {
      const threadId = typeof body.threadId === "string" ? body.threadId : "";
      const text = typeof body.body === "string" ? body.body.trim() : "";
      if (!threadId) {
        return NextResponse.json({ error: "threadId required", messages: [] }, { status: 400 });
      }
      if (!text) {
        return NextResponse.json({ error: "Message is empty", messages: [] }, { status: 400 });
      }

      const existing = await prisma.supportThread.findUnique({ where: { id: threadId } });
      if (!existing) {
        return NextResponse.json(
          { error: "Chat session expired. Please start a new chat.", code: "THREAD_MISSING", messages: [] },
          { status: 404 }
        );
      }

      await prisma.supportMessage.create({
        data: {
          threadId,
          sender: "CUSTOMER",
          body: text,
        },
      });

      const reply = supportAutoReply(text, locale);

      await prisma.supportMessage.create({
        data: { threadId, sender: "AGENT", body: reply },
      });

      await prisma.supportThread.update({
        where: { id: threadId },
        data: { updatedAt: new Date() },
      });

      const thread = await prisma.supportThread.findUnique({
        where: { id: threadId },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      });

      return NextResponse.json({
        threadId,
        messages: thread?.messages || [],
      });
    }

    return NextResponse.json({ error: "Invalid action", messages: [] }, { status: 400 });
  } catch (err) {
    console.error("support POST", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Support chat failed",
        messages: [],
      },
      { status: 500 }
    );
  }
}
