import { NextResponse } from "next/server";
import { paymentService } from "@/services/payment.service";
import { processDueJobs } from "@/jobs/processors";

/** GET /api/payments/status?orderId=... or ?orderNumber=... */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("orderId") || undefined;
  const orderNumber = searchParams.get("orderNumber") || undefined;

  // Opportunistically drain a few background jobs (payment verify, SMS, etc.)
  void processDueJobs(3).catch(() => null);

  const order = await paymentService.getStatus({ orderId, orderNumber });
  if (!order?.payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  const payment = order.payment;
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

  const order = await paymentService.getStatus({ orderId, orderNumber });
  if (!order?.payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  if (action === "confirm") {
    const payment = await paymentService.confirmPayment(order.payment.id);
    return NextResponse.json({
      paymentStatus: payment?.status,
      message: "Payment approved. Paid to Youth Huza.",
    });
  }

  if (action === "fail") {
    await paymentService.failPayment(order.payment.id, "Payment declined or timed out on phone");
    return NextResponse.json({
      paymentStatus: "FAILED",
      message: "Payment was not approved on the phone.",
    });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
