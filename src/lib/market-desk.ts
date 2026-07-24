import { prisma } from "@/lib/prisma";
import { AvailabilityStatus, SupplierStatus } from "@prisma/client";

export const MARKET_DESK_NAME = "HUZA Market Desk";
const MARKET_DESK_EMAIL = "market-desk@huza.internal";

export const YOUTH_HUZA_CATALOG_NAME = "Youth Huza";
const YOUTH_HUZA_CATALOG_EMAIL = "catalog@youthhuza.rw";
const YOUTH_HUZA_CATALOG_PHONE = "0780000099";

/**
 * Internal supplier used when market purchases are stocked into catalog products.
 * Keeps Product.supplierId required without mixing market buys into farmer accounts.
 */
export async function ensureMarketDeskSupplier() {
  const existing = await prisma.supplier.findFirst({
    where: { businessName: MARKET_DESK_NAME },
    select: { id: true, userId: true, businessName: true },
  });
  if (existing) return existing;

  const user =
    (await prisma.user.findFirst({
      where: { email: MARKET_DESK_EMAIL },
      select: { id: true },
    })) ||
    (await prisma.user.create({
      data: {
        email: MARKET_DESK_EMAIL,
        fullName: MARKET_DESK_NAME,
        phone: "huza-market-desk",
        role: "SUPPLIER",
        passwordHash: "!market-desk-no-login!",
        isActive: false,
        mustChangePassword: false,
      },
      select: { id: true },
    }));

  return prisma.supplier.create({
    data: {
      userId: user.id,
      businessName: MARKET_DESK_NAME,
      location: "Kigali",
      district: "Nyarugenge",
      phone: "huza-market-desk",
      status: SupplierStatus.APPROVED,
      availability: AvailabilityStatus.CLOSED,
      isVerified: true,
      verificationBadge: "INTERNAL",
      adminNotes: "System account for open-market / wholesale purchases. Do not approve as a farmer.",
      agreedToHuzaTerms: true,
      agreedToHuzaTermsAt: new Date(),
    },
    select: { id: true, userId: true, businessName: true },
  });
}

/**
 * Company retail owner for admin-created HUZA FRESH catalog products.
 * Creates or reactivates the Youth Huza supplier so Add Product never blocks admins.
 */
export async function ensureYouthHuzaCatalogSupplier() {
  const select = { id: true, userId: true, businessName: true, status: true } as const;

  const byName = await prisma.supplier.findFirst({
    where: { businessName: YOUTH_HUZA_CATALOG_NAME },
    select,
    orderBy: { createdAt: "asc" },
  });
  if (byName) {
    if (byName.status !== SupplierStatus.APPROVED) {
      return prisma.supplier.update({
        where: { id: byName.id },
        data: {
          status: SupplierStatus.APPROVED,
          isVerified: true,
          approvedAt: new Date(),
          availability: AvailabilityStatus.OPEN,
        },
        select: { id: true, userId: true, businessName: true },
      });
    }
    return { id: byName.id, userId: byName.userId, businessName: byName.businessName };
  }

  const byPhone = await prisma.supplier.findFirst({
    where: { phone: YOUTH_HUZA_CATALOG_PHONE },
    select,
    orderBy: { createdAt: "asc" },
  });
  if (byPhone) {
    return prisma.supplier.update({
      where: { id: byPhone.id },
      data: {
        businessName: YOUTH_HUZA_CATALOG_NAME,
        status: SupplierStatus.APPROVED,
        isVerified: true,
        approvedAt: new Date(),
        availability: AvailabilityStatus.OPEN,
      },
      select: { id: true, userId: true, businessName: true },
    });
  }

  const huzaLike = await prisma.supplier.findFirst({
    where: {
      status: SupplierStatus.APPROVED,
      businessName: { contains: "Huza", mode: "insensitive" },
    },
    select: { id: true, userId: true, businessName: true },
    orderBy: { createdAt: "asc" },
  });
  if (huzaLike) return huzaLike;

  const user =
    (await prisma.user.findFirst({
      where: { email: YOUTH_HUZA_CATALOG_EMAIL },
      select: { id: true },
    })) ||
    (await prisma.user.create({
      data: {
        email: YOUTH_HUZA_CATALOG_EMAIL,
        fullName: YOUTH_HUZA_CATALOG_NAME,
        phone: YOUTH_HUZA_CATALOG_PHONE,
        role: "SUPPLIER",
        passwordHash: "!youth-huza-catalog-no-login!",
        isActive: false,
        mustChangePassword: false,
      },
      select: { id: true },
    }));

  const existingForUser = await prisma.supplier.findUnique({
    where: { userId: user.id },
    select,
  });
  if (existingForUser) {
    return prisma.supplier.update({
      where: { id: existingForUser.id },
      data: {
        businessName: YOUTH_HUZA_CATALOG_NAME,
        status: SupplierStatus.APPROVED,
        isVerified: true,
        approvedAt: new Date(),
        availability: AvailabilityStatus.OPEN,
      },
      select: { id: true, userId: true, businessName: true },
    });
  }

  return prisma.supplier.create({
    data: {
      userId: user.id,
      businessName: YOUTH_HUZA_CATALOG_NAME,
      description: "Company catalogue for HUZA FRESH — products Youth Huza sells after buying/preparing.",
      location: "Kigali",
      district: "Gasabo",
      phone: YOUTH_HUZA_CATALOG_PHONE,
      status: SupplierStatus.APPROVED,
      availability: AvailabilityStatus.OPEN,
      approvedAt: new Date(),
      isVerified: true,
      verificationBadge: "Youth Huza",
      adminNotes: "System catalog owner for admin-created shop products. Not a farmer account.",
      agreedToHuzaTerms: true,
      agreedToHuzaTermsAt: new Date(),
    },
    select: { id: true, userId: true, businessName: true },
  });
}

export function marketPurchaseNumber() {
  const n = Date.now().toString(36).toUpperCase();
  return `MP-${n.slice(-8)}`;
}
