import { prisma } from "@/lib/prisma";
import { productRepository } from "@/repositories/product.repository";
import { getBusinessStatus } from "@/lib/business-hours";
import { cacheGet, cacheSet, CacheKeys } from "@/lib/redis";

type HomeCatalog = Awaited<ReturnType<typeof productRepository.findHomeLists>> & {
  promotions: Awaited<ReturnType<typeof prisma.promotion.findMany>>;
  testimonials: Awaited<ReturnType<typeof prisma.testimonial.findMany>>;
  customerReviews: {
    id: string;
    rating: number;
    comment: string | null;
    user: { fullName: string };
    product: { nameEn: string } | null;
  }[];
  isOpen: boolean;
};

/**
 * Homepage catalog with Redis caching when available.
 */
export const catalogService = {
  async getHomeCatalog(): Promise<HomeCatalog> {
    const cached = await cacheGet<HomeCatalog>(CacheKeys.homeCatalog);
    if (
      cached?.popularNow &&
      cached?.readyToEat &&
      cached?.categories &&
      Array.isArray(cached.customerReviews)
    ) {
      return cached;
    }

    const now = new Date();
    // Cap concurrent Prisma work: home lists run sequentially inside findHomeLists;
    // keep the remaining reads in a small Promise.all (not nested 4+4).
    const lists = await productRepository.findHomeLists(8);
    const [promotions, testimonials, customerReviews, status] = await Promise.all([
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
      // Real customer reviews — admin-hidden and low ratings stay off the home page
      prisma.review.findMany({
        where: {
          isHidden: false,
          rating: { gte: 4 },
          comment: { not: null },
        },
        select: {
          id: true,
          rating: true,
          comment: true,
          user: { select: { fullName: true } },
          product: { select: { nameEn: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
      getBusinessStatus(),
    ]);

    const payload: HomeCatalog = {
      ...lists,
      promotions,
      testimonials,
      customerReviews,
      isOpen: status.isOpen,
    };

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
