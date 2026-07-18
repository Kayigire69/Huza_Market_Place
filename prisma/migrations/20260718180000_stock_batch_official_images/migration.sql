-- Official HUZA photos on inventory batches (customer storefront sync source)
ALTER TABLE "StockBatch" ADD COLUMN IF NOT EXISTS "officialImageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];
