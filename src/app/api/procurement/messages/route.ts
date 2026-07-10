import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function canProcure(role?: string) {
  return role === "PROCUREMENT" || role === "ADMIN";
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !canProcure(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const supplierId = searchParams.get("supplierId");
  if (!supplierId) {
    return NextResponse.json({ error: "supplierId required" }, { status: 400 });
  }

  const messages = await prisma.procurementMessage.findMany({
    where: { supplierId },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  return NextResponse.json(messages);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !canProcure(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const supplierId = String(body.supplierId || "");
  const messageBody = String(body.body || "").trim();

  if (!supplierId || !messageBody) {
    return NextResponse.json({ error: "supplierId and body required" }, { status: 400 });
  }

  const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
  if (!supplier) return NextResponse.json({ error: "Supplier not found" }, { status: 404 });

  const message = await prisma.procurementMessage.create({
    data: {
      supplierId,
      senderRole: session.user.role || "PROCUREMENT",
      senderName: session.user.name || "Procurement",
      body: messageBody,
    },
  });

  await prisma.notification.create({
    data: {
      userId: supplier.userId,
      type: "SUPPLIER_STATUS",
      channel: "IN_APP",
      title: "Message from Youth Huza procurement",
      body: messageBody.slice(0, 200),
    },
  });

  return NextResponse.json(message);
}
