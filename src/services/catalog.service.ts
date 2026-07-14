import { prisma } from "@/lib/prisma";
import { productRepository } from "@/repositories/product.repository";
import { getBusinessStatus } from "@/lib/business-hours";
import { cacheGet, cacheSet, CacheKeys } from "@/lib/redis";

type HomeCatalog = Awaited<ReturnType<typeof productRepository.findHomeLists>> & {
  categories: Awaited<ReturnType<typeof prisma.category.findMany>>;
  promotions: Awaited<ReturnType<typeof prisma.promotion.findMany>>;
  testimonials: Awaited<ReturnType<typeof prisma.testimonial.findMany>>;
  isOpen: boolean;
};

/**
 * Homepage / bestsellers catalog with Redis caching when available.
 * Special offers come from admin-posted Promotion rows (not hardcoded).
 */
export const catalogService = {
  async getHomeCatalog(): Promise<HomeCatalog> {
    const cached = await cacheGet<HomeCatalog>(CacheKeys.homeCatalog);
    if (cached) return cached;

    const now = new Date();
    const [lists, promotions, testimonials, status] = await Promise.all([
      productRepository.findHomeLists(4),
      prisma.promotion.findMany({
        where: {
          isActive: true,
          AND: [
            { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
            { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
          ],
        },
        orderBy: [{ isFlashSale: "desc" }, { createdAt: "desc" }],
        take: 6,
      }),
      prisma.testimonial.findMany({ where: { isFeatured: true }, take: 3 }),
      getBusinessStatus(),
    ]);

    const payload: HomeCatalog = {
      ...lists,
      categories: lists.categoryPreviews.map((c) => c.category),
      promotions,
      testimonials,
      isOpen: status.isOpen,
    };

    await cacheSet(CacheKeys.homeCatalog, payload, 90);
    await cacheSet(CacheKeys.bestSellers, lists.bestSellers, 90);
    return payload;
  },

  async getBestSellers() {
    const cached = await cacheGet(CacheKeys.bestSellers);
    if (cached) return cached;
    const { bestSellers } = await productRepository.findHomeLists(4);
    await cacheSet(CacheKeys.bestSellers, bestSellers, 60);
    return bestSellers;
  },
};
