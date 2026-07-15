/**
 * Reset the primary Super Admin to the temporary setup password.
 *
 * Usage (from project root):
 *   node scripts/reset-owner-password.cjs
 *
 * Then sign in with:
 *   owner@huza.rw / Huza@2026!
 * and set a new password when prompted.
 */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const EMAIL = "owner@huza.rw";
const TEMP_PASSWORD = "Huza@2026!";

async function main() {
  const prisma = new PrismaClient();
  try {
    const passwordHash = await bcrypt.hash(TEMP_PASSWORD, 10);
    const user = await prisma.user.upsert({
      where: { email: EMAIL },
      update: {
        passwordHash,
        mustChangePassword: true,
        isActive: true,
        deletedAt: null,
        role: "SUPER_ADMIN",
        isPrimarySuperAdmin: true,
        totpEnabled: false,
        totpSecret: null,
        passwordChangedAt: null,
      },
      create: {
        email: EMAIL,
        phone: "0780000000",
        passwordHash,
        fullName: "YOUTH HUZA Owner",
        role: "SUPER_ADMIN",
        mustChangePassword: true,
        isPrimarySuperAdmin: true,
      },
    });

    console.log("Owner Super Admin reset.");
    console.log(`  Email:    ${user.email}`);
    console.log(`  Password: ${TEMP_PASSWORD}`);
    console.log("  Next: sign in, then set a new password on the forced change screen.");
    console.log("  After that you stay signed in — no need to log in again.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
