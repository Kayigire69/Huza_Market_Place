import { prisma } from "@/lib/prisma";
import { formatRwf } from "@/lib/utils";
import {
  BRAND,
  drawConfidentialFooter,
  drawHuzaReportHeader,
  drawReportPeriod,
  drawSectionTitle,
  drawSignatureBlocks,
  renderPdf,
  type ReportPreparer,
} from "@/lib/documents/pdf";
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

const DETAIL_TITLES: Record<ReportType, string> = {
  sales: "1. SALES & ORDERS DETAIL IN PERIOD",
  payments: "1. PAYMENTS DETAIL IN PERIOD",
  deliveries: "1. DELIVERY ACTIVITY DETAIL IN PERIOD",
  stock: "1. STOCK MOVEMENTS DETAIL IN PERIOD",
  farmers: "1. FARMER APPLICATIONS DETAIL IN PERIOD",
  procurement: "1. PROCUREMENT DETAIL IN PERIOD",
  audit: "1. ADMIN AUDIT DETAIL IN PERIOD",
};

const TOTAL_LABELS: Record<ReportType, string> = {
  sales: "Total orders in period",
  payments: "Total payments in period",
  deliveries: "Total deliveries in period",
  stock: "Total stock movements in period",
  farmers: "Total farmer applications in period",
  procurement: "Total purchase orders in period",
  audit: "Total audit events in period",
};

function drawTable(
  doc: PDFKit.PDFDocument,
  headers: string[],
  rows: string[][],
  widths: number[]
) {
  const left = doc.page.margins.left;
  const tableWidth = widths.reduce((a, b) => a + b, 0);
  const startY = doc.y;
  doc.rect(left, startY - 2, tableWidth, 16).fill(BRAND.mint);
  doc.fillColor(BRAND.ink).font("Helvetica-Bold").fontSize(8);
  let x = left;
  headers.forEach((h, i) => {
    doc.text(h, x + 2, startY + 1, { width: widths[i] - 4, ellipsis: true });
    x += widths[i];
  });
  doc.y = startY + 18;
  doc.font("Helvetica").fontSize(8);

  for (const row of rows) {
    // Leave room for footer on continued pages
    if (doc.y > doc.page.height - 72) {
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
      .lineTo(left + tableWidth, doc.y)
      .strokeColor(BRAND.line)
      .stroke();
    doc.moveDown(0.25);
  }
}

export async function buildActivityReportPdf(
  type: ReportType,
  from?: string | null,
  to?: string | null,
  preparedBy?: ReportPreparer | null
): Promise<{ buffer: Buffer; filename: string }> {
  const { start, end } = parseRange(from, to);
  const rangeLabel = `${start.toLocaleDateString("en-GB")} – ${end.toLocaleDateString("en-GB")}`;
  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `huza-${type}-report-${stamp}.pdf`;

  const preparer: ReportPreparer = {
    name: preparedBy?.name?.trim() || "Huza staff",
    email: preparedBy?.email?.trim() || "ops@huza.rw",
    role: preparedBy?.role || "STAFF",
  };

  const data = await fetchReportData(type, start, end);
  const numberedHeaders = ["#", ...data.headers];
  const numberedWidths = [28, ...data.widths];
  const numberedRows = data.rows.map((row, i) => [String(i + 1), ...row]);

  const pdf = await renderPdf(
    (doc) => {
      drawHuzaReportHeader(doc, REPORT_LABELS[type], {
        companyLine: "YOUTH HUZA",
        tagline: "HUZA FRESH · Fresh produce marketplace",
      });
      drawReportPeriod(doc, start, end);

      if (data.summary.length) {
        doc.fillColor(BRAND.ink).font("Helvetica").fontSize(9);
        for (const line of data.summary) {
          doc.text(line);
        }
        doc.moveDown(0.7);
      }

      drawSectionTitle(doc, DETAIL_TITLES[type]);

      if (numberedHeaders.length > 1 && numberedRows.length) {
        drawTable(doc, numberedHeaders, numberedRows, numberedWidths);
        doc.moveDown(0.6);
        doc
          .fillColor(BRAND.ink)
          .font("Helvetica-Bold")
          .fontSize(10)
          .text(`${TOTAL_LABELS[type]}  ${numberedRows.length}`);
        if (data.totalHighlight) {
          doc
            .font("Helvetica")
            .fontSize(9)
            .fillColor(BRAND.muted)
            .text(data.totalHighlight);
        }
      } else {
        doc.fillColor(BRAND.muted).font("Helvetica").fontSize(10).text("No records in this period.");
      }

      drawSignatureBlocks(doc, preparer);
      drawConfidentialFooter(doc, preparer.email, { company: "Youth Huza" });
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
  /** Optional money / KPI line under the count total */
  totalHighlight?: string;
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
        widths: [88, 72, 80, 65, 65, 80],
        totalHighlight: `Revenue (excl. cancelled/refunded): ${money(revenue)}`,
        rows: orders.map((o) => [
          o.orderNumber,
          o.createdAt.toLocaleDateString("en-GB"),
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
        widths: [88, 70, 80, 65, 70, 75],
        totalHighlight: `Confirmed/verified value: ${money(confirmedSum)}`,
        rows: payments.map((p) => [
          p.order.orderNumber,
          p.method,
          p.phoneNumber,
          money(p.amount),
          p.status,
          p.createdAt.toLocaleDateString("en-GB"),
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
        widths: [90, 90, 80, 110, 80],
        totalHighlight: `Delivered in period: ${delivered}`,
        rows: deliveries.map((d) => [
          d.order.orderNumber,
          d.order.deliveryZone,
          d.status,
          d.deliveryPerson?.fullName || "Unassigned",
          d.deliveredAt ? d.deliveredAt.toLocaleDateString("en-GB") : "—",
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
        widths: [70, 115, 60, 40, 105, 50],
        rows: movements.map((m) => [
          m.createdAt.toLocaleDateString("en-GB"),
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
        widths: [110, 90, 65, 70, 50, 70],
        rows: suppliers.map((s) => [
          s.businessName,
          s.user.fullName,
          s.farmingType || "—",
          s.status,
          String(s._count.products),
          s.createdAt.toLocaleDateString("en-GB"),
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
        headers: ["PO", "Farmer", "Product", "Qty", "Amount", "Status"],
        widths: [78, 95, 110, 40, 65, 65],
        totalHighlight: `Paid/received value: ${money(spent)}`,
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
        widths: [75, 80, 80, 70, 140],
        rows: logs.map((l) => [
          l.createdAt.toLocaleString("en-GB"),
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
