import { prisma } from "@/lib/prisma";
import { AvailabilityStatus, SupplierStatus } from "@prisma/client";

export const MARKET_DESK_NAME = "HUZA Market Desk";
const MARKET_DESK_EMAIL = "market-desk@huza.internal";

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

export function marketPurchaseNumber() {
  const n = Date.now().toString(36).toUpperCase();
  return `MP-${n.slice(-8)}`;
}
