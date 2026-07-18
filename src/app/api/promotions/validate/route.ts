import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/rate-limit";

/** Validate a promo code without applying it yet — future-proof for checkout coupons */
export async function POST(req: Request) {
  const ip = clientIp(req);
  const rl = await rateLimit({ key: `promo:${ip}`, limit: 30, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  }

  const body = await req.json();
  const code = String(body.code || "")
    .trim()
    .toUpperCase();
  if (!code) {
    return NextResponse.json({ error: "Enter a promo code" }, { status: 400 });
  }

  const promo = await prisma.promotion.findFirst({
    where: {
      code,
      isActive: true,
      OR: [{ startsAt: null }, { startsAt: { lte: new Date() } }],
    },
  });

  if (!promo) {
    return NextResponse.json({ valid: false, error: "Invalid or expired code" }, { status: 404 });
  }
  if (promo.endsAt && promo.endsAt < new Date()) {
    return NextResponse.json({ valid: false, error: "This code has expired" }, { status: 400 });
  }

  // Schema field is isLoyalty; API still exposes isRedeem for checkout clients
  const isRedeem = Boolean(promo.isLoyalty && promo.loyaltyPoints);

  if (isRedeem && promo.loyaltyPoints) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { valid: false, error: "Log in to redeem loyalty rewards", isRedeem: true },
        { status: 401 }
      );
    }
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { loyaltyPoints: true },
    });
    if (!user || user.loyaltyPoints < promo.loyaltyPoints) {
      return NextResponse.json(
        {
          valid: false,
          error: `Need ${promo.loyaltyPoints} loyalty points to use this reward`,
          isRedeem: true,
          loyaltyPointsRequired: promo.loyaltyPoints,
        },
        { status: 400 }
      );
    }
  }

  return NextResponse.json({
    valid: true,
    code: promo.code,
    discountPct: promo.discountPct,
    discountAmt: promo.discountAmt,
    freeDelivery: promo.freeDelivery,
    title: promo.titleEn,
    isRedeem,
    loyaltyPointsRequired: isRedeem ? promo.loyaltyPoints : null,
  });
}
