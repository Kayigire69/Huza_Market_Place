import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "PROCUREMENT")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, action, note } = await req.json();
  if (!id || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const product = await prisma.product.update({
    where: { id },
    data: {
      reviewStatus: action === "approve" ? "APPROVED" : "REJECTED",
      reviewNote: note || null,
      reviewedAt: new Date(),
      isActive: action === "approve",
      // Show accepted farmer products on the customer home "Fresh today" strip
      ...(action === "approve" ? { isNewArrival: true } : { isActive: false }),
    },
    include: { supplier: true },
  });

  await prisma.notification.create({
    data: {
      userId: product.supplier.userId,
      type: "SUPPLIER_STATUS",
      channel: "IN_APP",
      title: action === "approve" ? "Product accepted by Huza" : "Product rejected by Huza",
      body:
        action === "approve"
          ? `${product.nameEn} was accepted and may be sold on HUZA FRESH.`
          : `${product.nameEn} was rejected. ${note || "See admin notes."}`,
    },
  });

  await writeAuditLog({
    actorId: session.user.id,
    actorName: session.user.name,
    action: `product.${action}`,
    entity: "Product",
    entityId: id,
    details: note || action,
  });

  return NextResponse.json(product);
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "PROCUREMENT")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const products = await prisma.product.findMany({
    where: { reviewStatus: "PENDING", isActive: false },
    include: {
      supplier: true,
      category: true,
      images: { orderBy: { sortOrder: "asc" }, take: 4 },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json(products);
}
