-- Separate farmer inspection photos from customer-facing HUZA storefront images
DO $$ BEGIN
  CREATE TYPE "ProductImageKind" AS ENUM ('INSPECTION', 'STOREFRONT');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "ProductImage" ADD COLUMN IF NOT EXISTS "kind" "ProductImageKind" NOT NULL DEFAULT 'STOREFRONT';
ALTER TABLE "ProductImage" ADD COLUMN IF NOT EXISTS "isCover" BOOLEAN NOT NULL DEFAULT false;

-- Existing seeded / live images are customer-facing; first image per product becomes cover
UPDATE "ProductImage" SET "kind" = 'STOREFRONT' WHERE "kind" IS NULL OR "kind" = 'STOREFRONT';

UPDATE "ProductImage" pi
SET "isCover" = true
WHERE pi.id IN (
  SELECT DISTINCT ON ("productId") id
  FROM "ProductImage"
  WHERE "kind" = 'STOREFRONT'
  ORDER BY "productId", "sortOrder" ASC, "id" ASC
);

CREATE INDEX IF NOT EXISTS "ProductImage_productId_kind_idx" ON "ProductImage"("productId", "kind");
