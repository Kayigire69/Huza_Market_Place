import { prisma } from "@/lib/prisma";
import { formatRwf, formatUnit, DELIVERY_ZONE_LABELS, type DeliveryZoneKey } from "@/lib/utils";
import { BRAND, drawBrandHeader, drawFooter, renderPdf } from "./pdf";

export async function loadOrderDocument(orderNumber: string) {
  return prisma.order.findUnique({
    where: { orderNumber },
    include: {
      items: {
        include: {
          product: { select: { nameEn: true, unit: true, stockQty: true, location: true } },
          supplier: { select: { businessName: true, farmingType: true } },
        },
      },
      payment: true,
      delivery: true,
      statusLog: { orderBy: { createdAt: "asc" } },
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

function deliveryBlock(order: OrderDoc) {
  const bits = [
    order.deliveryAddress,
    order.deliveryVillage,
    order.deliveryCell,
    order.deliverySector,
    order.deliveryDistrict,
    zoneLabel(order.deliveryZone),
  ].filter(Boolean);
  return bits.join(", ");
}

/** Formal invoice PDF for the customer (no supplier/cost data). */
export async function buildInvoicePdf(order: OrderDoc): Promise<Buffer> {
  return renderPdf(
    (doc) => {
      drawBrandHeader(doc, "INVOICE");

      doc.fillColor(BRAND.ink).font("Helvetica").fontSize(10);
      doc.text(`Order: ${order.orderNumber}`);
      if (order.receiptNumber) doc.text(`Receipt: ${order.receiptNumber}`);
      doc.text(`Date: ${order.createdAt.toLocaleString()}`);
      doc.text(`Status: ${order.status}`);
      doc.moveDown(0.6);
      doc.font("Helvetica-Bold").text("Bill to");
      doc.font("Helvetica").text(customerName(order));
      doc.text(`Phone: ${customerPhone(order)}`);
      if (order.user?.email) doc.text(`Email: ${order.user.email}`);
      doc.moveDown(0.4);
      doc.font("Helvetica-Bold").text("Deliver to");
      doc.font("Helvetica").text(deliveryBlock(order));
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
        if (doc.y > doc.page.height - 120) {
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
      row("Delivery fee", money(order.deliveryFee));
      row("Total", money(order.total), true);

      doc.moveDown(0.6);
      doc.font("Helvetica").fontSize(10).fillColor(BRAND.ink);
      doc.text(`Payment method: ${order.payment?.method || "—"}`);
      doc.text(`Payment status: ${order.payment?.status || "—"}`);
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

/**
 * Customer receipt PDF — public fields only:
 * receipt number, products, delivery fee, total, payment method, order status.
 */
export async function buildReceiptPdf(order: OrderDoc): Promise<Buffer> {
  return renderPdf(
    (doc) => {
      drawBrandHeader(doc, "CUSTOMER RECEIPT");

      doc.fillColor(BRAND.ink).font("Helvetica-Bold").fontSize(12);
      doc.text(order.receiptNumber || order.orderNumber);
      doc.font("Helvetica").fontSize(10);
      doc.text(`Order: ${order.orderNumber}`);
      doc.text(`Date: ${order.createdAt.toLocaleString()}`);
      doc.text(`Order status: ${order.status}`);
      doc.moveDown(0.5);
      doc.text(`Customer: ${customerName(order)}`);
      doc.text(`Phone: ${customerPhone(order)}`);
      doc.text(`Delivery: ${deliveryBlock(order)}`);
      doc.moveDown(0.8);

      const boxTop = doc.y;
      doc.roundedRect(doc.page.margins.left, boxTop, 300, 72, 8).fill(BRAND.mint);
      doc.fillColor(BRAND.ink).font("Helvetica").fontSize(9);
      doc.text("Total paid", doc.page.margins.left + 14, boxTop + 12);
      doc.font("Helvetica-Bold").fontSize(18).fillColor(BRAND.green);
      doc.text(money(order.payment?.amount ?? order.total), doc.page.margins.left + 14, boxTop + 28);
      doc.font("Helvetica").fontSize(9).fillColor(BRAND.ink);
      doc.text(
        `${order.payment?.method || "—"} · ${order.payment?.status || "—"}`,
        doc.page.margins.left + 14,
        boxTop + 52
      );
      doc.y = boxTop + 88;

      doc.font("Helvetica-Bold").fontSize(10).text("Products");
      doc.font("Helvetica").fontSize(9);
      for (const item of order.items) {
        doc.text(
          `• ${item.product.nameEn} × ${item.quantity} ${formatUnit(item.product.unit)} — ${money(item.lineTotal)}`
        );
      }
      doc.moveDown(0.5);
      doc.text(`Subtotal: ${money(order.subtotal)}`);
      doc.text(`Delivery fee: ${money(order.deliveryFee)}`);
      doc.font("Helvetica-Bold").text(`Total: ${money(order.total)}`);
      doc.font("Helvetica").moveDown(0.4);
      if (order.payment?.transactionRef) {
        doc.text(`Transaction ref: ${order.payment.transactionRef}`);
      }

      drawFooter(
        doc,
        "This receipt is for the customer. Supplier costs and margins are never shown here. EBM-ready document id: " +
          (order.receiptNumber || order.orderNumber)
      );
    },
    { info: { Title: `Receipt ${order.receiptNumber || order.orderNumber}` } }
  );
}

/**
 * Internal purchase record — HUZA staff only.
 * Supplier, purchase price, selling price, margin, warehouse/inventory notes.
 */
export async function buildPurchaseRecordPdf(order: OrderDoc): Promise<Buffer> {
  const costSum = order.items.reduce((s, i) => s + (i.costTotal ?? 0), 0);
  const marginSum = order.items.reduce((s, i) => s + (i.marginTotal ?? i.lineTotal - (i.costTotal ?? 0)), 0);

  return renderPdf(
    (doc) => {
      drawBrandHeader(doc, "INTERNAL PURCHASE RECORD — CONFIDENTIAL");

      doc.fillColor("#8a1c1c").font("Helvetica-Bold").fontSize(9);
      doc.text("HUZA STAFF ONLY — never share with customers");
      doc.fillColor(BRAND.ink).font("Helvetica").fontSize(10);
      doc.moveDown(0.4);
      doc.text(`Order: ${order.orderNumber}`);
      if (order.receiptNumber) doc.text(`Customer receipt: ${order.receiptNumber}`);
      doc.text(`Date: ${order.createdAt.toLocaleString()}`);
      doc.text(`Customer: ${customerName(order)} · ${customerPhone(order)}`);
      doc.text(`Delivery: ${deliveryBlock(order)}`);
      doc.text(`Order status: ${order.status} · Payment: ${order.payment?.status || "—"}`);
      doc.moveDown(0.8);

      doc.font("Helvetica-Bold").text("Line economics");
      doc.font("Helvetica").fontSize(8);
      doc.moveDown(0.3);

      const left = doc.page.margins.left;
      const usable = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const widths = [110, 90, 55, 55, 55, 55, 55];
      const headers = ["Product", "Supplier", "Qty", "Cost", "Sell", "Margin", "Stock"];
      const hy = doc.y;
      doc.rect(left, hy - 2, usable, 16).fill("#fde8e8");
      doc.fillColor(BRAND.ink).font("Helvetica-Bold");
      let x = left;
      headers.forEach((h, i) => {
        doc.text(h, x + 2, hy + 1, { width: widths[i] - 4 });
        x += widths[i];
      });
      doc.y = hy + 18;
      doc.font("Helvetica");

      for (const item of order.items) {
        if (doc.y > doc.page.height - 80) {
          doc.addPage();
          doc.y = doc.page.margins.top;
        }
        const cost = item.unitCostPrice ?? 0;
        const sell = item.unitPrice;
        const margin = item.marginTotal ?? item.lineTotal - (item.costTotal ?? 0);
        const y = doc.y;
        const cells = [
          item.product.nameEn,
          item.supplier.businessName,
          `${item.quantity}${formatUnit(item.product.unit)}`,
          money(cost),
          money(sell),
          money(margin),
          String(item.product.stockQty),
        ];
        let cx = left;
        cells.forEach((c, i) => {
          doc.text(c, cx + 2, y, { width: widths[i] - 4, ellipsis: true });
          cx += widths[i];
        });
        doc.y = y + 14;
      }

      doc.moveDown(0.8);
      doc.font("Helvetica").fontSize(10);
      doc.text(`Goods cost (ex-delivery): ${money(costSum)}`);
      doc.text(`Customer product revenue: ${money(order.subtotal)}`);
      doc.text(`Delivery fee charged: ${money(order.deliveryFee)}`);
      doc.font("Helvetica-Bold").text(`Gross product margin: ${money(marginSum)}`);
      doc.font("Helvetica").moveDown(0.5);
      doc.text(
        `Inventory: SALE movements posted on payment confirm for order ${order.orderNumber}.`
      );
      if (order.delivery?.status) {
        doc.text(`Warehouse / delivery status: ${order.delivery.status}`);
      }
      if (order.items[0]?.product.location) {
        doc.text(`Primary stock location hint: ${order.items[0].product.location}`);
      }

      drawFooter(
        doc,
        "Internal Youth Huza record · Supports inventory & financial management · Future RRA EBM can attach to receiptNumber"
      );
    },
    { info: { Title: `Purchase record ${order.orderNumber}` } }
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
  <p style="margin-top:24px"><strong>Invoice</strong> ${escapeHtml(order.orderNumber)}
  ${order.receiptNumber ? `<br/>Receipt: ${escapeHtml(order.receiptNumber)}` : ""}<br/>
  Date: ${order.createdAt.toLocaleString()}<br/>
  Status: ${escapeHtml(order.status)}<br/>
  Customer: ${escapeHtml(customerName(order))} · ${escapeHtml(customerPhone(order))}<br/>
  Delivery: ${escapeHtml(deliveryBlock(order))}
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
    <div><span>Delivery fee</span><span>${money(order.deliveryFee)}</span></div>
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
