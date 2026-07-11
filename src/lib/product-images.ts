/** Shared Prisma include/filter for customer-facing product images only */
export const storefrontImagesInclude = {
  where: { kind: "STOREFRONT" as const },
  orderBy: [{ isCover: "desc" as const }, { sortOrder: "asc" as const }],
};

export const allProductImagesInclude = {
  orderBy: [{ kind: "asc" as const }, { isCover: "desc" as const }, { sortOrder: "asc" as const }],
};
