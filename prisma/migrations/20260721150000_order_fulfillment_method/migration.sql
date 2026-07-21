-- AlterEnum
CREATE TYPE "FulfillmentMethod" AS ENUM ('PICKUP', 'HOME_DELIVERY');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "fulfillmentMethod" "FulfillmentMethod" NOT NULL DEFAULT 'HOME_DELIVERY';
