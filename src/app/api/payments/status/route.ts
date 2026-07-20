import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { paymentService } from "@/services/payment.service";
import { canAccessOrder } from "@/lib/security-access";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { isAdminPortalRole, canMutateCustomerPayments } from "@/lib/rbac";

/** GET /api/payments/status?orderId=... or ?orderNumber=... (&phone= for guests) */
export async function GET(req: Request) {
  const rl = await rateLimit({
    key: `paystatus:${clientIp(req)}`,
    limit: 60,
    windowMs: 60_000,
  });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("orderId") || undefined;
  const orderNumber = searchParams.get("orderNumber") || undefined;
  const phone = searchParams.get("phone");
  const token = searchParams.get("token");

  const order = await paymentService.getStatus({ orderId, orderNumber });
  if (!order?.payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  const allowed = await canAccessOrder(order, {
    req,
    orderNumber: order.orderNumber,
    phone,
    token,
  });

  // Public poll (checkout waiting screen): status only. No phones / PII
  if (!allowed) {
    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.orderNumber,
      orderStatus: order.status,
      paymentStatus: order.payment.status,
      amount: order.payment.amount,
      method: order.payment.method,
      message: order.payment.providerMessage,
      verifiedAt: order.payment.verifiedAt,
    });
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
 * - action: "fail". Cancel pending payment (owner phone or session required)
 * - action: "confirm". ADMIN / SUPER_ADMIN only
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { orderId, orderNumber, action, phone } = body as {
    orderId?: string;
    orderNumber?: string;
    action?: "confirm" | "fail";
    phone?: string;
  };

  if (action !== "confirm" && action !== "fail") {
    return NextResponse.json({ error: "action must be confirm or fail" }, { status: 400 });
  }

  const order = await paymentService.getStatus({ orderId, orderNumber });
  if (!order?.payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  if (action === "confirm") {
    const session = await getServerSession(authOptions);
    if (!canMutateCustomerPayments(session?.user?.role)) {
      return NextResponse.json(
        {
          error:
            "Payment can only be confirmed by the payment system or Finance/Admin.",
        },
        { status: 403 }
      );
    }
    const payment = await paymentService.confirmPayment(order.payment.id);
    return NextResponse.json({
      paymentStatus: payment?.status,
      message: "Payment approved. Paid to Youth Huza.",
    });
  }

  if (action === "fail") {
    if (order.payment.status !== "PENDING") {
      return NextResponse.json(
        { error: "This payment is no longer pending.", paymentStatus: order.payment.status },
        { status: 409 }
      );
    }

    const session = await getServerSession(authOptions);
    const isFinanceStaff = canMutateCustomerPayments(session?.user?.role);
    const isOtherStaff =
      Boolean(session?.user?.role && isAdminPortalRole(session.user.role)) &&
      !isFinanceStaff;
    if (isOtherStaff) {
      return NextResponse.json(
        { error: "Only Finance or Admin can cancel payments from the portal." },
        { status: 403 }
      );
    }
    const allowed =
      isFinanceStaff ||
      (await canAccessOrder(order, {
        req,
        orderNumber: order.orderNumber,
        phone: phone || undefined,
      }));

    if (!allowed) {
      return NextResponse.json(
        { error: "Provide the order phone number to cancel this payment." },
        { status: 403 }
      );
    }

    await paymentService.failPayment(order.payment.id, "Payment cancelled by customer");
    return NextResponse.json({
      paymentStatus: "FAILED",
      message: "Payment request cancelled.",
    });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
