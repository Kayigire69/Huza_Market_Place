ALTER TABLE "StockBatch" ADD COLUMN IF NOT EXISTS "qualityGrade" TEXT;
CREATE INDEX IF NOT EXISTS "StockBatch_qualityGrade_idx" ON "StockBatch"("qualityGrade");
