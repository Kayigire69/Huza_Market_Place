import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/rbac-server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

async function requireAdmin() {
  return requireAdminSession({ modules: ["inventory"] });
}

export async function GET(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode") || "stock";
  const filter = searchParams.get("filter") || "all";
  const q = searchParams.get("q")?.trim() || "";
  const productId = searchParams.get("productId") || undefined;

  if (mode === "movements") {
    const movements = await prisma.stockMovement.findMany({
      where: productId ? { productId } : undefined,
      include: {
        product: { select: { id: true, nameEn: true, unit: true, stockQty: true } },
      },
      orderBy: { createdAt: "desc" },
      take: productId ? 50 : 60,
    });
    return NextResponse.json({ movements });
  }

  if (mode === "expiring") {
    const now = new Date();
    const in7 = new Date();
    in7.setDate(in7.getDate() + 7);
    const batches = await prisma.stockBatch.findMany({
      where: {
        quantity: { gt: 0 },
        expiryDate: { not: null, lte: in7 },
      },
      include: {
        product: {
          select: {
            id: true,
            nameEn: true,
            unit: true,
            category: { select: { nameEn: true, slug: true } },
          },
        },
      },
      orderBy: { expiryDate: "asc" },
      take: 100,
    });
    return NextResponse.json({
      batches: batches.map((b) => ({
        id: b.id,
        batchNumber: b.batchNumber,
        quantity: b.quantity,
        expiryDate: b.expiryDate,
        expired: b.expiryDate ? b.expiryDate < now : false,
        product: b.product,
      })),
    });
  }

  const search: Prisma.ProductWhereInput = q
    ? {
        OR: [
          { nameEn: { contains: q, mode: "insensitive" } },
          { nameFr: { contains: q, mode: "insensitive" } },
          { nameRw: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  const products = await prisma.product.findMany({
    where: { deletedAt: null, ...search },
    include: {
      category: { select: { nameEn: true } },
    },
    orderBy: { nameEn: "asc" },
    take: 200,
  });

  const filtered = products.filter((p) => {
    const available = Math.max(0, p.stockQty - p.reservedQty);
    const min = p.lowStockAt ?? 5;
    if (filter === "out") return available <= 0;
    if (filter === "low") return available > 0 && available <= min;
    return true;
  });

  return NextResponse.json({ products: filtered });
}
