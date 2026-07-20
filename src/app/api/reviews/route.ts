import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ReviewType } from "@prisma/client";
import { cacheDel } from "@/lib/redis";

const REVIEW_TYPES = new Set<string>(Object.values(ReviewType));

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const productId = typeof body.productId === "string" ? body.productId.trim() : "";
  const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";
  const typeRaw = typeof body.type === "string" ? body.type : ReviewType.PRODUCT;
  const rating = Math.trunc(Number(body.rating));
  const comment = typeof body.comment === "string" ? body.comment.trim() : null;
  const photoUrl = typeof body.photoUrl === "string" ? body.photoUrl.trim() : null;

  if (!REVIEW_TYPES.has(typeRaw)) {
    return NextResponse.json({ error: "Invalid review type" }, { status: 400 });
  }
  const reviewType = typeRaw as ReviewType;

  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
  }
  if (reviewType === ReviewType.PRODUCT) {
    if (!productId) {
      return NextResponse.json({ error: "Product required" }, { status: 400 });
    }
    const exists = await prisma.product.findFirst({
      where: { id: productId, deletedAt: null },
      select: { id: true },
    });
    if (!exists) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
  }

  try {
    const review = await prisma.review.create({
      data: {
        userId: session.user.id,
        productId: productId || null,
        orderId: orderId || null,
        type: reviewType,
        rating,
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
      await cacheDel(`huza:product:detail:${productId}`);
    }

    return NextResponse.json(review);
  } catch (err) {
    console.error("[reviews] create failed", err);
    return NextResponse.json({ error: "Could not save review" }, { status: 400 });
  }
}
