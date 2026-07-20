/** Shared Prisma include/filter for customer-facing product images only.
 * Official HUZA STOREFRONT images only. Never farmer INSPECTION photos.
 */
export const storefrontImagesInclude = {
  where: { kind: "STOREFRONT" as const },
  orderBy: [{ isCover: "desc" as const }, { sortOrder: "asc" as const }],
};

export const allProductImagesInclude = {
  orderBy: [{ kind: "asc" as const }, { isCover: "desc" as const }, { sortOrder: "asc" as const }],
};

/** Priority: official STOREFRONT → catalog placeholder mapping (in resolveProductImage). Farmer INSPECTION never public. */
export const PUBLIC_IMAGE_POLICY = {
  storefrontKind: "STOREFRONT" as const,
  inspectionKind: "INSPECTION" as const,
  farmerPhotosPublic: false,
} as const;
