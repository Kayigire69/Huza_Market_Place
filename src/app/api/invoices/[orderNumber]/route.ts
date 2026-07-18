import { NextResponse } from "next/server";
import {
  buildInvoiceHtml,
  buildInvoicePdf,
  loadOrderDocument,
} from "@/lib/documents/order-docs";
import { pdfResponse } from "@/lib/documents/pdf";
import { canAccessOrder } from "@/lib/security-access";

/** Customer invoice — HTML (default) or PDF (?format=pdf). Requires access proof. */
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

  const format = url.searchParams.get("format") || "html";

  if (format === "pdf") {
    const buffer = await buildInvoicePdf(order);
    return pdfResponse(buffer, `invoice-${order.orderNumber}.pdf`);
  }

  return new NextResponse(buildInvoiceHtml(order), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
