/**
 * One-time cleanup: remove invented "Kitchen" / "Sourcing Pool" suppliers.
 * Reassign their products to company supplier "Youth Huza".
 * Keep each demo farm on a single specialty crop.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  let company = await prisma.supplier.findFirst({
    where: { businessName: "Youth Huza", phone: "0780000001" },
  });

  if (!company) {
    const user = await prisma.user.upsert({
      where: { phone: "0780000001" },
      update: { fullName: "Youth Huza", email: "catalog@youthhuza.rw" },
      create: {
        phone: "0780000001",
        email: "catalog@youthhuza.rw",
        passwordHash: "$2a$10$placeholder",
        fullName: "Youth Huza",
        role: "SUPPLIER",
      },
    });
    company = await prisma.supplier.create({
      data: {
        userId: user.id,
        businessName: "Youth Huza",
        description: "Company catalogue for HUZA FRESH",
        location: "Kigali",
        district: "Gasabo",
        phone: "0780000001",
        status: "APPROVED",
        availability: "OPEN",
        isVerified: true,
        verificationBadge: "Youth Huza",
      },
    });
  }

  const invented = await prisma.supplier.findMany({
    where: {
      OR: [
        { businessName: "Youth Huza Kitchen" },
        { businessName: "Youth Huza Sourcing Pool" },
        { phone: { in: ["0781111888", "0781111777"] } },
      ],
    },
    include: { user: true },
  });

  for (const s of invented) {
    const moved = await prisma.product.updateMany({
      where: { supplierId: s.id },
      data: { supplierId: company.id },
    });
    console.log(`Moved ${moved.count} products from "${s.businessName}" → Youth Huza`);
    await prisma.supplier.delete({ where: { id: s.id } });
    await prisma.user.delete({ where: { id: s.userId } }).catch(() => null);
  }

  const specialties = [
    { phone: "0781111001", crop: "Fresh Tomatoes" },
    { phone: "0781111002", crop: "Irish Potatoes" },
    { phone: "0781111003", crop: "Sweet Bananas" },
  ];

  for (const row of specialties) {
    const farmer = await prisma.supplier.findFirst({ where: { phone: row.phone } });
    if (!farmer) continue;
    const specialty = await prisma.product.findFirst({ where: { nameEn: row.crop } });
    if (specialty) {
      await prisma.product.update({
        where: { id: specialty.id },
        data: { supplierId: farmer.id, stockQty: Math.max(specialty.stockQty, 800) },
      });
    }
    const moved = await prisma.product.updateMany({
      where: { supplierId: farmer.id, NOT: { nameEn: row.crop } },
      data: { supplierId: company.id },
    });
    console.log(`${row.phone}: kept ${row.crop}, moved ${moved.count} extras to Youth Huza`);
  }

  console.log("Done. Invented Kitchen/Sourcing partners removed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
