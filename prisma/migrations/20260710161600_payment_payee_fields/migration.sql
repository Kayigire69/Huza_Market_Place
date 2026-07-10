-- AlterTable
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "externalId" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "payeePhone" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "payeeName" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "providerMessage" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Payment_externalId_key" ON "Payment"("externalId");
