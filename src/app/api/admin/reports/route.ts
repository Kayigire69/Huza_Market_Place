import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminPortalRole } from "@/lib/rbac";
import { auditAdminAction } from "@/lib/audit";
import {
  buildActivityReportPdf,
  isReportType,
  REPORT_LABELS,
  REPORT_TYPES,
} from "@/services/report.service";
import { pdfResponse } from "@/lib/documents/pdf";

/** List available report types */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isAdminPortalRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!type) {
    return NextResponse.json({
      reports: REPORT_TYPES.map((id) => ({ id, label: REPORT_LABELS[id] })),
    });
  }

  if (!isReportType(type)) {
    return NextResponse.json({ error: "Unknown report type" }, { status: 400 });
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
