import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SupplierStatus } from "@prisma/client";
import { writeAuditLog } from "@/lib/audit";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") return null;
  return session;
}

export async function PATCH(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id, action, reason } = await req.json();

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
    },
  });

  await prisma.notification.create({
    data: {
      userId: supplier.userId,
      type: "SUPPLIER_STATUS",
      channel: "IN_APP",
      title: `Supplier ${action}`,
      body: `Your supplier account is now ${status}.`,
    },
  });

  await writeAuditLog({
    actorId: session.user.id,
    actorName: session.user.name,
    action: `supplier.${action}`,
    entity: "Supplier",
    entityId: id,
    details: reason || `Status set to ${status}`,
  });

  return NextResponse.json(supplier);
}
