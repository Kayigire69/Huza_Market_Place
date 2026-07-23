/**
 * Safe restore of storefront catalog products.
 * Usage: npx tsx scripts/restore-storefront-catalog.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { restoreStorefrontCatalog } from "../src/services/catalog-restore.service";

const prisma = new PrismaClient();

async function main() {
  const result = await restoreStorefrontCatalog(prisma);
  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
