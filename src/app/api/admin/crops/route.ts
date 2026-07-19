import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/rbac-server";
import { prisma } from "@/lib/prisma";

async function requireCropsAdmin() {
  return requireAdminSession({ modules: ["crop_monitoring", "farmers"] });
}

/** Farm crops registered in the Farmers Portal (read-only monitor). */
export async function GET(req: Request) {
  const session = await requireCropsAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "";
  const stage = searchParams.get("stage")?.trim() || "";
  const filter = searchParams.get("filter") || "all"; // all | harvest_soon | ready | harvested

  const now = new Date();
  const in14 = new Date(now);
  in14.setDate(in14.getDate() + 14);

  const harvestSoonWhere =
    filter === "harvest_soon"
      ? {
          expectedHarvestDate: { gte: now, lte: in14 },
          growthStage: { not: "harvested" },
        }
      : filter === "ready"
        ? { growthStage: "ready" }
        : filter === "harvested"
          ? { growthStage: "harvested" }
          : {};

  const crops = await prisma.farmCrop.findMany({
    where: {
      ...harvestSoonWhere,
      ...(stage ? { growthStage: stage } : {}),
      ...(q
        ? {
            OR: [
              { nameEn: { contains: q, mode: "insensitive" } },
              { supplier: { businessName: { contains: q, mode: "insensitive" } } },
              { supplier: { district: { contains: q, mode: "insensitive" } } },
              { supplier: { user: { fullName: { contains: q, mode: "insensitive" } } } },
            ],
          }
        : {}),
    },
    orderBy: [{ expectedHarvestDate: "asc" }, { updatedAt: "desc" }],
    take: 200,
    select: {
      id: true,
      nameEn: true,
      plantingDate: true,
      expectedHarvestDate: true,
      expectedQty: true,
      actualQty: true,
      unit: true,
      growthStage: true,
      farmStatus: true,
      fertilizerUsed: true,
      pesticidesUsed: true,
      diseases: true,
      pests: true,
      irrigation: true,
      notes: true,
      productId: true,
      harvestAlertSentAt: true,
      createdAt: true,
      updatedAt: true,
      supplier: {
        select: {
          id: true,
          businessName: true,
          district: true,
          phone: true,
          status: true,
          user: { select: { fullName: true, phone: true } },
        },
      },
      product: {
        select: {
          id: true,
          nameEn: true,
          reviewStatus: true,
          isActive: true,
        },
      },
    },
  });

  const [total, harvestSoon, ready] = await Promise.all([
    prisma.farmCrop.count(),
    prisma.farmCrop.count({
      where: {
        expectedHarvestDate: { gte: now, lte: in14 },
        growthStage: { not: "harvested" },
      },
    }),
    prisma.farmCrop.count({ where: { growthStage: "ready" } }),
  ]);

  return NextResponse.json({
    crops: crops.map((c) => ({
      ...c,
      plantingDate: c.plantingDate?.toISOString() ?? null,
      expectedHarvestDate: c.expectedHarvestDate?.toISOString() ?? null,
      harvestAlertSentAt: c.harvestAlertSentAt?.toISOString() ?? null,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    })),
    counts: { total, harvestSoon, ready },
  });
}
