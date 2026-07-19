import { NextResponse } from "next/server";
import {
  AgronomyFollowUpType,
  AgronomyRequestStatus,
} from "@prisma/client";
import { requireAdminSession } from "@/lib/rbac-server";
import { prisma } from "@/lib/prisma";
import { auditAdminAction } from "@/lib/audit";

async function requireAgronomyAdmin() {
  return requireAdminSession({ modules: ["agronomy", "farmers"] });
}

const OPEN_STATUSES: AgronomyRequestStatus[] = [
  AgronomyRequestStatus.OPEN,
  AgronomyRequestStatus.REPLIED,
  AgronomyRequestStatus.SCHEDULED,
];

/** List agronomy requests from Farmers Portal (first-class entities). */
export async function GET(req: Request) {
  const session = await requireAgronomyAdmin();
  if (!session?.user?.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const filter = searchParams.get("filter") || "open"; // open | all

  const items = await prisma.agronomyRequest.findMany({
    where: filter === "open" ? { status: { in: OPEN_STATUSES } } : {},
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      supplier: {
        select: {
          id: true,
          businessName: true,
          phone: true,
          district: true,
          location: true,
          inspectionScheduledAt: true,
          user: { select: { fullName: true, phone: true } },
        },
      },
      followUps: { orderBy: { recordedAt: "desc" }, take: 8 },
    },
  });

  const openCount = await prisma.agronomyRequest.count({
    where: { status: { in: OPEN_STATUSES } },
  });

  return NextResponse.json({
    items: items.map((n) => ({
      id: n.id,
      kind: n.kind === "VISIT" ? "visit" : "advice",
      crop: n.crop,
      topicOrReason: n.topicOrReason,
      description: n.description,
      preferredDate: n.preferredDate?.toISOString() ?? null,
      status: n.status,
      adminReply: n.adminReply,
      scheduledAt: n.scheduledAt?.toISOString() ?? null,
      handledAt: n.handledAt?.toISOString() ?? null,
      createdAt: n.createdAt.toISOString(),
      isRead: !OPEN_STATUSES.includes(n.status),
      farmName: n.supplier.businessName,
      body: [
        `Farm: ${n.supplier.businessName}`,
        `Crop: ${n.crop}`,
        n.kind === "ADVICE" ? `Topic: ${n.topicOrReason}` : `Reason: ${n.topicOrReason}`,
        n.preferredDate ? `Preferred date: ${n.preferredDate.toISOString().slice(0, 10)}` : null,
        `Details: ${n.description}`,
        n.adminReply ? `Admin reply: ${n.adminReply}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
      title: `[Agronomy] ${n.supplier.businessName}`,
      supplier: {
        id: n.supplier.id,
        businessName: n.supplier.businessName,
        phone: n.supplier.phone || n.supplier.user?.phone || null,
        district: n.supplier.district,
        location: n.supplier.location,
        inspectionScheduledAt: n.supplier.inspectionScheduledAt?.toISOString() ?? null,
        farmerName: n.supplier.user?.fullName || null,
      },
      followUps: n.followUps.map((f) => ({
        id: f.id,
        type: f.type,
        notes: f.notes,
        recordedAt: f.recordedAt.toISOString(),
      })),
    })),
    counts: { open: openCount },
  });
}

export async function PATCH(req: Request) {
  const session = await requireAgronomyAdmin();
  if (!session?.user?.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { id, action } = body as { id?: string; action?: string };
  if (!id || !action) {
    return NextResponse.json({ error: "id and action required" }, { status: 400 });
  }

  const request = await prisma.agronomyRequest.findUnique({
    where: { id },
    include: {
      supplier: { select: { id: true, userId: true, businessName: true } },
    },
  });
  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (action === "mark_handled") {
    await prisma.agronomyRequest.update({
      where: { id },
      data: {
        status: AgronomyRequestStatus.HANDLED,
        handledAt: new Date(),
        handledById: session.user.id,
      },
    });
    await auditAdminAction(req, session, {
      action: "agronomy.mark_handled",
      entity: "AgronomyRequest",
      entityId: id,
      details: request.supplier.businessName,
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "reply") {
    const message = String(body.message || "").trim();
    if (!message) return NextResponse.json({ error: "message required" }, { status: 400 });

    await prisma.agronomyRequest.update({
      where: { id },
      data: {
        adminReply: message,
        status: AgronomyRequestStatus.REPLIED,
      },
    });
    await prisma.agronomyFollowUp.create({
      data: {
        requestId: id,
        type: AgronomyFollowUpType.RECOMMENDATION,
        notes: message,
        createdById: session.user.id,
      },
    });
    await prisma.notification.create({
      data: {
        userId: request.supplier.userId,
        type: "SUPPLIER_STATUS",
        channel: "IN_APP",
        title: "Agronomy reply from Youth Huza",
        body: message,
      },
    });
    await auditAdminAction(req, session, {
      action: "agronomy.reply",
      entity: "AgronomyRequest",
      entityId: id,
      details: message.slice(0, 200),
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "schedule_visit") {
    const when = body.when ? new Date(String(body.when)) : new Date();
    if (Number.isNaN(when.getTime())) {
      return NextResponse.json({ error: "Invalid visit date" }, { status: 400 });
    }
    const note = String(body.note || "").trim();

    await prisma.supplier.update({
      where: { id: request.supplier.id },
      data: {
        inspectionScheduledAt: when,
        adminNotes: note || `Agronomy visit scheduled for ${when.toISOString()}`,
      },
    });
    await prisma.agronomyRequest.update({
      where: { id },
      data: {
        status: AgronomyRequestStatus.SCHEDULED,
        scheduledAt: when,
        adminReply: note || request.adminReply,
      },
    });
    await prisma.agronomyFollowUp.create({
      data: {
        requestId: id,
        type: AgronomyFollowUpType.VISIT,
        notes: note || `Visit scheduled for ${when.toISOString()}`,
        createdById: session.user.id,
      },
    });
    await prisma.notification.create({
      data: {
        userId: request.supplier.userId,
        type: "SUPPLIER_STATUS",
        channel: "IN_APP",
        title: "Agronomy visit scheduled",
        body: [
          `Youth Huza scheduled a farm visit for ${when.toLocaleString()}.`,
          note ? `Note: ${note}` : null,
        ]
          .filter(Boolean)
          .join("\n"),
      },
    });
    await auditAdminAction(req, session, {
      action: "agronomy.schedule_visit",
      entity: "AgronomyRequest",
      entityId: id,
      details: when.toISOString(),
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "add_follow_up") {
    const notes = String(body.notes || "").trim();
    if (!notes) return NextResponse.json({ error: "notes required" }, { status: 400 });
    const typeRaw = String(body.type || "NOTE").toUpperCase();
    const allowed = Object.values(AgronomyFollowUpType) as string[];
    const type = (allowed.includes(typeRaw) ? typeRaw : "NOTE") as AgronomyFollowUpType;

    await prisma.agronomyFollowUp.create({
      data: {
        requestId: id,
        type,
        notes,
        createdById: session.user.id,
      },
    });
    await auditAdminAction(req, session, {
      action: "agronomy.follow_up",
      entity: "AgronomyRequest",
      entityId: id,
      details: `${type}: ${notes.slice(0, 120)}`,
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
