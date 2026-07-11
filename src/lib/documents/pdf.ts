import PDFDocument from "pdfkit";

export type PdfLine = {
  text: string;
  options?: PDFKit.Mixins.TextOptions & { continued?: boolean };
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

export function drawFooter(doc: PDFKit.PDFDocument, note: string) {
  const bottom = doc.page.height - 36;
  doc
    .fontSize(8)
    .fillColor(BRAND.muted)
    .text(note, doc.page.margins.left, bottom, {
      width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
      align: "center",
    });
}
