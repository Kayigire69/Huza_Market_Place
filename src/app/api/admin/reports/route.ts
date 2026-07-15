import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/rbac-server";
import { auditAdminAction } from "@/lib/audit";
import {
  buildActivityReportCsv,
  buildActivityReportExcel,
  buildActivityReportPdf,
  getReportDataset,
  isReportType,
  REPORT_LABELS,
  REPORT_TYPES,
} from "@/services/report.service";
import { pdfResponse } from "@/lib/documents/pdf";

async function requireAdmin() {
  return requireAdminSession({ modules: ["reports"] });
}

export async function GET(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const format = (searchParams.get("format") || "pdf").toLowerCase();
  const preview = searchParams.get("preview") === "1";

  if (!type) {
    return NextResponse.json({
      reports: REPORT_TYPES.filter((id) => id !== "stock").map((id) => ({
        id,
        label: REPORT_LABELS[id],
      })),
    });
  }

  if (!isReportType(type)) {
    return NextResponse.json({ error: "Unknown report type" }, { status: 400 });
  }

  if (preview) {
    const { data, start, end, resolvedType } = await getReportDataset(type, from, to);
    return NextResponse.json({
      type: resolvedType,
      label: REPORT_LABELS[resolvedType],
      from: start.toISOString(),
      to: end.toISOString(),
      summary: data.summary,
      totalHighlight: data.totalHighlight,
      rowCount: data.rows.length,
      headers: data.headers,
      sampleRows: data.rows.slice(0, 8),
    });
  }

  if (format === "excel" || format === "xls") {
    const { buffer, filename, contentType } = await buildActivityReportExcel(type, from, to);
    await auditAdminAction(req, session, {
      action: "report.generate",
      entity: "Report",
      entityId: type,
      details: `Excel ${REPORT_LABELS[type]} (${from || "default"} → ${to || "now"}) by ${session.user.email}`,
    });
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  }

  if (format === "csv") {
    const { buffer, filename, contentType } = await buildActivityReportCsv(type, from, to);
    await auditAdminAction(req, session, {
      action: "report.generate",
      entity: "Report",
      entityId: type,
      details: `CSV ${REPORT_LABELS[type]} (${from || "default"} → ${to || "now"}) by ${session.user.email}`,
    });
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  }

  const { buffer, filename } = await buildActivityReportPdf(type, from, to, {
    name: session.user.name || "Huza staff",
    email: session.user.email || "ops@huza.rw",
    role: session.user.role || "STAFF",
  });

  await auditAdminAction(req, session, {
    action: "report.generate",
    entity: "Report",
    entityId: type,
    details: `PDF ${REPORT_LABELS[type]} (${from || "default"} → ${to || "now"}) prepared by ${session.user.email}`,
  });

  return pdfResponse(buffer, filename);
}
