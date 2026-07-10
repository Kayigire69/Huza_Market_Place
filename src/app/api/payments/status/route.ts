import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkMtnPaymentStatus, disburseToSeller } from "@/lib/payments/mobile-money";
import { OrderStatus, PaymentStatus } from "@prisma/client";

async function confirmPayment(paymentId: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { order: true },
  });
  if (!payment) return null;
  if (payment.status === PaymentStatus.CONFIRMED) return payment;

  const disbursed = await disburseToSeller({
    method: payment.method,
    payeePhone: payment.payeePhone || payment.phoneNumber,
    amount: payment.amount,
    orderNumber: payment.order.orderNumber,
    externalId: payment.externalId || payment.id,
  });

  const updated = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: PaymentStatus.CONFIRMED,
      verifiedAt: new Date(),
      providerMessage: disbursed.message,
    },
  });

  await prisma.order.update({
    where: { id: payment.orderId },
    data: {
      status: payment.order.scheduledFor ? OrderStatus.PENDING : OrderStatus.CONFIRMED,
      statusLog: {
        create: {
          status: payment.order.scheduledFor ? OrderStatus.PENDING : OrderStatus.CONFIRMED,
          note: payment.order.scheduledFor
            ? "Payment confirmed — scheduled for next business day"
            : "Mobile money approved — payment confirmed to seller",
        },
      },
      delivery: {
        update: { status: OrderStatus.READY_FOR_PICKUP },
      },
    },
  });

  if (payment.order.userId) {
    await prisma.notification.create({
      data: {
        userId: payment.order.userId,
        type: "PAYMENT_CONFIRMATION",
        channel: "SMS",
        title: "Payment confirmed",
        body: `Payment of ${payment.amount} RWF for ${payment.order.orderNumber} confirmed. Sent to ${payment.payeeName || "seller"}.`,
      },
    });
  }

  return updated;
}

async function failPayment(paymentId: string, reason: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { order: { include: { items: true } } },
  });
  if (!payment || payment.status === PaymentStatus.CONFIRMED) return payment;

  await prisma.payment.update({
    where: { id: paymentId },
    data: { status: PaymentStatus.FAILED, providerMessage: reason },
  });

  await prisma.order.update({
    where: { id: payment.orderId },
    data: {
      status: OrderStatus.CANCELLED,
      statusLog: {
        create: { status: OrderStatus.CANCELLED, note: reason },
      },
    },
  });

  // Restore stock
  for (const item of payment.order.items) {
    await prisma.product.update({
      where: { id: item.productId },
      data: { stockQty: { increment: item.quantity } },
    });
    await prisma.stockHistory.create({
      data: {
        productId: item.productId,
        change: item.quantity,
        reason: `Payment failed — ${payment.order.orderNumber}`,
      },
    });
  }

  return payment;
}

/** GET /api/payments/status?orderId=... or ?orderNumber=... */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("orderId");
  const orderNumber = searchParams.get("orderNumber");

  const order = await prisma.order.findFirst({
    where: orderId ? { id: orderId } : { orderNumber: orderNumber || undefined },
    include: { payment: true },
  });

  if (!order?.payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  let payment = order.payment;

  // Live MTN: poll provider if still pending
  if (
    payment.status === PaymentStatus.PENDING &&
    payment.method === "MTN_MOMO" &&
    payment.externalId &&
    process.env.MTN_MOMO_SUBSCRIPTION_KEY
  ) {
    const providerStatus = await checkMtnPaymentStatus(payment.externalId);
    if (providerStatus === "SUCCESSFUL") {
      payment = (await confirmPayment(payment.id)) || payment;
    } else if (providerStatus === "FAILED") {
      await failPayment(payment.id, "Customer declined or payment failed on phone");
      payment = (await prisma.payment.findUnique({ where: { id: payment.id } })) || payment;
    }
  }

  return NextResponse.json({
    orderId: order.id,
    orderNumber: order.orderNumber,
    orderStatus: order.status,
    paymentStatus: payment.status,
    amount: payment.amount,
    method: payment.method,
    payerPhone: payment.phoneNumber,
    payeePhone: payment.payeePhone,
    payeeName: payment.payeeName,
    message: payment.providerMessage,
    verifiedAt: payment.verifiedAt,
  });
}

/**
 * POST /api/payments/status
 * - action: "confirm" — customer approved (demo) or admin force-confirm
 * - action: "fail" — declined / timeout
 */
export async function POST(req: Request) {
  const body = await req.json();
  const { orderId, orderNumber, action } = body as {
    orderId?: string;
    orderNumber?: string;
    action: "confirm" | "fail";
  };

  const order = await prisma.order.findFirst({
    where: orderId ? { id: orderId } : { orderNumber: orderNumber || undefined },
    include: { payment: true },
  });

  if (!order?.payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  if (action === "confirm") {
    const payment = await confirmPayment(order.payment.id);
    return NextResponse.json({
      paymentStatus: payment?.status,
      message: "Payment approved. Money sent to the seller.",
    });
  }

  if (action === "fail") {
    await failPayment(order.payment.id, "Payment declined or timed out on phone");
    return NextResponse.json({
      paymentStatus: "FAILED",
      message: "Payment was not approved on the phone.",
    });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
