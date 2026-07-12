import { prisma } from "./prisma";

/** Products often purchased in the same order as the given product */
export async function getFrequentlyBoughtTogether(productId: string, take = 4) {
  const orderItems = await prisma.orderItem.findMany({
    where: { productId },
    select: { orderId: true },
    take: 100,
  });
  const orderIds = orderItems.map((o) => o.orderId);
  if (orderIds.length === 0) {
    return prisma.product.findMany({
      where: {
        isActive: true,
        isBestSeller: true,
        id: { not: productId },
        images: { some: { kind: "STOREFRONT" } },
      },
      include: {
        images: {
          where: { kind: "STOREFRONT" },
          orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
        },
        supplier: true,
        category: true,
      },
      take,
    });
  }

  const companions = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: {
      orderId: { in: orderIds },
      productId: { not: productId },
    },
    _count: { productId: true },
    orderBy: { _count: { productId: "desc" } },
    take,
  });

  const ids = companions.map((c) => c.productId);
  if (ids.length === 0) {
    return prisma.product.findMany({
      where: {
        isActive: true,
        id: { not: productId },
        images: { some: { kind: "STOREFRONT" } },
      },
      include: {
        images: {
          where: { kind: "STOREFRONT" },
          orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
        },
        supplier: true,
        category: true,
      },
      take,
    });
  }

  const products = await prisma.product.findMany({
    where: { id: { in: ids }, isActive: true, images: { some: { kind: "STOREFRONT" } } },
    include: {
      images: {
        where: { kind: "STOREFRONT" },
        orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
      },
      supplier: true,
      category: true,
    },
  });

  return ids
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is (typeof products)[number] => Boolean(p));
}

/** Smart recommendations: same category + high rating + best sellers */
export async function getSmartRecommendations(opts: {
  productId?: string;
  categoryId?: string;
  take?: number;
}) {
  const take = opts.take ?? 8;
  const exclude = opts.productId ? { id: { not: opts.productId } } : {};

  const sameCategory = opts.categoryId
    ? await prisma.product.findMany({
        where: {
          isActive: true,
          categoryId: opts.categoryId,
          images: { some: { kind: "STOREFRONT" } },
          ...exclude,
        },
        include: {
          images: {
            where: { kind: "STOREFRONT" },
            orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
          },
          supplier: true,
          category: true,
        },
        orderBy: [{ ratingAvg: "desc" }, { isBestSeller: "desc" }],
        take,
      })
    : [];

  if (sameCategory.length >= take) return sameCategory;

  const more = await prisma.product.findMany({
    where: {
      isActive: true,
      images: { some: { kind: "STOREFRONT" } },
      OR: [{ isBestSeller: true }, { isFeatured: true }],
      ...(opts.productId
        ? { id: { notIn: [opts.productId, ...sameCategory.map((p) => p.id)] } }
        : {}),
    },
    include: {
      images: {
        where: { kind: "STOREFRONT" },
        orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
      },
      supplier: true,
      category: true,
    },
    orderBy: { ratingAvg: "desc" },
    take: take - sameCategory.length,
  });

  return [...sameCategory, ...more];
}

/** Lightweight search suggestions from products and categories (no supplier names for shoppers) */
export async function getSearchSuggestions(q: string, take = 8) {
  const query = q.trim();
  // Empty/short queries used to hit Postgres on every page load via the header search.
  if (query.length < 2) {
    return [];
  }

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { nameEn: { contains: query, mode: "insensitive" } },
          { nameFr: { contains: query, mode: "insensitive" } },
          { nameRw: { contains: query, mode: "insensitive" } },
        ],
      },
      select: { id: true, nameEn: true },
      take: 5,
    }),
    prisma.category.findMany({
      where: {
        OR: [
          { nameEn: { contains: query, mode: "insensitive" } },
          { nameFr: { contains: query, mode: "insensitive" } },
          { nameRw: { contains: query, mode: "insensitive" } },
        ],
      },
      select: { slug: true, nameEn: true },
      take: 3,
    }),
  ]);

  return [
    ...products.map((p) => ({
      type: "product" as const,
      id: p.id,
      label: p.nameEn,
      href: `/products/${p.id}`,
    })),
    ...categories.map((c) => ({
      type: "category" as const,
      id: c.slug,
      label: c.nameEn,
      href: `/products?category=${c.slug}`,
    })),
  ].slice(0, take);
}

export const RWANDA_DISTRICTS = [
  "Gasabo",
  "Kicukiro",
  "Nyarugenge",
  "Kamonyi",
  "Bugesera",
  "Musanze",
  "Rwamagana",
  "Huye",
  "Rubavu",
  "Kayonza",
] as const;
