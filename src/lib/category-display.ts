import { prisma } from "@/lib/prisma";

function isPhotoUrl(url: string): boolean {
  if (!url || url === "/logo.svg") return false;
  if (url.startsWith("/uploads/") || url.startsWith("http://") || url.startsWith("https://")) {
    return true;
  }
  const lower = url.toLowerCase();
  return (
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".png") ||
    lower.endsWith(".webp") ||
    lower.endsWith(".avif")
  );
}

/**
 * When a category has no uploaded image, use a storefront product cover from
 * that category so newly created admin categories show a real photo on the shop.
 */
export async function attachCategoryProductCovers<
  T extends { id: string; imageUrl?: string | null },
>(categories: T[]): Promise<(T & { productCoverUrl: string | null })[]> {
  if (categories.length === 0) return [];

  const needCover = categories.filter((c) => !(c.imageUrl && isPhotoUrl(c.imageUrl)));
  const coverByCategory = new Map<string, string>();

  if (needCover.length > 0) {
    const products = await prisma.product.findMany({
      where: {
        categoryId: { in: needCover.map((c) => c.id) },
        isActive: true,
        deletedAt: null,
        images: { some: { kind: "STOREFRONT" } },
      },
      select: {
        categoryId: true,
        images: {
          where: { kind: "STOREFRONT" },
          orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
          take: 1,
          select: { url: true },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 200,
    });

    for (const p of products) {
      const url = p.images[0]?.url;
      if (!url || coverByCategory.has(p.categoryId)) continue;
      if (isPhotoUrl(url)) coverByCategory.set(p.categoryId, url);
    }
  }

  return categories.map((c) => ({
    ...c,
    productCoverUrl: coverByCategory.get(c.id) || null,
  }));
}
