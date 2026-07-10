import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { productId, supplierId, rating, comment, photoUrl } = await req.json();
  if (!rating || (!productId && !supplierId)) {
    return NextResponse.json({ error: "Invalid review" }, { status: 400 });
  }

  const review = await prisma.review.create({
    data: {
      userId: session.user.id,
      productId: productId || null,
      supplierId: supplierId || null,
      rating: Number(rating),
      comment: comment || null,
      photoUrl: photoUrl || null,
    },
  });

  if (productId) {
    const agg = await prisma.review.aggregate({
      where: { productId, isHidden: false },
      _avg: { rating: true },
      _count: true,
    });
    await prisma.product.update({
      where: { id: productId },
      data: { ratingAvg: agg._avg.rating ?? 0, ratingCount: agg._count },
    });
  }

  if (supplierId) {
    const agg = await prisma.review.aggregate({
      where: { supplierId, isHidden: false },
      _avg: { rating: true },
      _count: true,
    });
    await prisma.supplier.update({
      where: { id: supplierId },
      data: { ratingAvg: agg._avg.rating ?? 0, ratingCount: agg._count },
    });
  }

  return NextResponse.json(review);
}
