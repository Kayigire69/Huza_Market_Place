import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { AgronomyRequestKind } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Farmer agronomy advice / farm-visit requests.
 * Persists AgronomyRequest + mirrors in-app notifications for farmer & admins.
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (
    session.user.role !== "SUPPLIER" &&
    session.user.role !== "ADMIN" &&
    session.user.role !== "SUPER_ADMIN"
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const kind = body.kind === "visit" ? AgronomyRequestKind.VISIT : AgronomyRequestKind.ADVICE;

  const farmer = await prisma.supplier.findFirst({
    where: { userId: session.user.id },
    select: { id: true, businessName: true, userId: true },
  });
  if (!farmer) {
    return NextResponse.json({ error: "Farmer profile not found" }, { status: 404 });
  }

  const crop = String(body.crop || "").trim();
  const description = String(body.description || "").trim();
  if (!crop || !description) {
    return NextResponse.json({ error: "Crop and description are required" }, { status: 400 });
  }

  const topicOrReason =
    kind === AgronomyRequestKind.ADVICE
      ? String(body.topic || "General advice").trim()
      : String(body.reason || "Farm visit").trim();
  const preferredDate = body.preferredDate ? new Date(String(body.preferredDate)) : null;
  const preferredOk = preferredDate && !Number.isNaN(preferredDate.getTime()) ? preferredDate : null;

  const request = await prisma.agronomyRequest.create({
    data: {
      supplierId: farmer.id,
      kind,
      crop,
      topicOrReason,
      description,
      preferredDate: preferredOk,
    },
  });

  const title =
    kind === AgronomyRequestKind.ADVICE
      ? `Agronomy advice: ${topicOrReason}`
      : `Farm visit request: ${topicOrReason}`;
  const detail = [
    `Farm: ${farmer.businessName}`,
    `Crop: ${crop}`,
    kind === AgronomyRequestKind.ADVICE ? `Topic: ${topicOrReason}` : `Reason: ${topicOrReason}`,
    preferredOk ? `Preferred date: ${preferredOk.toISOString().slice(0, 10)}` : null,
    `Details: ${description}`,
    kind === AgronomyRequestKind.VISIT ? "Status: Request Submitted" : null,
  ]
    .filter(Boolean)
    .join("\n");

  await prisma.notification.create({
    data: {
      userId: farmer.userId,
      type: "SUPPLIER_STATUS",
      channel: "IN_APP",
      title,
      body: detail,
    },
  });

  const owners = await prisma.user.findMany({
    where: { role: { in: ["SUPER_ADMIN", "ADMIN"] } },
    select: { id: true },
    take: 5,
  });
  if (owners.length) {
    await prisma.notification.createMany({
      data: owners.map((o) => ({
        userId: o.id,
        type: "SUPPLIER_STATUS" as const,
        channel: "IN_APP" as const,
        title: `[Agronomy] ${farmer.businessName}`,
        body: detail,
      })),
    });
  }

  return NextResponse.json({ ok: true, id: request.id });
}

/** Farmer can list their own agronomy requests + follow-ups. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const farmer = await prisma.supplier.findFirst({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!farmer) {
    return NextResponse.json({ error: "Farmer profile not found" }, { status: 404 });
  }

  const requests = await prisma.agronomyRequest.findMany({
    where: { supplierId: farmer.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      followUps: { orderBy: { recordedAt: "desc" }, take: 10 },
    },
  });

  return NextResponse.json({
    requests: requests.map((r) => ({
      ...r,
      preferredDate: r.preferredDate?.toISOString() ?? null,
      scheduledAt: r.scheduledAt?.toISOString() ?? null,
      handledAt: r.handledAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      followUps: r.followUps.map((f) => ({
        ...f,
        recordedAt: f.recordedAt.toISOString(),
      })),
    })),
  });
}
