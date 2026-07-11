import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminPortalRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PaymentStatus } from "@prisma/client";
import { auditAdminAction } from "@/lib/audit";

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isAdminPortalRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, action } = await req.json();
  const before = await prisma.payment.findUnique({
    where: { id },
    include: { order: { select: { orderNumber: true } } },
  });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const payment = await prisma.payment.update({
    where: { id },
    data:
      action === "confirm"
        ? { status: PaymentStatus.CONFIRMED, verifiedAt: new Date() }
        : action === "refund"
          ? {
              status: PaymentStatus.REFUNDED,
              refundedAt: new Date(),
              refundReason: `Admin refund by ${session.user.name || session.user.email}`,
            }
          : { status: PaymentStatus.VERIFIED, verifiedAt: new Date() },
    include: { order: { select: { orderNumber: true } } },
  });

  await auditAdminAction(req, session, {
    action: `payment.${action || "verify"}`,
    entity: "Payment",
    entityId: payment.id,
    details: `${payment.order.orderNumber}: ${before.status} → ${payment.status}`,
    before: { status: before.status, amount: before.amount },
    after: { status: payment.status, amount: payment.amount, refundReason: payment.refundReason },
  });

  return NextResponse.json(payment);
}
