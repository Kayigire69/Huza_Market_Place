import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";

export type PdfLine = {
  text: string;
  options?: PDFKit.Mixins.TextOptions & { continued?: boolean };
};

export type ReportPreparer = {
  name: string;
  email: string;
  role: string;
};

/** Build a PDF document into a Buffer for Next.js Response. */
export function renderPdf(
  draw: (doc: PDFKit.PDFDocument) => void,
  options?: PDFKit.PDFDocumentOptions
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 48,
      bufferPages: true,
      info: {
        Author: "Youth Huza",
        Creator: "HUZA FRESH",
        ...options?.info,
      },
      ...options,
    });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    try {
      draw(doc);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

export function pdfResponse(buffer: Buffer, filename: string) {
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

export const BRAND = {
  green: "#0b5c34",
  mint: "#e7f6ec",
  muted: "#5a7264",
  ink: "#14261c",
  line: "#cfe6d7",
};

const LOGO_PDF_PATH = path.join(process.cwd(), "public", "logo-pdf.png");

function contentWidth(doc: PDFKit.PDFDocument) {
  return doc.page.width - doc.page.margins.left - doc.page.margins.right;
}

/** Legacy text-only brand header (invoices / receipts). */
export function drawBrandHeader(doc: PDFKit.PDFDocument, subtitle: string) {
  doc
    .fillColor(BRAND.green)
    .font("Helvetica-Bold")
    .fontSize(20)
    .text("HUZA FRESH", { continued: false });
  doc
    .fillColor(BRAND.muted)
    .font("Helvetica")
    .fontSize(9)
    .text("POWERED BY YOUTH HUZA", { characterSpacing: 1.2 });
  doc.moveDown(0.3);
  doc
    .fillColor(BRAND.green)
    .font("Helvetica-Bold")
    .fontSize(14)
    .text(subtitle);
  doc
    .moveTo(doc.page.margins.left, doc.y + 6)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y + 6)
    .strokeColor(BRAND.line)
    .stroke();
  doc.moveDown(1.2);
}

/**
 * Report cover header matching the SmartVoice / LOLC feedback report layout:
 * logo + company name, then report title.
 */
export function drawHuzaReportHeader(
  doc: PDFKit.PDFDocument,
  title: string,
  options?: { companyLine?: string; tagline?: string }
) {
  const left = doc.page.margins.left;
  const top = 40;
  const company = options?.companyLine ?? "YOUTH HUZA";
  const tagline = options?.tagline ?? "HUZA FRESH · Fresh produce marketplace";

  if (fs.existsSync(LOGO_PDF_PATH)) {
    doc.image(LOGO_PDF_PATH, left, top, { width: 44, height: 44 });
  }

  const textX = left + 56;
  doc
    .fillColor(BRAND.green)
    .font("Helvetica-Bold")
    .fontSize(14)
    .text(company, textX, top + 4, { width: contentWidth(doc) - 56 });
  doc
    .fillColor(BRAND.muted)
    .font("Helvetica")
    .fontSize(9)
    .text(tagline, textX, top + 24, { width: contentWidth(doc) - 56 });

  doc.y = top + 58;
  doc
    .fillColor(BRAND.ink)
    .font("Helvetica-Bold")
    .fontSize(16)
    .text(title, left, doc.y, { width: contentWidth(doc) });

  const ruleY = doc.y + 8;
  doc
    .moveTo(left, ruleY)
    .lineTo(doc.page.width - doc.page.margins.right, ruleY)
    .strokeColor(BRAND.green)
    .lineWidth(1.5)
    .stroke()
    .lineWidth(1);
  doc.y = ruleY + 14;
}

export function drawReportPeriod(
  doc: PDFKit.PDFDocument,
  start: Date,
  end: Date
) {
  const left = doc.page.margins.left;
  doc
    .fillColor(BRAND.muted)
    .font("Helvetica-Bold")
    .fontSize(9)
    .text("REPORT PERIOD", left, doc.y, { characterSpacing: 0.8 });
  doc.moveDown(0.35);
  doc
    .fillColor(BRAND.ink)
    .font("Helvetica")
    .fontSize(11)
    .text(
      `${start.toLocaleDateString("en-GB")}  —  ${end.toLocaleDateString("en-GB")}`,
      left,
      doc.y
    );
  doc.moveDown(0.9);
}

export function drawSectionTitle(doc: PDFKit.PDFDocument, title: string) {
  doc
    .fillColor(BRAND.ink)
    .font("Helvetica-Bold")
    .fontSize(11)
    .text(title, doc.page.margins.left, doc.y);
  doc.moveDown(0.5);
}

/**
 * Prepared by (employee) + Approved by / Signed by Manager — side by side.
 */
export function drawSignatureBlocks(
  doc: PDFKit.PDFDocument,
  preparedBy: ReportPreparer,
  options?: { managerTitle?: string }
) {
  const left = doc.page.margins.left;
  const width = contentWidth(doc);
  const colGap = 28;
  const colW = (width - colGap) / 2;
  const managerTitle = options?.managerTitle ?? "Manager";
  const today = new Date().toLocaleDateString("en-GB");

  // Keep signatures on one page when possible (leave room for footer)
  if (doc.y > doc.page.height - 190) {
    doc.addPage();
    doc.y = doc.page.margins.top;
  }

  doc.moveDown(1.2);
  const blockTop = doc.y;

  // PREPARED BY (left)
  doc
    .fillColor(BRAND.ink)
    .font("Helvetica-Bold")
    .fontSize(10)
    .text("PREPARED BY", left, blockTop, { width: colW });
  doc
    .moveTo(left, blockTop + 28)
    .lineTo(left + colW - 8, blockTop + 28)
    .strokeColor(BRAND.ink)
    .stroke();
  doc
    .fillColor(BRAND.muted)
    .font("Helvetica")
    .fontSize(8)
    .text("Signature", left, blockTop + 32, { width: colW });
  doc
    .fillColor(BRAND.ink)
    .font("Helvetica")
    .fontSize(10)
    .text(preparedBy.name || "—", left, blockTop + 48, { width: colW });
  doc
    .fillColor(BRAND.muted)
    .fontSize(9)
    .text(roleLabel(preparedBy.role), left, blockTop + 62, { width: colW });
  doc
    .fillColor(BRAND.ink)
    .fontSize(9)
    .text(`Date: ${today}`, left, blockTop + 78, { width: colW });

  // APPROVED BY / Signed by Manager (right)
  const right = left + colW + colGap;
  doc
    .fillColor(BRAND.ink)
    .font("Helvetica-Bold")
    .fontSize(10)
    .text("APPROVED BY", right, blockTop, { width: colW });
  doc
    .fillColor(BRAND.muted)
    .font("Helvetica")
    .fontSize(8)
    .text("Signed by Manager", right, blockTop + 14, { width: colW });
  doc
    .moveTo(right, blockTop + 28)
    .lineTo(right + colW - 8, blockTop + 28)
    .strokeColor(BRAND.ink)
    .stroke();
  doc
    .fillColor(BRAND.muted)
    .fontSize(8)
    .text("Signature", right, blockTop + 32, { width: colW });
  doc
    .fillColor(BRAND.ink)
    .fontSize(10)
    .text(managerTitle, right, blockTop + 48, { width: colW });
  doc
    .fillColor(BRAND.muted)
    .fontSize(9)
    .text("Manager · Youth Huza", right, blockTop + 62, { width: colW });
  doc
    .fillColor(BRAND.ink)
    .fontSize(9)
    .text("Date: _______________________", right, blockTop + 78, { width: colW });

  doc.y = blockTop + 110;
}

function roleLabel(role: string) {
  const map: Record<string, string> = {
    SUPER_ADMIN: "Administrator",
    ADMIN: "Administrator",
    STAFF: "Employee",
    MANAGER: "Manager",
  };
  return map[role] || role || "Employee";
}

/** Footer: Generated on · Generated by · © year · Confidential (all pages). */
export function drawConfidentialFooter(
  doc: PDFKit.PDFDocument,
  generatedByEmail: string,
  options?: { company?: string }
) {
  const company = options?.company ?? "Youth Huza";
  const year = new Date().getFullYear();
  const generatedOn = new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const line = `Generated on: ${generatedOn}  |  Generated by: ${generatedByEmail || "system"}  |  © ${year} ${company}. Confidential.`;
  const range = doc.bufferedPageRange();
  const bottom = doc.page.height - 28;
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    const savedBottom = doc.page.margins.bottom;
    // Draw inside the margin band without PDFKit auto-adding a page
    doc.page.margins.bottom = 0;
    doc
      .fontSize(7.5)
      .fillColor(BRAND.muted)
      .font("Helvetica")
      .text(line, doc.page.margins.left, bottom, {
        width: contentWidth(doc),
        align: "center",
        lineBreak: false,
      });
    doc.page.margins.bottom = savedBottom;
  }
}

export function drawFooter(doc: PDFKit.PDFDocument, note: string) {
  const bottom = doc.page.height - 36;
  doc
    .fontSize(8)
    .fillColor(BRAND.muted)
    .text(note, doc.page.margins.left, bottom, {
      width: contentWidth(doc),
      align: "center",
    });
}
