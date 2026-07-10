import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatRwf, formatUnit } from "@/lib/utils";

/** Returns a printable HTML invoice (browser can Save as PDF) */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  const { orderNumber } = await params;
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      items: { include: { product: true, supplier: true } },
      payment: true,
      delivery: true,
    },
  });

  if (!order) {
    return new NextResponse("Order not found", { status: 404 });
  }

  const rows = order.items
    .map(
      (i) => `
      <tr>
        <td>${i.product.nameEn}</td>
        <td>${i.supplier.businessName}</td>
        <td>${i.quantity} ${formatUnit(i.product.unit)}</td>
        <td>${formatRwf(i.unitPrice)}</td>
        <td>${formatRwf(i.lineTotal)}</td>
      </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Invoice ${order.orderNumber}</title>
  <style>
    body { font-family: Georgia, serif; color: #14261c; margin: 40px; }
    h1 { color: #0b5c34; margin-bottom: 4px; }
    .sub { color: #1fa65a; letter-spacing: 0.12em; font-size: 12px; text-transform: uppercase; }
    table { width: 100%; border-collapse: collapse; margin-top: 24px; }
    th, td { border-bottom: 1px solid #cfe6d7; padding: 10px 8px; text-align: left; font-size: 14px; }
    th { background: #e7f6ec; }
    .totals { margin-top: 20px; width: 280px; margin-left: auto; }
    .totals div { display: flex; justify-content: space-between; padding: 4px 0; }
    .brand { display: flex; align-items: center; gap: 12px; }
    @media print { button { display: none; } }
  </style>
</head>
<body>
  <div class="brand">
    <div>
      <h1>HUZA MARKETPLACE</h1>
      <div class="sub">Powered by Youth Huza</div>
    </div>
  </div>
  <p style="margin-top:24px"><strong>Invoice</strong> ${order.orderNumber}<br/>
  Date: ${order.createdAt.toLocaleString()}<br/>
  Customer: ${order.guestName || "Account customer"} · ${order.guestPhone || ""}<br/>
  Delivery: ${order.deliveryAddress} (${order.deliveryZone})
  </p>
  <table>
    <thead>
      <tr><th>Product</th><th>Seller</th><th>Qty</th><th>Unit</th><th>Total</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="totals">
    <div><span>Subtotal</span><span>${formatRwf(order.subtotal)}</span></div>
    <div><span>Delivery</span><span>${formatRwf(order.deliveryFee)}</span></div>
    <div style="font-weight:bold;font-size:16px;border-top:2px solid #0b5c34;padding-top:8px">
      <span>Total</span><span>${formatRwf(order.total)}</span>
    </div>
    <div><span>Payment</span><span>${order.payment?.method || "—"} · ${order.payment?.status || "—"}</span></div>
  </div>
  <p style="margin-top:32px;font-size:12px;color:#5a7264">
    Direct delivery by Youth Huza — no middlemen. Thank you for shopping HUZA MARKETPLACE.
  </p>
  <button onclick="window.print()" style="margin-top:20px;padding:10px 16px;background:#0b5c34;color:white;border:0;border-radius:8px;cursor:pointer">
    Print / Save as PDF
  </button>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
