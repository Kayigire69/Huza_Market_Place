/**
 * Replace Seedlings category products with the four catalog seedlings.
 * Safe to run on an existing database (soft-deletes old seedlings first).
 */
import { PrismaClient, UnitType } from "@prisma/client";
import { CATALOG_PRODUCTS } from "../prisma/catalog-data";

const prisma = new PrismaClient();

const DELIVERY_DISTRICTS = ["Gasabo", "Kicukiro", "Nyarugenge", "Kamonyi", "Bugesera"];

async function main() {
  const category = await prisma.category.findFirst({
    where: { slug: "fruit-seedlings", deletedAt: null },
  });
  if (!category) {
    throw new Error("fruit-seedlings category not found");
  }

  const company =
    (await prisma.supplier.findFirst({
      where: { businessName: "Youth Huza", status: "APPROVED" },
      orderBy: { createdAt: "asc" },
    })) ??
    (await prisma.supplier.findFirst({
      where: { phone: { in: ["0780000099", "0780000001"] } },
    }));

  if (!company) {
    throw new Error("Youth Huza supplier not found");
  }

  const seedlings = CATALOG_PRODUCTS.filter((p) => p.category === "fruit-seedlings");
  if (seedlings.length !== 4) {
    throw new Error(`Expected 4 seedlings, found ${seedlings.length}`);
  }

  const retired = await prisma.product.updateMany({
    where: { categoryId: category.id, deletedAt: null },
    data: { deletedAt: new Date(), isActive: false },
  });
  console.log(`Retired ${retired.count} existing seedling product(s).`);

  for (const p of seedlings) {
    const product = await prisma.product.create({
      data: {
        supplierId: company.id,
        categoryId: category.id,
        nameEn: p.nameEn,
        nameFr: p.nameFr,
        nameRw: p.nameRw,
        descriptionEn: p.descriptionEn,
        descriptionFr: p.descriptionFr,
        descriptionRw: p.descriptionRw,
        price: p.price,
        purchasePrice: Math.round(p.price * 0.65),
        unit: UnitType[p.unit],
        stockQty: p.stockQty,
        isOrganic: Boolean(p.isOrganic),
        isFeatured: Boolean(p.isFeatured),
        isBestSeller: Boolean(p.isBestSeller),
        isNewArrival: Boolean(p.isNewArrival),
        originDistrict: p.originDistrict,
        location: p.originDistrict,
        keywords: p.keywords,
        reviewStatus: "APPROVED",
        reviewedAt: new Date(),
        isActive: true,
        availableDistricts: DELIVERY_DISTRICTS,
        nutritionalInfo:
          "Per 100g (approx): Energy, vitamins, and minerals vary by produce. Store cool and consume fresh.",
        images: {
          create: [
            {
              url: p.image,
              alt: p.nameEn,
              sortOrder: 0,
              kind: "STOREFRONT",
              isCover: true,
            },
          ],
        },
        stockLogs: {
          create: {
            change: p.stockQty,
            reason: "Seedlings catalog sync",
          },
        },
      },
    });
    console.log(`Created ${p.nameEn} (${product.id})`);
  }

  await prisma.category.update({
    where: { id: category.id },
    data: { imageUrl: "/images/catalog/avocado-seedlings.jpg" },
  });

  console.log("Seedlings category sync complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
