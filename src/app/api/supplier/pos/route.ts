import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { PurchaseOrderStatus } from "@prisma/client";
import { findSupplierForUser } from "@/lib/supplier-context";

async function notifyProcurement(title: string, body: string) {
  const staff = await prisma.user.findMany({
    where: { role: { in: ["PROCUREMENT", "ADMIN", "SUPER_ADMIN"] } },
    select: { id: true },
    take: 20,
  });
  if (staff.length === 0) return;
  await prisma.notification.createMany({
    data: staff.map((u) => ({
      userId: u.id,
      type: "SUPPLIER_STATUS" as const,
      channel: "IN_APP" as const,
      title,
      body: body.slice(0, 200),
    })),
  });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supplier = await findSupplierForUser(session.user.id);
  if (!supplier) {
    return NextResponse.json({ error: "Farmer profile not found" }, { status: 404 });
  }

  const purchaseOrders = await prisma.purchaseOrder.findMany({
    where: { supplierId: supplier.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ purchaseOrders });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supplier = await findSupplierForUser(session.user.id);
  if (!supplier) {
    return NextResponse.json({ error: "Farmer profile not found" }, { status: 404 });
  }

  const body = await req.json();
  const poId = String(body.poId || "");
  const action = String(body.action || "") as "accept" | "schedule";

  if (!poId || !["accept", "schedule"].includes(action)) {
    return NextResponse.json({ error: "poId and action (accept|schedule) required" }, { status: 400 });
  }

  const po = await prisma.purchaseOrder.findFirst({
    where: { id: poId, supplierId: supplier.id },
  });
  if (!po) {
    return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });
  }

  if (action === "accept") {
    if (!["DRAFT", "ORDERED"].includes(po.status)) {
      return NextResponse.json(
        { error: `Cannot accept PO in status ${po.status}` },
        { status: 400 }
      );
    }

    const updated = await prisma.purchaseOrder.update({
      where: { id: po.id },
      data: {
        status: PurchaseOrderStatus.ORDERED,
        orderedAt: po.orderedAt || new Date(),
        notes: [po.notes, `Accepted by farmer ${new Date().toISOString()}`]
          .filter(Boolean)
          .join("\n"),
      },
    });

    await notifyProcurement(
      `PO ${po.poNumber} accepted`,
      `${supplier.businessName} accepted purchase order ${po.poNumber} (${po.productName}).`
    );

    await writeAuditLog({
      actorId: session.user.id,
      actorName: session.user.name,
      action: "po.supplier_accept",
      entity: "PurchaseOrder",
      entityId: po.id,
      details: po.poNumber,
    });

    return NextResponse.json(updated);
  }

  // schedule
  const deliveryDate = body.deliveryDate ? String(body.deliveryDate) : "";
  const deliveryNote = body.notes ? String(body.notes).trim() : "";
  if (!deliveryDate && !deliveryNote) {
    return NextResponse.json(
      { error: "deliveryDate or notes required for schedule" },
      { status: 400 }
    );
  }

  if (["CANCELLED", "REJECTED", "PAID"].includes(po.status)) {
    return NextResponse.json(
      { error: `Cannot schedule delivery for PO in status ${po.status}` },
      { status: 400 }
    );
  }

  const scheduleLine = [
    deliveryDate ? `Delivery scheduled: ${deliveryDate}` : null,
    deliveryNote ? `Delivery note: ${deliveryNote}` : null,
    `Updated ${new Date().toISOString()}`,
  ]
    .filter(Boolean)
    .join(" · ");

  const updated = await prisma.purchaseOrder.update({
    where: { id: po.id },
    data: {
      notes: [po.notes, scheduleLine].filter(Boolean).join("\n"),
      orderedAt: po.orderedAt || new Date(),
    },
  });

  await prisma.procurementMessage.create({
    data: {
      supplierId: supplier.id,
      senderRole: "SUPPLIER",
      senderName: supplier.businessName,
      body: `Re PO ${po.poNumber}: ${scheduleLine}`,
    },
  });

  await notifyProcurement(
    `Delivery scheduled · ${po.poNumber}`,
    `${supplier.businessName}: ${scheduleLine}`
  );

  await writeAuditLog({
    actorId: session.user.id,
    actorName: session.user.name,
    action: "po.supplier_schedule",
    entity: "PurchaseOrder",
    entityId: po.id,
    details: scheduleLine,
  });

  return NextResponse.json(updated);
}
