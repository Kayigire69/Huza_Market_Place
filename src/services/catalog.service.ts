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
 */
export const catalogService = {
  async getHomeCatalog(): Promise<HomeCatalog> {
    const cached = await cacheGet<HomeCatalog>(CacheKeys.homeCatalog);
    if (cached) return cached;

    const [lists, categories, promotions, testimonials, status] = await Promise.all([
      productRepository.findHomeLists(16),
      prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.promotion.findMany({ where: { isActive: true }, take: 3 }),
      prisma.testimonial.findMany({ where: { isFeatured: true }, take: 3 }),
      getBusinessStatus(),
    ]);

    const payload: HomeCatalog = {
      ...lists,
      categories,
      promotions,
      testimonials,
      isOpen: status.isOpen,
    };

    await cacheSet(CacheKeys.homeCatalog, payload, 60);
    await cacheSet(CacheKeys.bestSellers, lists.bestSellers, 60);
    return payload;
  },

  async getBestSellers() {
    const cached = await cacheGet(CacheKeys.bestSellers);
    if (cached) return cached;
    const { bestSellers } = await productRepository.findHomeLists(8);
    await cacheSet(CacheKeys.bestSellers, bestSellers, 60);
    return bestSellers;
  },
};
