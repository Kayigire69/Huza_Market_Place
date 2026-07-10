import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ReviewType } from "@prisma/client";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { productId, orderId, type, rating, comment, photoUrl } = await req.json();
  const reviewType = (type as ReviewType) || ReviewType.PRODUCT;

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
  }
  if (reviewType === ReviewType.PRODUCT && !productId) {
    return NextResponse.json({ error: "Product required" }, { status: 400 });
  }

  const review = await prisma.review.create({
    data: {
      userId: session.user.id,
      productId: productId || null,
      orderId: orderId || null,
      type: reviewType,
      rating: Number(rating),
      comment: comment || null,
      photoUrl: photoUrl || null,
    },
  });

  if (productId && reviewType === ReviewType.PRODUCT) {
    const agg = await prisma.review.aggregate({
      where: { productId, type: ReviewType.PRODUCT, isHidden: false },
      _avg: { rating: true },
      _count: true,
    });
    await prisma.product.update({
      where: { id: productId },
      data: { ratingAvg: agg._avg.rating ?? 0, ratingCount: agg._count },
    });
  }

  return NextResponse.json(review);
}
