import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PaymentStatus } from "@prisma/client";

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, action } = await req.json();
  const payment = await prisma.payment.update({
    where: { id },
    data:
      action === "confirm"
        ? { status: PaymentStatus.CONFIRMED, verifiedAt: new Date() }
        : action === "refund"
          ? {
              status: PaymentStatus.REFUNDED,
              refundedAt: new Date(),
              refundReason: "Admin refund",
            }
          : { status: PaymentStatus.VERIFIED, verifiedAt: new Date() },
  });

  return NextResponse.json(payment);
}
