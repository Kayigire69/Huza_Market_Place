import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { TicketType } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function ticketNumber() {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `TKT-${Date.now().toString().slice(-6)}${n}`;
}

const ALLOWED_TYPES = new Set<string>([
  "GENERAL",
  "COMPLAINT",
  "RETURN",
  "REFUND",
  "CALL_REQUEST",
]);

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const body = await req.json();

  const subject = String(body.subject || "").trim();
  const ticketBody = String(body.body || "").trim();
  const typeRaw = String(body.type || "GENERAL");
  const orderNumber = body.orderNumber ? String(body.orderNumber).trim() : null;
  const guestName = body.guestName ? String(body.guestName).trim() : null;
  const guestPhone = body.guestPhone ? String(body.guestPhone).trim() : null;

  if (!subject || !ticketBody) {
    return NextResponse.json({ error: "Subject and message are required" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(typeRaw)) {
    return NextResponse.json({ error: "Invalid ticket type" }, { status: 400 });
  }

  if (!session?.user && !guestPhone && !guestName) {
    return NextResponse.json(
      { error: "Name or phone required for guest tickets" },
      { status: 400 }
    );
  }

  const ticket = await prisma.supportTicket.create({
    data: {
      ticketNumber: ticketNumber(),
      userId: session?.user?.id || null,
      guestName: session?.user ? null : guestName,
      guestPhone: session?.user ? null : guestPhone,
      type: typeRaw as TicketType,
      subject,
      body: ticketBody,
      orderNumber,
    },
  });

  return NextResponse.json({
    ok: true,
    id: ticket.id,
    ticketNumber: ticket.ticketNumber,
  });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isStaff =
    session.user.role === "ADMIN" ||
    session.user.role === "SUPPORT";

  const tickets = await prisma.supportTicket.findMany({
    where: isStaff ? {} : { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: isStaff ? 100 : 30,
  });

  return NextResponse.json(tickets);
}
