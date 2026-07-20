import { NextResponse } from "next/server";
import { buildReceiptPdf, loadOrderDocument } from "@/lib/documents/order-docs";
import { pdfResponse } from "@/lib/documents/pdf";
import { canAccessOrder } from "@/lib/security-access";

/** Customer payment receipt PDF. Requires access proof. */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  const { orderNumber } = await params;
  const order = await loadOrderDocument(orderNumber);

  if (!order) {
    return new NextResponse("Order not found", { status: 404 });
  }

  const url = new URL(req.url);
  const allowed = await canAccessOrder(order, {
    req,
    orderNumber,
    phone: url.searchParams.get("phone"),
    token: url.searchParams.get("token"),
  });
  if (!allowed) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const format = url.searchParams.get("format") || "pdf";
  if (format !== "pdf") {
    return NextResponse.json(
      { error: "Only PDF receipts are supported. Use ?format=pdf" },
      { status: 400 }
    );
  }

  const buffer = await buildReceiptPdf(order);
  return pdfResponse(buffer, `receipt-${order.orderNumber}.pdf`);
}
