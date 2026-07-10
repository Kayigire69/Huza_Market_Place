import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const product = await prisma.product.findUnique({
    where: { id },
    include: { supplier: true },
  });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (product.supplier.userId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const stockQty = Number(body.stockQty);
  const change = stockQty - product.stockQty;

  const updated = await prisma.product.update({
    where: { id },
    data: {
      ...(body.nameEn ? { nameEn: body.nameEn } : {}),
      ...(body.price !== undefined ? { price: Number(body.price) } : {}),
      ...(body.stockQty !== undefined ? { stockQty } : {}),
      ...(body.isActive !== undefined ? { isActive: Boolean(body.isActive) } : {}),
    },
  });

  if (body.stockQty !== undefined && change !== 0) {
    await prisma.stockHistory.create({
      data: { productId: id, change, reason: "Manual inventory update" },
    });
  }

  return NextResponse.json(updated);
}
