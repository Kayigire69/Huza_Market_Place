-- Per-user admin module overrides (empty = use role defaults)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "allowedModules" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
