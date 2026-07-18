import { prisma } from "@/lib/prisma";

/**
 * Resolve the supplier profile owned by this user only.
 * Never falls back to a random APPROVED farm (prevents staff cross-farm access).
 */
export async function findSupplierForUser(userId: string) {
  return prisma.supplier.findUnique({ where: { userId } });
}

export async function findSupplierIdForUser(userId: string): Promise<string | null> {
  const supplier = await findSupplierForUser(userId);
  return supplier?.id ?? null;
}
