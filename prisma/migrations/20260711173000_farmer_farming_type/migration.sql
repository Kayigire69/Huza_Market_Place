-- Dual farmer registration paths
CREATE TYPE "FarmingType" AS ENUM ('ORGANIC', 'STANDARD');

ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "farmingType" "FarmingType" NOT NULL DEFAULT 'ORGANIC';
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "productsOffered" TEXT;
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "huzaPurchaseAgreement" TEXT;
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "agreedToHuzaTerms" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "agreedToHuzaTermsAt" TIMESTAMP(3);
