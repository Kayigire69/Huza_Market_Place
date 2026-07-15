import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/rbac-server";
import { prisma } from "@/lib/prisma";
import { OrderStatus, PaymentMethod, PaymentStatus } from "@prisma/client";
import { auditAdminAction } from "@/lib/audit";
import { paymentService } from "@/services/payment.service";

async function requireAdmin() {
  return requireAdminSession({ modules: ["payments"] });
}

const TAB_STATUS: Record<string, PaymentStatus[]> = {
  successful: ["CONFIRMED", "VERIFIED"],
  pending: ["PENDING"],
  failed: ["FAILED"],
  refunds: ["REFUNDED"],
};

const METHOD_LABEL: Record<string, string> = {
  MTN_MOMO: "MTN MoMo",
  AIRTEL_MONEY: "Airtel Money",
  CASH_ON_DELIVERY: "Cash on delivery",
  CARD: "Card",
};

export async function GET(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const tab = searchParams.get("tab") || "all";
  const method = searchParams.get("method") || "";
  const q = searchParams.get("q")?.trim() || "";
  const id = searchParams.get("id");
  const view = searchParams.get("view") || "";

  if (id) {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            total: true,
            status: true,
            deliveryAddress: true,
            guestName: true,
            guestPhone: true,
            user: { select: { fullName: true, phone: true, email: true } },
            returns: {
              orderBy: { createdAt: "desc" },
              take: 5,
              select: {
                id: true,
                reason: true,
                status: true,
                refundAmt: true,
                adminNote: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });
    if (!payment) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({
      payment: {
        ...payment,
        methodLabel: METHOD_LABEL[payment.method] || payment.method,
        amountMismatch: payment.order.total !== payment.amount,
      },
    });
  }

  /** Reconciliation: mismatches, missing refs, orphan pending older than 1h */
  if (view === "reconcile") {
    const [mismatches, missingRef, stuckPending, byMethod] = await Promise.all([
      prisma.payment.findMany({
        where: {
          status: { in: ["CONFIRMED", "VERIFIED"] },
        },
        include: {
          order: { select: { orderNumber: true, total: true, status: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
      prisma.payment.findMany({
        where: {
          status: { in: ["CONFIRMED", "VERIFIED", "PENDING"] },
          OR: [{ transactionRef: null }, { transactionRef: "" }],
        },
        include: {
          order: { select: { orderNumber: true, total: true } },
        },
        take: 50,
        orderBy: { createdAt: "desc" },
      }),
      prisma.payment.findMany({
        where: {
          status: "PENDING",
          createdAt: { lt: new Date(Date.now() - 60 * 60 * 1000) },
        },
        include: {
          order: { select: { orderNumber: true, total: true } },
        },
        take: 50,
        orderBy: { createdAt: "asc" },
      }),
      prisma.payment.groupBy({
        by: ["method", "status"],
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    const amountMismatches = mismatches
      .filter((p) => p.amount !== p.order.total)
      .map((p) => ({
        id: p.id,
        orderNumber: p.order.orderNumber,
        paymentAmount: p.amount,
        orderTotal: p.order.total,
        method: p.method,
        status: p.status,
        createdAt: p.createdAt,
      }));

    return NextResponse.json({
      reconcile: {
        amountMismatches,
        missingRef: missingRef.map((p) => ({
          id: p.id,
          orderNumber: p.order.orderNumber,
          amount: p.amount,
          method: p.method,
          status: p.status,
          createdAt: p.createdAt,
        })),
        stuckPending: stuckPending.map((p) => ({
          id: p.id,
          orderNumber: p.order.orderNumber,
          amount: p.amount,
          method: p.method,
          createdAt: p.createdAt,
        })),
        byMethod: byMethod.map((r) => ({
          method: r.method,
          methodLabel: METHOD_LABEL[r.method] || r.method,
          status: r.status,
          count: r._count,
          total: r._sum.amount || 0,
        })),
      },
    });
  }

  const statuses = TAB_STATUS[tab];
  const where: Record<string, unknown> = {};
  if (statuses) where.status = { in: statuses };
  if (method && Object.values(PaymentMethod).includes(method as PaymentMethod)) {
    where.method = method;
  }
  if (q) {
    where.OR = [
      { phoneNumber: { contains: q, mode: "insensitive" } },
      { transactionRef: { contains: q, mode: "insensitive" } },
      { externalId: { contains: q, mode: "insensitive" } },
      { providerMessage: { contains: q, mode: "insensitive" } },
      { order: { orderNumber: { contains: q, mode: "insensitive" } } },
      { order: { guestPhone: { contains: q, mode: "insensitive" } } },
      { order: { user: { phone: { contains: q, mode: "insensitive" } } } },
      { order: { user: { fullName: { contains: q, mode: "insensitive" } } } },
    ];
  }

  const [payments, counts, sumSuccessful, sumPending, sumFailed, sumRefunds, returnRequests] =
    await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              total: true,
              status: true,
              guestName: true,
              guestPhone: true,
              user: { select: { fullName: true, phone: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 120,
      }),
      Promise.all([
        prisma.payment.count(),
        prisma.payment.count({ where: { status: { in: TAB_STATUS.successful } } }),
        prisma.payment.count({ where: { status: { in: TAB_STATUS.pending } } }),
        prisma.payment.count({ where: { status: { in: TAB_STATUS.failed } } }),
        prisma.payment.count({ where: { status: { in: TAB_STATUS.refunds } } }),
      ]),
      prisma.payment.aggregate({
        where: { status: { in: TAB_STATUS.successful } },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { status: { in: TAB_STATUS.pending } },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { status: { in: TAB_STATUS.failed } },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { status: { in: TAB_STATUS.refunds } },
        _sum: { amount: true },
      }),
      tab === "refunds"
        ? prisma.returnRequest.findMany({
            where: { status: { in: ["PENDING", "APPROVED"] } },
            include: {
              order: {
                select: {
                  orderNumber: true,
                  total: true,
                  payment: { select: { id: true, status: true, amount: true } },
                },
              },
            },
            orderBy: { createdAt: "desc" },
            take: 40,
          })
        : Promise.resolve([]),
    ]);

  return NextResponse.json({
    payments: payments.map((p) => ({
      ...p,
      methodLabel: METHOD_LABEL[p.method] || p.method,
      amountMismatch: p.order.total !== p.amount,
      customerName: p.order.user?.fullName || p.order.guestName || "—",
      customerPhone: p.order.user?.phone || p.order.guestPhone || p.phoneNumber,
    })),
    counts: {
      all: counts[0],
      successful: counts[1],
      pending: counts[2],
      failed: counts[3],
      refunds: counts[4],
    },
    totals: {
      successful: sumSuccessful._sum.amount || 0,
      pending: sumPending._sum.amount || 0,
      failed: sumFailed._sum.amount || 0,
      refunds: sumRefunds._sum.amount || 0,
    },
    returnRequests,
    providers: {
      mtnConfigured: Boolean(process.env.MTN_MOMO_SUBSCRIPTION_KEY),
      airtelConfigured: Boolean(
        process.env.AIRTEL_CLIENT_ID && process.env.AIRTEL_CLIENT_SECRET
      ),
    },
  });
}

export async function PATCH(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { id, action, reason, transactionRef } = body as {
    id: string;
    action: string;
    reason?: string;
    transactionRef?: string;
  };

  const before = await prisma.payment.findUnique({
    where: { id },
    include: {
      order: { select: { id: true, orderNumber: true, userId: true, status: true } },
    },
  });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (action === "confirm") {
    try {
      const updated = await paymentService.confirmPayment(id);
      if (!updated) return NextResponse.json({ error: "Confirm failed" }, { status: 400 });
      await auditAdminAction(req, session, {
        action: "payment.confirm",
        entity: "Payment",
        entityId: id,
        details: `${before.order.orderNumber}: confirmed via admin`,
        before: { status: before.status },
        after: { status: updated.status },
      });
      return NextResponse.json(updated);
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Confirm failed" },
        { status: 500 }
      );
    }
  }

  if (action === "fail") {
    try {
      const failReason = reason || `Marked failed by ${session.user.name || session.user.email}`;
      const updated = await paymentService.failPayment(id, failReason);
      await auditAdminAction(req, session, {
        action: "payment.fail",
        entity: "Payment",
        entityId: id,
        details: `${before.order.orderNumber}: ${failReason}`,
        before: { status: before.status },
        after: { status: "FAILED" },
      });
      return NextResponse.json(updated);
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Fail failed" },
        { status: 500 }
      );
    }
  }

  if (action === "sync") {
    try {
      const result = await paymentService.verifyPendingPayment(id);
      await auditAdminAction(req, session, {
        action: "payment.sync",
        entity: "Payment",
        entityId: id,
        details: `${before.order.orderNumber}: provider → ${result.status}`,
      });
      const payment = await prisma.payment.findUnique({
        where: { id },
        include: { order: { select: { orderNumber: true, total: true } } },
      });
      return NextResponse.json({ result, payment });
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Sync failed" },
        { status: 500 }
      );
    }
  }

  if (action === "set_ref") {
    const payment = await prisma.payment.update({
      where: { id },
      data: { transactionRef: String(transactionRef || "").trim() || null },
      include: { order: { select: { orderNumber: true } } },
    });
    await auditAdminAction(req, session, {
      action: "payment.set_ref",
      entity: "Payment",
      entityId: id,
      details: `${payment.order.orderNumber}: ref=${payment.transactionRef}`,
    });
    return NextResponse.json(payment);
  }

  if (action === "refund") {
    const refundReason =
      reason || `Admin refund by ${session.user.name || session.user.email}`;
    const payment = await prisma.$transaction(async (tx) => {
      const p = await tx.payment.update({
        where: { id },
        data: {
          status: PaymentStatus.REFUNDED,
          refundedAt: new Date(),
          refundReason,
        },
        include: { order: { select: { orderNumber: true, userId: true } } },
      });
      await tx.order.update({
        where: { id: before.orderId },
        data: {
          status: OrderStatus.REFUNDED,
          statusLog: {
            create: {
              status: OrderStatus.REFUNDED,
              note: refundReason,
            },
          },
        },
      });
      return p;
    });

    if (payment.order.userId) {
      await prisma.notification.create({
        data: {
          userId: payment.order.userId,
          type: "PAYMENT_CONFIRMATION",
          channel: "IN_APP",
          title: "Refund processed",
          body: `Refund of ${payment.amount} RWF for ${payment.order.orderNumber}. ${refundReason}`,
        },
      });
    }

    await auditAdminAction(req, session, {
      action: "payment.refund",
      entity: "Payment",
      entityId: payment.id,
      details: `${payment.order.orderNumber}: ${before.status} → REFUNDED · ${refundReason}`,
      before: { status: before.status, amount: before.amount },
      after: {
        status: payment.status,
        amount: payment.amount,
        refundReason: payment.refundReason,
      },
    });

    return NextResponse.json(payment);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
