import { prisma } from "@/lib/prisma";
import { formatRwf, formatUnit, DELIVERY_ZONE_LABELS, type DeliveryZoneKey } from "@/lib/utils";
import { BRAND, drawBrandHeader, drawFooter, renderPdf } from "./pdf";

export async function loadOrderDocument(orderNumber: string) {
  return prisma.order.findUnique({
    where: { orderNumber },
    include: {
      items: { include: { product: true } },
      payment: true,
      delivery: true,
      user: { select: { fullName: true, phone: true, email: true } },
    },
  });
}

export type OrderDoc = NonNullable<Awaited<ReturnType<typeof loadOrderDocument>>>;

function customerName(order: OrderDoc) {
  return order.guestName || order.user?.fullName || "Customer";
}

function customerPhone(order: OrderDoc) {
  return order.guestPhone || order.user?.phone || "—";
}

function zoneLabel(zone: string) {
  return DELIVERY_ZONE_LABELS[zone as DeliveryZoneKey] || zone;
}

function money(n: number) {
  return formatRwf(n);
}

/** Formal tax-style invoice PDF for the customer. */
export async function buildInvoicePdf(order: OrderDoc): Promise<Buffer> {
  return renderPdf(
    (doc) => {
      drawBrandHeader(doc, "INVOICE");

      doc.fillColor(BRAND.ink).font("Helvetica").fontSize(10);
      doc.text(`Invoice / Order: ${order.orderNumber}`);
      doc.text(`Date: ${order.createdAt.toLocaleString()}`);
      doc.text(`Status: ${order.status}`);
      doc.moveDown(0.6);
      doc.font("Helvetica-Bold").text("Bill to");
      doc.font("Helvetica").text(customerName(order));
      doc.text(`Phone: ${customerPhone(order)}`);
      if (order.user?.email) doc.text(`Email: ${order.user.email}`);
      doc.moveDown(0.4);
      doc.font("Helvetica-Bold").text("Deliver to");
      doc.font("Helvetica").text(order.deliveryAddress);
      doc.text(`Zone: ${zoneLabel(order.deliveryZone)}`);
      if (order.estimatedDelivery) doc.text(`ETA: ${order.estimatedDelivery}`);
      doc.moveDown(1);

      const left = doc.page.margins.left;
      const usable = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const cols = {
        product: left,
        qty: left + usable * 0.48,
        unit: left + usable * 0.62,
        total: left + usable * 0.78,
      };

      const headerY = doc.y;
      doc.rect(left, headerY - 2, usable, 18).fill(BRAND.mint);
      doc.fillColor(BRAND.ink).font("Helvetica-Bold").fontSize(9);
      doc.text("Product", cols.product + 4, headerY + 2, { width: usable * 0.44 });
      doc.text("Qty", cols.qty, headerY + 2, { width: usable * 0.12 });
      doc.text("Unit", cols.unit, headerY + 2, { width: usable * 0.14 });
      doc.text("Total", cols.total, headerY + 2, { width: usable * 0.2, align: "right" });
      doc.y = headerY + 22;

      doc.font("Helvetica").fontSize(9).fillColor(BRAND.ink);
      for (const item of order.items) {
        const y = doc.y;
        if (y > doc.page.height - 120) {
          doc.addPage();
          doc.y = doc.page.margins.top;
        }
        const rowY = doc.y;
        doc.text(item.product.nameEn, cols.product + 4, rowY, { width: usable * 0.44 });
        doc.text(`${item.quantity} ${formatUnit(item.product.unit)}`, cols.qty, rowY, {
          width: usable * 0.12,
        });
        doc.text(money(item.unitPrice), cols.unit, rowY, { width: usable * 0.14 });
        doc.text(money(item.lineTotal), cols.total, rowY, { width: usable * 0.2, align: "right" });
        doc.y = Math.max(doc.y, rowY + 16);
        doc
          .moveTo(left, doc.y)
          .lineTo(left + usable, doc.y)
          .strokeColor(BRAND.line)
          .stroke();
        doc.moveDown(0.4);
      }

      doc.moveDown(0.8);
      const totalsX = left + usable * 0.55;
      const labelW = usable * 0.25;
      const valueW = usable * 0.2;
      const row = (label: string, value: string, bold = false) => {
        doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(bold ? 11 : 10);
        doc.text(label, totalsX, doc.y, { width: labelW });
        doc.text(value, totalsX + labelW, doc.y - 12, { width: valueW, align: "right" });
        doc.moveDown(0.35);
      };
      row("Subtotal", money(order.subtotal));
      if (order.discountAmt > 0) row("Discount", `-${money(order.discountAmt)}`);
      row("Delivery", money(order.deliveryFee));
      row("Total", money(order.total), true);

      doc.moveDown(0.6);
      doc.font("Helvetica").fontSize(10).fillColor(BRAND.ink);
      doc.text(
        `Payment: ${order.payment?.method || "—"} · ${order.payment?.status || "—"}`
      );
      if (order.payment?.transactionRef) {
        doc.text(`Reference: ${order.payment.transactionRef}`);
      }

      drawFooter(
        doc,
        "Sold and delivered by Youth Huza on HUZA FRESH. Thank you for your order."
      );
    },
    { info: { Title: `Invoice ${order.orderNumber}` } }
  );
}

/** Compact payment receipt PDF for the customer. */
export async function buildReceiptPdf(order: OrderDoc): Promise<Buffer> {
  return renderPdf(
    (doc) => {
      drawBrandHeader(doc, "PAYMENT RECEIPT");

      doc.fillColor(BRAND.ink).font("Helvetica-Bold").fontSize(11);
      doc.text(`Receipt for order ${order.orderNumber}`);
      doc.moveDown(0.5);
      doc.font("Helvetica").fontSize(10);
      doc.text(`Issued: ${new Date().toLocaleString()}`);
      doc.text(`Order date: ${order.createdAt.toLocaleString()}`);
      doc.text(`Customer: ${customerName(order)}`);
      doc.text(`Phone: ${customerPhone(order)}`);
      doc.moveDown(0.8);

      const boxTop = doc.y;
      doc.roundedRect(doc.page.margins.left, boxTop, 280, 88, 8).fill(BRAND.mint);
      doc.fillColor(BRAND.ink).font("Helvetica").fontSize(9);
      doc.text("Amount paid", doc.page.margins.left + 14, boxTop + 12);
      doc.font("Helvetica-Bold").fontSize(18).fillColor(BRAND.green);
      doc.text(money(order.payment?.amount ?? order.total), doc.page.margins.left + 14, boxTop + 28);
      doc.font("Helvetica").fontSize(9).fillColor(BRAND.ink);
      doc.text(
        `${order.payment?.method || "—"} · ${order.payment?.status || "—"}`,
        doc.page.margins.left + 14,
        boxTop + 56
      );
      if (order.payment?.verifiedAt) {
        doc.text(
          `Confirmed: ${order.payment.verifiedAt.toLocaleString()}`,
          doc.page.margins.left + 14,
          boxTop + 70
        );
      }
      doc.y = boxTop + 100;

      doc.font("Helvetica-Bold").fontSize(10).text("Items");
      doc.font("Helvetica").fontSize(9);
      for (const item of order.items) {
        doc.text(
          `• ${item.product.nameEn} × ${item.quantity} ${formatUnit(item.product.unit)} — ${money(item.lineTotal)}`
        );
      }
      doc.moveDown(0.6);
      doc.text(`Delivery to: ${order.deliveryAddress} (${zoneLabel(order.deliveryZone)})`);
      if (order.payment?.transactionRef) {
        doc.text(`Transaction ref: ${order.payment.transactionRef}`);
      }
      if (order.payment?.phoneNumber) {
        doc.text(`Paid from: ${order.payment.phoneNumber}`);
      }

      drawFooter(doc, "This receipt confirms payment to Youth Huza for your HUZA FRESH order.");
    },
    { info: { Title: `Receipt ${order.orderNumber}` } }
  );
}

/** Printable HTML invoice (browser Save as PDF fallback). */
export function buildInvoiceHtml(order: OrderDoc): string {
  const rows = order.items
    .map(
      (i) => `
      <tr>
        <td>${escapeHtml(i.product.nameEn)}</td>
        <td>${i.quantity} ${formatUnit(i.product.unit)}</td>
        <td>${money(i.unitPrice)}</td>
        <td>${money(i.lineTotal)}</td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Invoice ${escapeHtml(order.orderNumber)}</title>
  <style>
    body { font-family: Georgia, serif; color: #14261c; margin: 40px; }
    h1 { color: #0b5c34; margin-bottom: 4px; }
    .sub { color: #1fa65a; letter-spacing: 0.12em; font-size: 12px; text-transform: uppercase; }
    table { width: 100%; border-collapse: collapse; margin-top: 24px; }
    th, td { border-bottom: 1px solid #cfe6d7; padding: 10px 8px; text-align: left; font-size: 14px; }
    th { background: #e7f6ec; }
    .totals { margin-top: 20px; width: 280px; margin-left: auto; }
    .totals div { display: flex; justify-content: space-between; padding: 4px 0; }
    .actions { margin-top: 24px; display: flex; gap: 10px; flex-wrap: wrap; }
    a.btn, button { padding: 10px 16px; background: #0b5c34; color: white; border: 0; border-radius: 8px; cursor: pointer; text-decoration: none; font-size: 14px; }
    a.ghost { background: white; color: #0b5c34; border: 1px solid #0b5c34; }
    @media print { .actions { display: none; } }
  </style>
</head>
<body>
  <h1>HUZA FRESH</h1>
  <div class="sub">Powered by Youth Huza</div>
  <p style="margin-top:24px"><strong>Invoice</strong> ${escapeHtml(order.orderNumber)}<br/>
  Date: ${order.createdAt.toLocaleString()}<br/>
  Customer: ${escapeHtml(customerName(order))} · ${escapeHtml(customerPhone(order))}<br/>
  Delivery: ${escapeHtml(order.deliveryAddress)} (${escapeHtml(zoneLabel(order.deliveryZone))})
  </p>
  <table>
    <thead>
      <tr><th>Product</th><th>Qty</th><th>Unit</th><th>Total</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="totals">
    <div><span>Subtotal</span><span>${money(order.subtotal)}</span></div>
    ${order.discountAmt > 0 ? `<div><span>Discount</span><span>-${money(order.discountAmt)}</span></div>` : ""}
    <div><span>Delivery</span><span>${money(order.deliveryFee)}</span></div>
    <div style="font-weight:bold;font-size:16px;border-top:2px solid #0b5c34;padding-top:8px">
      <span>Total</span><span>${money(order.total)}</span>
    </div>
    <div><span>Payment</span><span>${escapeHtml(order.payment?.method || "—")} · ${escapeHtml(order.payment?.status || "—")}</span></div>
  </div>
  <p style="margin-top:32px;font-size:12px;color:#5a7264">
    Direct delivery by Youth Huza — thank you for shopping HUZA FRESH.
  </p>
  <div class="actions">
    <button onclick="window.print()">Print</button>
    <a class="btn" href="/api/invoices/${encodeURIComponent(order.orderNumber)}?format=pdf">Download PDF invoice</a>
    <a class="btn ghost" href="/api/receipts/${encodeURIComponent(order.orderNumber)}?format=pdf">Download PDF receipt</a>
  </div>
</body>
</html>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
