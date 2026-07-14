import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { productCardSelect } from "@/repositories/product.repository";
import { resolveProductImage } from "@/lib/catalog-images";

/** GET /api/products/recent?ids=id1,id2 — live catalog rows in the given order. */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ids = (searchParams.get("ids") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12);

  if (ids.length === 0) {
    return NextResponse.json({ products: [] });
  }

  const rows = await prisma.product.findMany({
    where: {
      id: { in: ids },
      isActive: true,
      deletedAt: null,
    },
    select: productCardSelect,
  });

  const byId = new Map(rows.map((p) => [p.id, p]));
  const products = ids
    .map((id) => byId.get(id))
    .filter((p): p is (typeof rows)[number] => Boolean(p))
    .map((p) => ({
      id: p.id,
      nameEn: p.nameEn,
      nameFr: p.nameFr,
      nameRw: p.nameRw,
      price: p.price,
      unit: p.unit,
      stockQty: p.stockQty,
      reservedQty: p.reservedQty,
      lowStockAt: p.lowStockAt,
      isOrganic: p.isOrganic,
      ratingAvg: p.ratingAvg,
      availableDistricts: p.availableDistricts,
      originDistrict: p.originDistrict,
      nutritionalInfo: p.nutritionalInfo,
      reviewStatus: p.reviewStatus,
      reviewedAt: p.reviewedAt,
      harvestDate: p.harvestDate,
      images: p.images,
      imageUrl: resolveProductImage(p.nameEn, p.images),
      category: p.category,
    }));

  return NextResponse.json({ products });
}
