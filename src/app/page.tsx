import { prisma } from "@/lib/prisma";
import { getBusinessStatus } from "@/lib/business-hours";
import { HomePage } from "./HomeClient";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [shopProducts, featured, bestSellers, freshToday, categories, promotions, testimonials, status] =
    await Promise.all([
      // All live products customers can buy (includes approved farmer photos)
      prisma.product.findMany({
        where: { isActive: true, stockQty: { gt: 0 } },
        include: { images: { orderBy: { sortOrder: "asc" } }, supplier: true, category: true },
        orderBy: [{ updatedAt: "desc" }],
        take: 16,
      }),
      prisma.product.findMany({
        where: { isActive: true, isFeatured: true, stockQty: { gt: 0 } },
        include: { images: { orderBy: { sortOrder: "asc" } }, supplier: true, category: true },
        take: 8,
      }),
      prisma.product.findMany({
        where: { isActive: true, isBestSeller: true, stockQty: { gt: 0 } },
        include: { images: { orderBy: { sortOrder: "asc" } }, supplier: true, category: true },
        take: 8,
      }),
      prisma.product.findMany({
        where: { isActive: true, isNewArrival: true, stockQty: { gt: 0 } },
        include: { images: { orderBy: { sortOrder: "asc" } }, supplier: true, category: true },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.promotion.findMany({ where: { isActive: true }, take: 3 }),
      prisma.testimonial.findMany({ where: { isFeatured: true }, take: 3 }),
      getBusinessStatus(),
    ]);

  // Hero mosaic: prefer featured, fall back to latest shop products so photos always show
  const heroProducts = (featured.length >= 4 ? featured : shopProducts).slice(0, 4);

  return (
    <HomePage
      heroProducts={heroProducts}
      shopProducts={shopProducts}
      featured={featured.length ? featured : shopProducts.slice(0, 8)}
      bestSellers={bestSellers}
      freshToday={freshToday.length ? freshToday : shopProducts.slice(0, 8)}
      categories={categories}
      promotions={promotions}
      testimonials={testimonials}
      isOpen={status.isOpen}
    />
  );
}
