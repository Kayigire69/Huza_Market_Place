/**
 * Add official catalog products as new/active storefront listings.
 * Usage: npm run db:restore-catalog
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { publishOfficialCatalogProducts } from "../src/services/catalog-restore.service";

const prisma = new PrismaClient();

async function main() {
  const result = await publishOfficialCatalogProducts(prisma);
  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
