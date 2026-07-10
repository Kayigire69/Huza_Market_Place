import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const promo = await prisma.promotion.create({
    data: {
      code: body.code || null,
      titleEn: body.titleEn,
      titleFr: body.titleFr || body.titleEn,
      titleRw: body.titleRw || body.titleEn,
      discountPct: body.discountPct,
      freeDelivery: Boolean(body.freeDelivery),
      isFlashSale: Boolean(body.isFlashSale),
      isActive: true,
    },
  });
  return NextResponse.json(promo);
}
