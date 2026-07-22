import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { PurchaseOrderStatus } from "@prisma/client";
import { findSupplierForUser } from "@/lib/supplier-context";
import { notifyProcurementStaff } from "@/lib/notify-procurement";

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

    await notifyProcurementStaff({
      title: "Procurement assigned",
      body: `${supplier.businessName} accepted PO ${po.poNumber} (${po.productName}). Follow up on delivery/inspection.`,
    });

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

  await notifyProcurementStaff({
    title: "Procurement assigned",
    body: `${supplier.businessName}: delivery update on ${po.poNumber} — ${scheduleLine}`,
  });

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
