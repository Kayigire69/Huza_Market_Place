import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/rbac-server";
import { prisma } from "@/lib/prisma";

async function requirePhotoAdmin() {
  return requireAdminSession({ modules: ["photography", "approvals", "products"] });
}

/**
 * Products approved for sale but missing customer-facing STOREFRONT photos.
 * Farmers may upload inspection photos; Huza still needs website imagery.
 */
export async function GET() {
  const session = await requirePhotoAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const products = await prisma.product.findMany({
    where: {
      deletedAt: null,
      reviewStatus: "APPROVED",
      images: { none: { kind: "STOREFRONT" } },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
    select: {
      id: true,
      nameEn: true,
      price: true,
      unit: true,
      stockQty: true,
      reviewStatus: true,
      isActive: true,
      updatedAt: true,
      category: { select: { nameEn: true } },
      supplier: {
        select: {
          businessName: true,
          phone: true,
          user: { select: { fullName: true, phone: true } },
        },
      },
      images: {
        select: { id: true, url: true, kind: true, isCover: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  return NextResponse.json({
    products: products.map((p) => ({
      ...p,
      updatedAt: p.updatedAt.toISOString(),
    })),
    counts: { needingPhotos: products.length },
  });
}
