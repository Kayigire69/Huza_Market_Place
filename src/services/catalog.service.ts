import { prisma } from "@/lib/prisma";
import { productRepository } from "@/repositories/product.repository";
import { getBusinessStatus } from "@/lib/business-hours";
import { cacheGet, cacheSet, CacheKeys } from "@/lib/redis";

type HomeCatalog = Awaited<ReturnType<typeof productRepository.findHomeLists>> & {
  promotions: Awaited<ReturnType<typeof prisma.promotion.findMany>>;
  testimonials: Awaited<ReturnType<typeof prisma.testimonial.findMany>>;
  isOpen: boolean;
};

/**
 * Homepage catalog with Redis caching when available.
 * Phase B: categories + popular + ready-to-eat (no N× category product strips).
 */
export const catalogService = {
  async getHomeCatalog(): Promise<HomeCatalog> {
    const cached = await cacheGet<HomeCatalog>(CacheKeys.homeCatalog);
    // Guard against older cache payloads missing the Phase B rails
    if (cached?.popularNow && cached?.readyToEat && cached?.categories) {
      return cached;
    }

    const now = new Date();
    const [lists, promotions, testimonials, status] = await Promise.all([
      productRepository.findHomeLists(8),
      prisma.promotion.findMany({
        where: {
          isActive: true,
          AND: [
            { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
            { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
          ],
        },
        orderBy: [{ isFlashSale: "desc" }, { createdAt: "desc" }],
        take: 3,
      }),
      prisma.testimonial.findMany({ where: { isFeatured: true }, take: 3 }),
      getBusinessStatus(),
    ]);

    const payload: HomeCatalog = {
      ...lists,
      promotions,
      testimonials,
      isOpen: status.isOpen,
    };

    // Bump cache key shape via short TTL; old cached payloads without popularNow expire soon
    await cacheSet(CacheKeys.homeCatalog, payload, 90);
    await cacheSet(CacheKeys.bestSellers, lists.bestSellers, 90);
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
