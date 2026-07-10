import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { disburseToSeller } from "@/lib/payments/mobile-money";
import { OrderStatus, PaymentStatus } from "@prisma/client";

/**
 * MTN MoMo collection callback.
 * Configure MTN_MOMO_CALLBACK_URL to https://your-domain/api/payments/callback/mtn
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const externalId =
      body.externalId ||
      body["external-id"] ||
      req.headers.get("x-reference-id") ||
      body.referenceId;
    const status = String(body.status || body.financialTransactionId ? "SUCCESSFUL" : "PENDING").toUpperCase();

    if (!externalId) {
      return NextResponse.json({ error: "Missing reference" }, { status: 400 });
    }

    const payment = await prisma.payment.findFirst({
      where: { OR: [{ externalId }, { transactionRef: externalId }] },
      include: { order: true },
    });

    if (!payment) {
      return NextResponse.json({ ok: true, note: "Unknown payment" });
    }

    if (status === "SUCCESSFUL" || status === "SUCCESS") {
      await disburseToSeller({
        method: payment.method,
        payeePhone: payment.payeePhone || payment.phoneNumber,
        amount: payment.amount,
        orderNumber: payment.order.orderNumber,
        externalId: payment.externalId || payment.id,
      });

      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.CONFIRMED,
          verifiedAt: new Date(),
          providerMessage: "Customer approved on phone. Paid to seller.",
        },
      });

      await prisma.order.update({
        where: { id: payment.orderId },
        data: {
          status: OrderStatus.CONFIRMED,
          statusLog: {
            create: {
              status: OrderStatus.CONFIRMED,
              note: "MTN MoMo callback — payment confirmed",
            },
          },
          delivery: { update: { status: OrderStatus.READY_FOR_PICKUP } },
        },
      });
    } else if (status === "FAILED" || status === "REJECTED") {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.FAILED,
          providerMessage: "Customer declined or payment failed",
        },
      });
      await prisma.order.update({
        where: { id: payment.orderId },
        data: {
          status: OrderStatus.CANCELLED,
          statusLog: {
            create: { status: OrderStatus.CANCELLED, note: "MoMo payment failed/declined" },
          },
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Callback failed" }, { status: 500 });
  }
}
