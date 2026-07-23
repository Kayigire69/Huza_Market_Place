/**
 * Restore soft-deleted / hidden products and ensure STOREFRONT images so they
 * appear on the shop, Admin Products, and Inventory — without wiping orders.
 */
import { Prisma, PrismaClient, UnitType } from "@prisma/client";
import { CATALOG_CATEGORIES, CATALOG_PRODUCTS } from "../../prisma/catalog-data";
import { PRODUCT_IMAGE_BY_NAME_EN } from "@/lib/catalog-images";
import { cacheDel, CacheKeys } from "@/lib/redis";

const DELIVERY_DISTRICTS = ["Gasabo", "Kicukiro", "Nyarugenge", "Kamonyi", "Bugesera"];

export type CatalogRestoreResult = {
  before: {
    total: number;
    softDeleted: number;
    inactive: number;
    shopVisible: number;
  };
  after: {
    total: number;
    softDeleted: number;
    inactive: number;
    shopVisible: number;
  };
  undeleted: number;
  reactivated: number;
  imagesAdded: number;
  catalogCreated: number;
  catalogUpdated: number;
};

function imageFor(nameEn: string, fallback?: string | null): string {
  return PRODUCT_IMAGE_BY_NAME_EN[nameEn] || fallback || "/images/catalog/bananas.jpg";
}

async function counts(prisma: PrismaClient) {
  return {
    total: await prisma.product.count(),
    softDeleted: await prisma.product.count({ where: { deletedAt: { not: null } } }),
    inactive: await prisma.product.count({
      where: { deletedAt: null, isActive: false },
    }),
    shopVisible: await prisma.product.count({
      where: {
        deletedAt: null,
        isActive: true,
        images: { some: { kind: "STOREFRONT" } },
      },
    }),
  };
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
      where: { slug: c.slug },
      orderBy: { createdAt: "asc" },
    });
    if (existing) {
      await prisma.category.update({
        where: { id: existing.id },
        data: {
          deletedAt: null,
          isActive: true,
          nameEn: c.nameEn,
          nameFr: c.nameFr,
          nameRw: c.nameRw,
          sortOrder: c.sortOrder,
          imageUrl: existing.imageUrl || c.image,
        },
      });
      bySlug.set(c.slug, existing.id);
    } else {
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
  }
  return bySlug;
}

async function ensureStorefrontImage(
  prisma: PrismaClient,
  productId: string,
  nameEn: string,
  preferredUrl?: string | null
): Promise<boolean> {
  const storefront = await prisma.productImage.findFirst({
    where: { productId, kind: "STOREFRONT" },
    orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
  });
  if (storefront?.url) return false;

  const inspection = await prisma.productImage.findFirst({
    where: { productId, kind: "INSPECTION" },
    orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
  });
  const anyImage = await prisma.productImage.findFirst({
    where: { productId },
    orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
  });

  await prisma.productImage.create({
    data: {
      productId,
      url: imageFor(nameEn, preferredUrl || inspection?.url || anyImage?.url),
      alt: nameEn,
      sortOrder: 0,
      kind: "STOREFRONT",
      isCover: true,
    },
  });
  return true;
}

export async function restoreStorefrontCatalog(
  prisma: PrismaClient
): Promise<CatalogRestoreResult> {
  const before = await counts(prisma);
  const categories = await ensureCategories(prisma);
  const supplierId = await resolveCompanySupplierId(prisma);
  const catalogNames = CATALOG_PRODUCTS.map((p) => p.nameEn);

  // Bring soft-deleted rows back into Admin Products / Inventory (not shop yet).
  const undeleted = await prisma.product.updateMany({
    where: { deletedAt: { not: null } },
    data: { deletedAt: null },
  });

  // Shop-visible: previously approved, or official catalog names.
  const reactivated = await prisma.product.updateMany({
    where: {
      deletedAt: null,
      OR: [{ reviewStatus: "APPROVED" }, { nameEn: { in: catalogNames } }],
    },
    data: {
      isActive: true,
      reviewStatus: "APPROVED",
      reviewedAt: new Date(),
    },
  });

  const products = await prisma.product.findMany({
    where: { deletedAt: null },
    select: { id: true, nameEn: true },
  });

  let imagesAdded = 0;
  for (const p of products) {
    if (await ensureStorefrontImage(prisma, p.id, p.nameEn)) imagesAdded += 1;
  }

  let catalogCreated = 0;
  let catalogUpdated = 0;

  for (const seed of CATALOG_PRODUCTS) {
    const categoryId = categories.get(seed.category);
    if (!categoryId) continue;

    const existing = await prisma.product.findFirst({
      where: {
        OR: [{ nameEn: seed.nameEn }, { keywords: { contains: seed.slug } }],
        categoryId,
      },
      orderBy: { createdAt: "desc" },
    });

    const sharedData: Prisma.ProductUpdateInput = {
      supplier: { connect: { id: supplierId } },
      category: { connect: { id: categoryId } },
      nameEn: seed.nameEn,
      nameFr: seed.nameFr,
      nameRw: seed.nameRw,
      descriptionEn: seed.descriptionEn,
      descriptionFr: seed.descriptionFr,
      descriptionRw: seed.descriptionRw,
      price: seed.price,
      purchasePrice: Math.round(seed.price * 0.65),
      unit: UnitType[seed.unit],
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
    };

    let productId: string;
    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: sharedData,
      });
      productId = existing.id;
      catalogUpdated += 1;
    } else {
      const createdRow = await prisma.product.create({
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
              reason: "Storefront catalog restore",
            },
          },
        },
      });
      productId = createdRow.id;
      catalogCreated += 1;
    }

    if (
      await ensureStorefrontImage(
        prisma,
        productId,
        seed.nameEn,
        imageFor(seed.nameEn, seed.image)
      )
    ) {
      imagesAdded += 1;
    }
  }

  await cacheDel(CacheKeys.homeCatalog);
  await cacheDel(CacheKeys.bestSellers);

  const after = await counts(prisma);
  return {
    before,
    after,
    undeleted: undeleted.count,
    reactivated: reactivated.count,
    imagesAdded,
    catalogCreated,
    catalogUpdated,
  };
}
