import { prisma } from "@/lib/prisma";
import { getBusinessStatus } from "@/lib/business-hours";
import { HomePage } from "./HomeClient";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [featured, bestSellers, categories, promotions, testimonials, status] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      include: { images: true, supplier: true, category: true },
      take: 8,
    }),
    prisma.product.findMany({
      where: { isActive: true, isBestSeller: true },
      include: { images: true, supplier: true, category: true },
      take: 8,
    }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.promotion.findMany({ where: { isActive: true }, take: 3 }),
    prisma.testimonial.findMany({ where: { isFeatured: true }, take: 3 }),
    getBusinessStatus(),
  ]);

  return (
    <HomePage
      featured={featured}
      bestSellers={bestSellers}
      categories={categories}
      promotions={promotions}
      testimonials={testimonials}
      isOpen={status.isOpen}
    />
  );
}
