import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { buildPurchaseRecordPdf, loadOrderDocument } from "@/lib/documents/order-docs";
import { pdfResponse } from "@/lib/documents/pdf";
import { auditAdminAction } from "@/lib/audit";

/** Internal purchase record PDF — ADMIN only (never customer-facing). */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
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
