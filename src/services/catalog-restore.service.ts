/**
 * Add the official HUZA catalog products to the shop as active listings.
 * Creates new rows when missing; updates existing non-deleted matches.
 * Does not bulk-undelete unrelated soft-deleted products.
 */
import { PrismaClient, UnitType } from "@prisma/client";
import { CATALOG_CATEGORIES, CATALOG_PRODUCTS } from "../../prisma/catalog-data";
import { PRODUCT_IMAGE_BY_NAME_EN } from "@/lib/catalog-images";
import { cacheDel, CacheKeys } from "@/lib/redis";

const DELIVERY_DISTRICTS = ["Gasabo", "Kicukiro", "Nyarugenge", "Kamonyi", "Bugesera"];

export type CatalogPublishResult = {
  beforeShopVisible: number;
  afterShopVisible: number;
  created: number;
  updated: number;
  imagesAdded: number;
  products: string[];
};

function imageFor(nameEn: string, fallback?: string | null): string {
  return PRODUCT_IMAGE_BY_NAME_EN[nameEn] || fallback || "/images/catalog/bananas.jpg";
}

async function shopVisibleCount(prisma: PrismaClient) {
  return prisma.product.count({
    where: {
      deletedAt: null,
      isActive: true,
      images: { some: { kind: "STOREFRONT" } },
    },
  });
}

async function resolveCompanySupplierId(prisma: PrismaClient): Promise<string> {
  const company =
    (await prisma.supplier.findFirst({
      where: { businessName: "Youth Huza", status: "APPROVED" },
      orderBy: { createdAt: "asc" },
    })) ??
    (await prisma.supplier.findFirst({
      where: { phone: { in: ["0780000099", "0780000001"] } },
    })) ??
    (await prisma.supplier.findFirst({
      where: { status: "APPROVED" },
      orderBy: { createdAt: "asc" },
    }));

  if (!company) {
    throw new Error("No approved supplier found to own catalog products");
  }
  return company.id;
}

async function ensureCategories(prisma: PrismaClient) {
  const bySlug = new Map<string, string>();
  for (const c of CATALOG_CATEGORIES) {
    const existing = await prisma.category.findFirst({
      where: { slug: c.slug, deletedAt: null },
      orderBy: { createdAt: "asc" },
    });
    if (existing) {
      await prisma.category.update({
        where: { id: existing.id },
        data: {
          isActive: true,
          nameEn: c.nameEn,
          nameFr: c.nameFr,
          nameRw: c.nameRw,
          sortOrder: c.sortOrder,
          imageUrl: existing.imageUrl || c.image,
        },
      });
      bySlug.set(c.slug, existing.id);
      continue;
    }

    const soft = await prisma.category.findFirst({
      where: { slug: c.slug },
      orderBy: { createdAt: "asc" },
    });
    if (soft) {
      await prisma.category.update({
        where: { id: soft.id },
        data: {
          deletedAt: null,
          isActive: true,
          nameEn: c.nameEn,
          nameFr: c.nameFr,
          nameRw: c.nameRw,
          sortOrder: c.sortOrder,
          imageUrl: soft.imageUrl || c.image,
        },
      });
      bySlug.set(c.slug, soft.id);
      continue;
    }

    const created = await prisma.category.create({
      data: {
        slug: c.slug,
        nameEn: c.nameEn,
        nameFr: c.nameFr,
        nameRw: c.nameRw,
        sortOrder: c.sortOrder,
        imageUrl: c.image,
        isActive: true,
      },
    });
    bySlug.set(c.slug, created.id);
  }
  return bySlug;
}

async function ensureStorefrontImage(
  prisma: PrismaClient,
  productId: string,
  nameEn: string,
  preferredUrl: string
): Promise<boolean> {
  const storefront = await prisma.productImage.findFirst({
    where: { productId, kind: "STOREFRONT" },
    orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
  });
  if (storefront?.url) {
    // Prefer real catalog photos over leftover SVGs when we know a JPG map.
    const mapped = PRODUCT_IMAGE_BY_NAME_EN[nameEn];
    if (mapped && storefront.url.endsWith(".svg") && mapped !== storefront.url) {
      await prisma.productImage.update({
        where: { id: storefront.id },
        data: { url: mapped, alt: nameEn, isCover: true },
      });
      return true;
    }
    return false;
  }

  await prisma.productImage.create({
    data: {
      productId,
      url: preferredUrl,
      alt: nameEn,
      sortOrder: 0,
      kind: "STOREFRONT",
      isCover: true,
    },
  });
  return true;
}

/**
 * Publish every official catalog product onto the storefront as a new/active listing.
 */
export async function publishOfficialCatalogProducts(
  prisma: PrismaClient
): Promise<CatalogPublishResult> {
  const beforeShopVisible = await shopVisibleCount(prisma);
  const categories = await ensureCategories(prisma);
  const supplierId = await resolveCompanySupplierId(prisma);

  let created = 0;
  let updated = 0;
  let imagesAdded = 0;
  const products: string[] = [];

  for (const seed of CATALOG_PRODUCTS) {
    const categoryId = categories.get(seed.category);
    if (!categoryId) {
      throw new Error(`Category missing for ${seed.nameEn}: ${seed.category}`);
    }

    const coverUrl = imageFor(seed.nameEn, seed.image);

    // Prefer an active row; otherwise create a brand-new product (ignore soft-deleted).
    const existing = await prisma.product.findFirst({
      where: {
        deletedAt: null,
        categoryId,
        nameEn: seed.nameEn,
      },
      orderBy: { updatedAt: "desc" },
    });

    let productId: string;

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          supplierId,
          categoryId,
          nameEn: seed.nameEn,
          nameFr: seed.nameFr,
          nameRw: seed.nameRw,
          descriptionEn: seed.descriptionEn,
          descriptionFr: seed.descriptionFr,
          descriptionRw: seed.descriptionRw,
          price: seed.price,
          purchasePrice: existing.purchasePrice ?? Math.round(seed.price * 0.65),
          unit: UnitType[seed.unit],
          stockQty: existing.stockQty > 0 ? existing.stockQty : seed.stockQty,
          isOrganic: Boolean(seed.isOrganic),
          isFeatured: Boolean(seed.isFeatured),
          isBestSeller: Boolean(seed.isBestSeller),
          isNewArrival: Boolean(seed.isNewArrival),
          originDistrict: seed.originDistrict,
          location: seed.originDistrict,
          keywords: `${seed.keywords} ${seed.slug}`.trim(),
          reviewStatus: "APPROVED",
          reviewedAt: new Date(),
          isActive: true,
          deletedAt: null,
          availableDistricts: DELIVERY_DISTRICTS,
        },
      });
      productId = existing.id;
      updated += 1;
    } else {
      const row = await prisma.product.create({
        data: {
          supplierId,
          categoryId,
          nameEn: seed.nameEn,
          nameFr: seed.nameFr,
          nameRw: seed.nameRw,
          descriptionEn: seed.descriptionEn,
          descriptionFr: seed.descriptionFr,
          descriptionRw: seed.descriptionRw,
          price: seed.price,
          purchasePrice: Math.round(seed.price * 0.65),
          unit: UnitType[seed.unit],
          stockQty: seed.stockQty,
          isOrganic: Boolean(seed.isOrganic),
          isFeatured: Boolean(seed.isFeatured),
          isBestSeller: Boolean(seed.isBestSeller),
          isNewArrival: Boolean(seed.isNewArrival),
          originDistrict: seed.originDistrict,
          location: seed.originDistrict,
          keywords: `${seed.keywords} ${seed.slug}`.trim(),
          reviewStatus: "APPROVED",
          reviewedAt: new Date(),
          isActive: true,
          deletedAt: null,
          availableDistricts: DELIVERY_DISTRICTS,
          nutritionalInfo:
            "Per 100g (approx): Energy, vitamins, and minerals vary by produce. Store cool and consume fresh.",
          stockLogs: {
            create: {
              change: seed.stockQty,
              reason: "Official catalog publish",
            },
          },
        },
      });
      productId = row.id;
      created += 1;
    }

    if (await ensureStorefrontImage(prisma, productId, seed.nameEn, coverUrl)) {
      imagesAdded += 1;
    }
    products.push(seed.nameEn);
  }

  await cacheDel(CacheKeys.homeCatalog);
  await cacheDel(CacheKeys.bestSellers);

  return {
    beforeShopVisible,
    afterShopVisible: await shopVisibleCount(prisma),
    created,
    updated,
    imagesAdded,
    products,
  };
}

/** @deprecated Use publishOfficialCatalogProducts */
export async function restoreStorefrontCatalog(prisma: PrismaClient) {
  const result = await publishOfficialCatalogProducts(prisma);
  return {
    before: {
      total: 0,
      softDeleted: 0,
      inactive: 0,
      shopVisible: result.beforeShopVisible,
    },
    after: {
      total: result.products.length,
      softDeleted: 0,
      inactive: 0,
      shopVisible: result.afterShopVisible,
    },
    undeleted: 0,
    reactivated: result.updated,
    imagesAdded: result.imagesAdded,
    catalogCreated: result.created,
    catalogUpdated: result.updated,
  };
}
