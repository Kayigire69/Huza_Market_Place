import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeMsisdn } from "@/lib/payments/mobile-money";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orderNumber = searchParams.get("orderNumber")?.trim();
  const phone = searchParams.get("phone")?.trim();

  if (!orderNumber || !phone) {
    return NextResponse.json({ error: "Order number and phone required" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      items: { include: { product: true } },
      payment: true,
      delivery: { include: { deliveryPerson: { select: { fullName: true, phone: true } } } },
      statusLog: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const guest = order.guestPhone ? normalizeMsisdn(order.guestPhone) : "";
  const payer = order.payment?.phoneNumber ? normalizeMsisdn(order.payment.phoneNumber) : "";
  const input = normalizeMsisdn(phone);

  if (guest !== input && payer !== input) {
    // Also allow logged-in user's phone match loosely via last 9 digits
    const last9 = (s: string) => s.slice(-9);
    if (last9(guest) !== last9(input) && last9(payer) !== last9(input)) {
      return NextResponse.json({ error: "Phone does not match this order" }, { status: 403 });
    }
  }

  return NextResponse.json(order);
}
