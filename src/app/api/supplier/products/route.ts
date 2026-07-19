import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UnitType } from "@prisma/client";
import { pickProductCropFields } from "@/lib/farmer-dossier";
import { findSupplierIdForUser } from "@/lib/supplier-context";

function parseImageUrls(body: Record<string, unknown>): string[] {
  const raw = body.imageUrls;
  if (Array.isArray(raw)) {
    return raw.map(String).map((u) => u.trim()).filter(Boolean).slice(0, 8);
  }
  if (typeof raw === "string" && raw.trim()) {
    return raw
      .split(/[\n,]+/)
      .map((u) => u.trim())
      .filter(Boolean)
      .slice(0, 8);
  }
  return [];
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supplierId = await findSupplierIdForUser(session.user.id);
  if (!supplierId) return NextResponse.json({ error: "Farmer not found" }, { status: 404 });

  const products = await prisma.product.findMany({
    where: { supplierId },
    include: { category: true, images: { orderBy: { sortOrder: "asc" } } },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(products);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supplierId = await findSupplierIdForUser(session.user.id);
  if (!supplierId) return NextResponse.json({ error: "Farmer not found" }, { status: 404 });

  const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
  if (supplier?.status !== "APPROVED") {
    return NextResponse.json({ error: "Farmer not approved yet" }, { status: 403 });
  }

  const body = await req.json();
  if (!body.categoryId || !body.nameEn) {
    return NextResponse.json({ error: "Name and category are required" }, { status: 400 });
  }

  const category = await prisma.category.findUnique({ where: { id: String(body.categoryId) } });
  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 400 });
  }
  const { isFarmerSupplyCategory, isHuzaPreparedCategory } = await import("@/lib/farmer-supply");
  if (isHuzaPreparedCategory(category.slug) || !isFarmerSupplyCategory(category.slug)) {
    return NextResponse.json(
      {
        error:
          "Farmers supply raw crops (fruits, vegetables, seedlings) only. Fruit salads and juices are prepared by HUZA FRESH.",
      },
      { status: 400 }
    );
  }

  const imageUrls = parseImageUrls(body);
  // Photos are optional — for Huza inspection/ID only, never shown on the shop

  const cropRaw = pickProductCropFields(body);
  const isStandard = supplier?.farmingType === "STANDARD";
  // Non-organic farmers only store simple listing fields — never the organic dossier block
  const crop = isStandard
    ? {
        priceUnit: cropRaw.priceUnit,
        pricePerUnit: cropRaw.pricePerUnit,
      }
    : cropRaw;
  const price =
    Number(body.price) ||
    Number(crop.pricePerUnit) ||
    Number(!isStandard ? cropRaw.farmGatePrice : 0) ||
    0;

  const harvestDateRaw = body.harvestDate ? new Date(String(body.harvestDate)) : null;
  const harvestDate =
    harvestDateRaw && !Number.isNaN(harvestDateRaw.getTime()) ? harvestDateRaw : null;

  // STANDARD (non-organic) farmers never list organic badges
  const isOrganic = isStandard ? false : Boolean(body.isOrganic);

  const product = await prisma.product.create({
    data: {
      supplierId,
      categoryId: body.categoryId,
      nameEn: body.nameEn,
      nameFr: body.nameFr || body.nameEn,
      nameRw: body.nameRw || body.nameEn,
      descriptionEn: body.descriptionEn || (!isStandard ? body.farmerComments : "") || "",
      descriptionFr:
        body.descriptionFr || body.descriptionEn || (!isStandard ? body.farmerComments : "") || "",
      descriptionRw:
        body.descriptionRw || body.descriptionEn || (!isStandard ? body.farmerComments : "") || "",
      price,
      unit: (body.unit as UnitType) || UnitType.KG,
      stockQty: Number(body.stockQty) || Number(!isStandard ? body.totalQuantityHarvested : 0) || 0,
      isOrganic,
      isNewArrival: true,
      isActive: false,
      reviewStatus: "PENDING",
      inventorySource: "FARMER",
      purchaseMethod: "DIRECT",
      harvestDate,
      location: supplier?.location,
      originDistrict: body.originDistrict || supplier?.district || null,
      fieldType: !isStandard ? (crop.fieldType as string | undefined) : undefined,
      fieldSize: !isStandard ? (crop.fieldSize as string | undefined) : undefined,
      pastCropsSeason1: !isStandard ? (crop.pastCropsSeason1 as string | undefined) : undefined,
      pastCropsSeason2: !isStandard ? (crop.pastCropsSeason2 as string | undefined) : undefined,
      pastCropsSeason3: !isStandard ? (crop.pastCropsSeason3 as string | undefined) : undefined,
      currentCrop: !isStandard ? (crop.currentCrop as string | undefined) : undefined,
      chemicalsPerWeek: !isStandard ? (crop.chemicalsPerWeek as string | undefined) : undefined,
      chemicalsWhy: !isStandard ? (crop.chemicalsWhy as string | undefined) : undefined,
      chemicalsDosage: !isStandard ? (crop.chemicalsDosage as string | undefined) : undefined,
      fertilizerPerWeek: !isStandard ? (crop.fertilizerPerWeek as string | undefined) : undefined,
      irrigationMethod: !isStandard ? (crop.irrigationMethod as string | undefined) : undefined,
      diseasesIdentified: !isStandard ? (crop.diseasesIdentified as string | undefined) : undefined,
      pestsIdentified: !isStandard ? (crop.pestsIdentified as string | undefined) : undefined,
      totalQuantityHarvested: !isStandard
        ? (crop.totalQuantityHarvested as string | undefined)
        : undefined,
      qualityGeneral: !isStandard ? (crop.qualityGeneral as string | undefined) : undefined,
      priceUnit: crop.priceUnit as string | undefined,
      pricePerUnit: crop.pricePerUnit as number | undefined,
      totalKgsBoughtByHuza: !isStandard ? (cropRaw.totalKgsBoughtByHuza as number) || 0 : 0,
      paymentOption: !isStandard ? (cropRaw.paymentOption as string | undefined) : undefined,
      farmGatePrice: !isStandard ? (cropRaw.farmGatePrice as number | undefined) : undefined,
      priceUponDelivery: !isStandard
        ? (cropRaw.priceUponDelivery as number | undefined)
        : undefined,
      priceAfterSale: !isStandard ? (cropRaw.priceAfterSale as number | undefined) : undefined,
      proofOfPaymentUrl: !isStandard
        ? (cropRaw.proofOfPaymentUrl as string | undefined)
        : undefined,
      farmerComments: !isStandard ? (cropRaw.farmerComments as string | undefined) : undefined,
      images:
        imageUrls.length > 0
          ? {
              create: imageUrls.map((url, i) => ({
                url,
                alt: `${body.nameEn} inspection ${i + 1}`,
                sortOrder: i,
                kind: "INSPECTION" as const,
                isCover: false,
              })),
            }
          : undefined,
      stockLogs: {
        create: {
          change: Number(body.stockQty) || Number(body.totalQuantityHarvested) || 0,
          reason: "Initial upload by farmer",
        },
      },
    },
    include: { images: true, category: true },
  });

  const farmCropId = typeof body.farmCropId === "string" ? body.farmCropId.trim() : "";
  if (farmCropId) {
    const owned = await prisma.farmCrop.findFirst({
      where: { id: farmCropId, supplierId },
    });
    if (owned) {
      await prisma.farmCrop.update({
        where: { id: farmCropId },
        data: {
          productId: product.id,
          growthStage: "harvested",
          actualQty:
            Number(body.stockQty) ||
            Number(body.totalQuantityHarvested) ||
            owned.actualQty ||
            null,
        },
      });
    }
  }

  return NextResponse.json(product);
}
