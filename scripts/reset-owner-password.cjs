/**
 * Reset the primary Super Admin to the known login password.
 *
 * Usage (from project root):
 *   node scripts/reset-owner-password.cjs
 *
 * Sign in with:
 *   owner@huza.rw / Huza@2026!
 *
 * Password change is optional later (account / security settings).
 */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const EMAIL = "owner@huza.rw";
const PASSWORD = "Huza@2026!";

async function main() {
  const prisma = new PrismaClient();
  try {
    const passwordHash = await bcrypt.hash(PASSWORD, 10);
    const user = await prisma.user.upsert({
      where: { email: EMAIL },
      update: {
        passwordHash,
        mustChangePassword: false,
        isActive: true,
        deletedAt: null,
        role: "SUPER_ADMIN",
        isPrimarySuperAdmin: true,
        totpEnabled: false,
        totpSecret: null,
        passwordChangedAt: new Date(),
      },
      create: {
        email: EMAIL,
        phone: "0780000000",
        passwordHash,
        fullName: "YOUTH HUZA Owner",
        role: "SUPER_ADMIN",
        mustChangePassword: false,
        isPrimarySuperAdmin: true,
      },
    });

    console.log("Owner Super Admin reset.");
    console.log(`  Email:    ${user.email}`);
    console.log(`  Password: ${PASSWORD}`);
    console.log("  Forced password change is OFF — you can change it later if you want.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
