import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/rbac-server";
import { buildPurchaseRecordPdf, loadOrderDocument } from "@/lib/documents/order-docs";
import { pdfResponse } from "@/lib/documents/pdf";
import { auditAdminAction } from "@/lib/audit";

/** Internal purchase record PDF. Staff with orders/payments access only. */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  const session = await requireAdminSession({ modules: ["orders", "payments"] });
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { orderNumber } = await params;
  const order = await loadOrderDocument(orderNumber);
  if (!order) {
    return new NextResponse("Order not found", { status: 404 });
  }

  const buffer = await buildPurchaseRecordPdf(order);
  await auditAdminAction(req, session, {
    action: "purchase_record.download",
    entity: "Order",
    entityId: order.id,
    details: order.orderNumber,
  });

  return pdfResponse(buffer, `purchase-record-${order.orderNumber}.pdf`);
}
