import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Farmer agronomy advice / farm-visit requests.
 * Stored as in-app notifications for the farmer (+ mirrored to owner for follow-up).
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
  const kind = body.kind === "visit" ? "visit" : "advice";

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
    kind === "advice"
      ? String(body.topic || "General advice").trim()
      : String(body.reason || "Farm visit").trim();
  const preferredDate = body.preferredDate ? String(body.preferredDate) : null;

  const title =
    kind === "advice"
      ? `Agronomy advice: ${topicOrReason}`
      : `Farm visit request: ${topicOrReason}`;
  const detail = [
    `Farm: ${farmer.businessName}`,
    `Crop: ${crop}`,
    kind === "advice" ? `Topic: ${topicOrReason}` : `Reason: ${topicOrReason}`,
    preferredDate ? `Preferred date: ${preferredDate}` : null,
    `Details: ${description}`,
    kind === "visit" ? "Status: Request Submitted" : null,
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

  return NextResponse.json({ ok: true });
}
