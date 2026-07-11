import { prisma } from "@/lib/prisma";
import { formatRwf } from "@/lib/utils";
import { BRAND, drawBrandHeader, drawFooter, renderPdf } from "@/lib/documents/pdf";
import {
  REPORT_LABELS,
  type ReportType,
} from "@/lib/documents/report-types";

export type { ReportType } from "@/lib/documents/report-types";
export { REPORT_TYPES, REPORT_LABELS, isReportType } from "@/lib/documents/report-types";

function parseRange(from?: string | null, to?: string | null) {
  const end = to ? new Date(to) : new Date();
  const start = from ? new Date(from) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
  // normalize to day bounds
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function money(n: number | null | undefined) {
  return formatRwf(n || 0);
}

function drawTable(
  doc: PDFKit.PDFDocument,
  headers: string[],
  rows: string[][],
  widths: number[]
) {
  const left = doc.page.margins.left;
  const startY = doc.y;
  doc.rect(left, startY - 2, widths.reduce((a, b) => a + b, 0), 16).fill(BRAND.mint);
  doc.fillColor(BRAND.ink).font("Helvetica-Bold").fontSize(8);
  let x = left;
  headers.forEach((h, i) => {
    doc.text(h, x + 2, startY + 1, { width: widths[i] - 4, ellipsis: true });
    x += widths[i];
  });
  doc.y = startY + 18;
  doc.font("Helvetica").fontSize(8);

  for (const row of rows) {
    if (doc.y > doc.page.height - 60) {
      doc.addPage();
      doc.y = doc.page.margins.top;
    }
    const y = doc.y;
    let cx = left;
    row.forEach((cell, i) => {
      doc.text(cell, cx + 2, y, { width: widths[i] - 4, ellipsis: true });
      cx += widths[i];
    });
    doc.y = y + 14;
    doc
      .moveTo(left, doc.y)
      .lineTo(left + widths.reduce((a, b) => a + b, 0), doc.y)
      .strokeColor(BRAND.line)
      .stroke();
    doc.moveDown(0.25);
  }
}

export async function buildActivityReportPdf(
  type: ReportType,
  from?: string | null,
  to?: string | null
): Promise<{ buffer: Buffer; filename: string }> {
  const { start, end } = parseRange(from, to);
  const rangeLabel = `${start.toLocaleDateString()} – ${end.toLocaleDateString()}`;
  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `huza-${type}-report-${stamp}.pdf`;

  const data = await fetchReportData(type, start, end);

  const pdf = await renderPdf(
    (doc) => {
      drawBrandHeader(doc, `ADMIN REPORT · ${REPORT_LABELS[type].toUpperCase()}`);
      doc.fillColor(BRAND.ink).font("Helvetica").fontSize(10);
      doc.text(`Period: ${rangeLabel}`);
      doc.text(`Generated: ${new Date().toLocaleString()}`);
      doc.moveDown(0.8);

      for (const line of data.summary) {
        doc.text(line);
      }
      doc.moveDown(0.8);

      if (data.headers.length && data.rows.length) {
        drawTable(doc, data.headers, data.rows, data.widths);
      } else if (!data.rows.length) {
        doc.fillColor(BRAND.muted).text("No records in this period.");
      }

      drawFooter(doc, "Confidential — Youth Huza internal report · HUZA FRESH operations");
    },
    { info: { Title: `HUZA ${REPORT_LABELS[type]} · ${rangeLabel}` } }
  );

  return { buffer: pdf, filename };
}

type ReportData = {
  summary: string[];
  headers: string[];
  rows: string[][];
  widths: number[];
};

async function fetchReportData(
  type: ReportType,
  start: Date,
  end: Date
): Promise<ReportData> {
  const createdAt = { gte: start, lte: end };

  switch (type) {
    case "sales": {
      const orders = await prisma.order.findMany({
        where: { createdAt },
        include: { payment: true },
        orderBy: { createdAt: "desc" },
        take: 200,
      });
      const revenue = orders
        .filter((o) => !["CANCELLED", "REFUNDED"].includes(o.status))
        .reduce((s, o) => s + o.total, 0);
      const byStatus = Object.entries(
        orders.reduce<Record<string, number>>((acc, o) => {
          acc[o.status] = (acc[o.status] || 0) + 1;
          return acc;
        }, {})
      )
        .map(([k, v]) => `${k}: ${v}`)
        .join(" · ");
      return {
        summary: [
          `Orders in period: ${orders.length}`,
          `Revenue (excl. cancelled/refunded): ${money(revenue)}`,
          `By status: ${byStatus || "—"}`,
        ],
        headers: ["Order", "Date", "Zone", "Status", "Total", "Payment"],
        widths: [95, 85, 90, 70, 70, 90],
        rows: orders.map((o) => [
          o.orderNumber,
          o.createdAt.toLocaleDateString(),
          o.deliveryZone,
          o.status,
          money(o.total),
          o.payment ? `${o.payment.method}/${o.payment.status}` : "—",
        ]),
      };
    }
    case "payments": {
      const payments = await prisma.payment.findMany({
        where: { createdAt },
        include: { order: { select: { orderNumber: true } } },
        orderBy: { createdAt: "desc" },
        take: 200,
      });
      const confirmed = payments.filter((p) =>
        ["CONFIRMED", "VERIFIED"].includes(p.status)
      );
      const confirmedSum = confirmed.reduce((s, p) => s + p.amount, 0);
      return {
        summary: [
          `Payments: ${payments.length}`,
          `Confirmed/verified: ${confirmed.length} · ${money(confirmedSum)}`,
        ],
        headers: ["Order", "Method", "Phone", "Amount", "Status", "Date"],
        widths: [95, 75, 85, 70, 75, 85],
        rows: payments.map((p) => [
          p.order.orderNumber,
          p.method,
          p.phoneNumber,
          money(p.amount),
          p.status,
          p.createdAt.toLocaleDateString(),
        ]),
      };
    }
    case "deliveries": {
      const deliveries = await prisma.delivery.findMany({
        where: { createdAt },
        include: {
          order: { select: { orderNumber: true, deliveryZone: true } },
          deliveryPerson: { select: { fullName: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 200,
      });
      const delivered = deliveries.filter((d) => d.status === "DELIVERED").length;
      return {
        summary: [
          `Delivery records: ${deliveries.length}`,
          `Delivered: ${delivered}`,
        ],
        headers: ["Order", "Zone", "Status", "Driver", "Delivered"],
        widths: [100, 100, 90, 120, 90],
        rows: deliveries.map((d) => [
          d.order.orderNumber,
          d.order.deliveryZone,
          d.status,
          d.deliveryPerson?.fullName || "Unassigned",
          d.deliveredAt ? d.deliveredAt.toLocaleDateString() : "—",
        ]),
      };
    }
    case "stock": {
      const movements = await prisma.stockMovement.findMany({
        where: { createdAt },
        include: { product: { select: { nameEn: true, stockQty: true } } },
        orderBy: { createdAt: "desc" },
        take: 250,
      });
      return {
        summary: [`Stock movements: ${movements.length}`],
        headers: ["Date", "Product", "Type", "Qty", "Reason", "On hand"],
        widths: [80, 130, 70, 45, 120, 55],
        rows: movements.map((m) => [
          m.createdAt.toLocaleDateString(),
          m.product.nameEn,
          m.type,
          String(m.quantity),
          m.reason || "—",
          String(m.product.stockQty),
        ]),
      };
    }
    case "farmers": {
      const suppliers = await prisma.supplier.findMany({
        where: { createdAt },
        include: { user: { select: { fullName: true, phone: true } }, _count: { select: { products: true } } },
        orderBy: { createdAt: "desc" },
        take: 200,
      });
      const allCount = await prisma.supplier.groupBy({
        by: ["status"],
        _count: true,
      });
      return {
        summary: [
          `New farmer applications in period: ${suppliers.length}`,
          `All-time by status: ${allCount.map((s) => `${s.status}=${s._count}`).join(" · ")}`,
        ],
        headers: ["Farm", "Contact", "Type", "Status", "Products", "Applied"],
        widths: [120, 100, 70, 80, 60, 80],
        rows: suppliers.map((s) => [
          s.businessName,
          s.user.fullName,
          s.farmingType || "—",
          s.status,
          String(s._count.products),
          s.createdAt.toLocaleDateString(),
        ]),
      };
    }
    case "procurement": {
      const pos = await prisma.purchaseOrder.findMany({
        where: { createdAt },
        include: { supplier: { select: { businessName: true } } },
        orderBy: { createdAt: "desc" },
        take: 200,
      });
      const spent = pos
        .filter((p) => p.status === "PAID" || p.status === "RECEIVED")
        .reduce((s, p) => s + p.totalAmount, 0);
      return {
        summary: [
          `Purchase orders: ${pos.length}`,
          `Paid/received value: ${money(spent)}`,
        ],
        headers: ["PO", "Supplier", "Product", "Qty", "Amount", "Status"],
        widths: [85, 110, 120, 50, 70, 70],
        rows: pos.map((p) => [
          p.poNumber,
          p.supplier.businessName,
          p.productName,
          String(p.quantity),
          money(p.totalAmount),
          p.status,
        ]),
      };
    }
    case "audit": {
      const logs = await prisma.auditLog.findMany({
        where: { createdAt },
        orderBy: { createdAt: "desc" },
        take: 250,
      });
      return {
        summary: [`Audit events: ${logs.length}`],
        headers: ["When", "Actor", "Action", "Entity", "Details"],
        widths: [85, 90, 90, 80, 155],
        rows: logs.map((l) => [
          l.createdAt.toLocaleString(),
          l.actorName || "System",
          l.action,
          l.entity,
          (l.details || "").slice(0, 60),
        ]),
      };
    }
    default:
      return { summary: [], headers: [], rows: [], widths: [] };
  }
}
