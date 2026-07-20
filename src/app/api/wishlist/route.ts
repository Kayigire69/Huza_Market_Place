import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { productCardSelect } from "@/repositories/product.repository";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ items: [] });

  const items = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    include: {
      product: { select: productCardSelect },
    },
    orderBy: { createdAt: "desc" },
    take: 48,
  });

  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const productId =
    body && typeof body === "object" ? String((body as { productId?: string }).productId || "").trim() : "";
  if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 });

  const product = await prisma.product.findFirst({
    where: { id: productId, deletedAt: null, isActive: true },
    select: { id: true },
  });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  await prisma.favorite.upsert({
    where: { userId_productId: { userId: session.user.id, productId } },
    create: { userId: session.user.id, productId },
    update: {},
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const productId =
    body && typeof body === "object" ? String((body as { productId?: string }).productId || "").trim() : "";
  if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 });

  await prisma.favorite.deleteMany({
    where: { userId: session.user.id, productId },
  });
  return NextResponse.json({ ok: true });
}
