import { NextResponse } from "next/server";
import { Prisma, TicketStatus, TicketType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/rbac-server";
import { auditAdminAction } from "@/lib/audit";

async function requireAdmin() {
  return requireAdminSession({ modules: ["support"] });
}

const TICKET_STATUSES = new Set(Object.values(TicketStatus));
const TICKET_TYPES = new Set(Object.values(TicketType));
const THREAD_STATUSES = new Set(["OPEN", "CLOSED"]);

export async function GET(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const channel = searchParams.get("channel") || "tickets";
  const q = searchParams.get("q")?.trim().slice(0, 100) || "";
  const status = searchParams.get("status") || "ACTIVE";
  const type = searchParams.get("type") || "ALL";

  if (channel === "chats") {
    const where: Prisma.SupportThreadWhereInput = {
      ...(status !== "ALL" ? { status } : {}),
      ...(q
        ? {
            OR: [
              { guestName: { contains: q, mode: "insensitive" } },
              { guestPhone: { contains: q, mode: "insensitive" } },
              { messages: { some: { body: { contains: q, mode: "insensitive" } } } },
            ],
          }
        : {}),
    };
    const [threads, open, closed] = await Promise.all([
      prisma.supportThread.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        take: 100,
        include: { messages: { orderBy: { createdAt: "asc" }, take: 100 } },
      }),
      prisma.supportThread.count({ where: { status: "OPEN" } }),
      prisma.supportThread.count({ where: { status: "CLOSED" } }),
    ]);
    return NextResponse.json({ threads, counts: { all: open + closed, open, closed } });
  }

  if (channel === "contacts") {
    const where: Prisma.ContactMessageWhereInput = {
      ...(status === "UNREAD" ? { isRead: false } : status === "READ" ? { isRead: true } : {}),
      ...(q
        ? {
            OR: [
              { fullName: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { phone: { contains: q, mode: "insensitive" } },
              { subject: { contains: q, mode: "insensitive" } },
              { message: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    };
    const [contacts, unread, total] = await Promise.all([
      prisma.contactMessage.findMany({ where, orderBy: { createdAt: "desc" }, take: 100 }),
      prisma.contactMessage.count({ where: { isRead: false } }),
      prisma.contactMessage.count(),
    ]);
    return NextResponse.json({ contacts, counts: { all: total, unread, read: total - unread } });
  }

  const statusFilter: Prisma.SupportTicketWhereInput =
    status === "ACTIVE"
      ? { status: { in: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS] } }
      : status !== "ALL" && TICKET_STATUSES.has(status as TicketStatus)
        ? { status: status as TicketStatus }
        : {};
  const typeFilter: Prisma.SupportTicketWhereInput =
    type !== "ALL" && TICKET_TYPES.has(type as TicketType)
      ? { type: type as TicketType }
      : {};
  const searchFilter: Prisma.SupportTicketWhereInput = q
    ? {
        OR: [
          { ticketNumber: { contains: q, mode: "insensitive" } },
          { subject: { contains: q, mode: "insensitive" } },
          { body: { contains: q, mode: "insensitive" } },
          { guestName: { contains: q, mode: "insensitive" } },
          { guestPhone: { contains: q, mode: "insensitive" } },
          { orderNumber: { contains: q, mode: "insensitive" } },
          { user: { fullName: { contains: q, mode: "insensitive" } } },
          { user: { phone: { contains: q, mode: "insensitive" } } },
        ],
      }
    : {};

  const [tickets, open, inProgress, resolved, closed] = await Promise.all([
    prisma.supportTicket.findMany({
      where: { ...statusFilter, ...typeFilter, ...searchFilter },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 150,
      include: {
        user: { select: { id: true, fullName: true, phone: true, email: true } },
      },
    }),
    prisma.supportTicket.count({ where: { status: TicketStatus.OPEN } }),
    prisma.supportTicket.count({ where: { status: TicketStatus.IN_PROGRESS } }),
    prisma.supportTicket.count({ where: { status: TicketStatus.RESOLVED } }),
    prisma.supportTicket.count({ where: { status: TicketStatus.CLOSED } }),
  ]);

  return NextResponse.json({
    tickets,
    counts: {
      all: open + inProgress + resolved + closed,
      active: open + inProgress,
      open,
      inProgress,
      resolved,
      closed,
    },
  });
}

export async function PATCH(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const id = String(body.id || "");
  const channel = String(body.channel || "tickets");
  if (!id) return NextResponse.json({ error: "Ticket or message ID is required" }, { status: 400 });

  if (channel === "chats") {
    const status = body.status ? String(body.status) : undefined;
    const reply = body.reply !== undefined ? String(body.reply || "").trim() : undefined;
    if (status && !THREAD_STATUSES.has(status)) {
      return NextResponse.json({ error: "Invalid chat status" }, { status: 400 });
    }
    if (reply !== undefined && (!reply || reply.length > 4000)) {
      return NextResponse.json({ error: "Reply must be between 1 and 4,000 characters" }, { status: 400 });
    }
    const before = await prisma.supportThread.findUnique({ where: { id }, select: { status: true } });
    if (!before) return NextResponse.json({ error: "Chat not found" }, { status: 404 });

    const updated = await prisma.$transaction(async (tx) => {
      if (reply) {
        await tx.supportMessage.create({
          data: { threadId: id, sender: "AGENT", body: reply },
        });
      }
      return tx.supportThread.update({
        where: { id },
        data: { ...(status ? { status } : {}), updatedAt: new Date() },
        include: { messages: { orderBy: { createdAt: "asc" }, take: 100 } },
      });
    });
    await auditAdminAction(req, session, {
      action: reply ? "support_chat.reply" : "support_chat.status_change",
      entity: "SupportThread",
      entityId: id,
      before: { status: before.status },
      after: { status: updated.status, hasReply: Boolean(reply) },
    });
    return NextResponse.json(updated);
  }

  if (channel === "contacts") {
    const isRead = Boolean(body.isRead);
    const before = await prisma.contactMessage.findUnique({ where: { id }, select: { isRead: true } });
    if (!before) return NextResponse.json({ error: "Contact message not found" }, { status: 404 });
    const updated = await prisma.contactMessage.update({ where: { id }, data: { isRead } });
    await auditAdminAction(req, session, {
      action: "support_contact.read_status",
      entity: "ContactMessage",
      entityId: id,
      before,
      after: { isRead },
    });
    return NextResponse.json(updated);
  }

  const status = body.status ? String(body.status) : undefined;
  const adminReply =
    body.adminReply !== undefined ? String(body.adminReply || "").trim() : undefined;
  if (status && !TICKET_STATUSES.has(status as TicketStatus)) {
    return NextResponse.json({ error: "Invalid ticket status" }, { status: 400 });
  }
  if (adminReply !== undefined && adminReply.length > 4000) {
    return NextResponse.json({ error: "Reply cannot exceed 4,000 characters" }, { status: 400 });
  }

  const before = await prisma.supportTicket.findUnique({
    where: { id },
    select: { status: true, adminReply: true },
  });
  if (!before) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

  const updated = await prisma.supportTicket.update({
    where: { id },
    data: {
      ...(status ? { status: status as TicketStatus } : {}),
      ...(adminReply !== undefined ? { adminReply } : {}),
    },
    include: { user: { select: { id: true, fullName: true, phone: true, email: true } } },
  });

  await auditAdminAction(req, session, {
    action: adminReply ? "support_ticket.reply" : "support_ticket.status_change",
    entity: "SupportTicket",
    entityId: id,
    before: { status: before.status, adminReply: before.adminReply },
    after: { status: updated.status, hasReply: Boolean(updated.adminReply) },
  });

  return NextResponse.json(updated);
}
