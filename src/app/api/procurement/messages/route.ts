import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function canProcure(role?: string) {
  return role === "PROCUREMENT" || role === "ADMIN";
}

async function supplierForUser(userId: string) {
  return prisma.supplier.findUnique({ where: { userId } });
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  let supplierId = searchParams.get("supplierId");

  if (canProcure(session.user.role)) {
    if (!supplierId) {
      return NextResponse.json({ error: "supplierId required" }, { status: 400 });
    }
  } else if (session.user.role === "SUPPLIER") {
    const supplier = await supplierForUser(session.user.id);
    if (!supplier) {
      return NextResponse.json({ error: "Farmer profile not found" }, { status: 404 });
    }
    supplierId = supplier.id;
  } else {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const messages = await prisma.procurementMessage.findMany({
    where: { supplierId: supplierId! },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  return NextResponse.json(messages);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const messageBody = String(body.body || "").trim();
  if (!messageBody) {
    return NextResponse.json({ error: "body required" }, { status: 400 });
  }

  let supplierId = String(body.supplierId || "");
  let senderRole = session.user.role || "PROCUREMENT";
  let senderName = session.user.name || "Procurement";
  let notifyUserId: string | null = null;

  if (canProcure(session.user.role)) {
    if (!supplierId) {
      return NextResponse.json({ error: "supplierId required" }, { status: 400 });
    }
    const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
    if (!supplier) return NextResponse.json({ error: "Farmer not found" }, { status: 404 });
    notifyUserId = supplier.userId;
  } else if (session.user.role === "SUPPLIER") {
    const supplier = await supplierForUser(session.user.id);
    if (!supplier) {
      return NextResponse.json({ error: "Farmer profile not found" }, { status: 404 });
    }
    supplierId = supplier.id;
    senderRole = "SUPPLIER";
    senderName = supplier.businessName;
    const staff = await prisma.user.findMany({
      where: { role: { in: ["PROCUREMENT", "ADMIN"] } },
      select: { id: true },
      take: 20,
    });
    if (staff.length > 0) {
      await prisma.notification.createMany({
        data: staff.map((u) => ({
          userId: u.id,
          type: "SUPPLIER_STATUS" as const,
          channel: "IN_APP" as const,
          title: `Message from ${supplier.businessName}`,
          body: messageBody.slice(0, 200),
        })),
      });
    }
  } else {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const message = await prisma.procurementMessage.create({
    data: {
      supplierId,
      senderRole,
      senderName,
      body: messageBody,
    },
  });

  if (notifyUserId) {
    await prisma.notification.create({
      data: {
        userId: notifyUserId,
        type: "SUPPLIER_STATUS",
        channel: "IN_APP",
        title: "Message from Youth Huza procurement",
        body: messageBody.slice(0, 200),
      },
    });
  }

  return NextResponse.json(message);
}
