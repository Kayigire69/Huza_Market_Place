import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminPortalRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { SupplierStatus } from "@prisma/client";
import { auditAdminAction } from "@/lib/audit";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isAdminPortalRole(session.user.role)) return null;
  return session;
}

export async function PATCH(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id, action, reason, adminNotes, inspectionScheduledAt } = await req.json();

  if (action === "request_info") {
    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        adminNotes: adminNotes || reason || "Please provide additional documents",
      },
    });
    await prisma.notification.create({
      data: {
        userId: supplier.userId,
        type: "SUPPLIER_STATUS",
        channel: "IN_APP",
        title: "Additional information requested",
        body: adminNotes || reason || "Please update your verification documents.",
      },
    });
    await auditAdminAction(req, session, {
      action: "supplier.request_info",
      entity: "Supplier",
      entityId: id,
      details: adminNotes || reason,
    });
    return NextResponse.json(supplier);
  }

  if (action === "schedule_inspection") {
    const when = inspectionScheduledAt ? new Date(inspectionScheduledAt) : new Date();
    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        inspectionScheduledAt: when,
        adminNotes: adminNotes || `Inspection scheduled for ${when.toISOString()}`,
      },
    });
    await prisma.notification.create({
      data: {
        userId: supplier.userId,
        type: "SUPPLIER_STATUS",
        channel: "IN_APP",
        title: "Farm inspection scheduled",
        body: `Youth Huza scheduled an inspection for ${when.toLocaleString()}.`,
      },
    });
    await auditAdminAction(req, session, {
      action: "supplier.schedule_inspection",
      entity: "Supplier",
      entityId: id,
      details: when.toISOString(),
    });
    return NextResponse.json(supplier);
  }

  const map: Record<string, SupplierStatus> = {
    approve: SupplierStatus.APPROVED,
    reject: SupplierStatus.REJECTED,
    suspend: SupplierStatus.SUSPENDED,
    remove: SupplierStatus.REMOVED,
  };

  const status = map[action];
  if (!status) return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  const supplier = await prisma.supplier.update({
    where: { id },
    data: {
      status,
      rejectionReason: action === "reject" ? reason || "Rejected" : null,
      approvedAt: action === "approve" ? new Date() : undefined,
      availability: action === "approve" ? "OPEN" : "CLOSED",
      isVerified: action === "approve",
      verificationBadge: action === "approve" ? "Youth Huza Verified" : null,
      adminNotes: adminNotes || undefined,
    },
  });

  await prisma.notification.create({
    data: {
      userId: supplier.userId,
      type: "SUPPLIER_STATUS",
      channel: "IN_APP",
      title: `Farmer ${action}`,
      body:
        action === "reject"
          ? `Your application was rejected: ${reason || "See admin notes"}`
          : `Your farmer account is now ${status}.`,
    },
  });

  await auditAdminAction(req, session, {
      action: `supplier.${action}`,
    entity: "Supplier",
    entityId: id,
    details: reason || `Status set to ${status}`,
  });

  return NextResponse.json(supplier);
}
