-- AlterEnum: add product units (safe additive; existing products unchanged)
ALTER TYPE "UnitType" ADD VALUE 'GRAM';
ALTER TYPE "UnitType" ADD VALUE 'MILLILITRE';
ALTER TYPE "UnitType" ADD VALUE 'CRATE';
ALTER TYPE "UnitType" ADD VALUE 'TRAY';
ALTER TYPE "UnitType" ADD VALUE 'BASKET';
ALTER TYPE "UnitType" ADD VALUE 'BAG';
ALTER TYPE "UnitType" ADD VALUE 'BOX';
ALTER TYPE "UnitType" ADD VALUE 'CUP';
