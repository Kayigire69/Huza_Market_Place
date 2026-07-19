import Link from "next/link";
import { Suspense } from "react";
import { FarmerApprovalsClient } from "@/components/portals/FarmerApprovalsClient";
import { FarmerHubTabs, PRODUCE_TABS } from "@/components/portals/FarmerHubTabs";
import { FarmerMyCropsPanel } from "@/components/portals/FarmerMyCropsPanel";
import { FarmerPageHeader } from "@/components/portals/FarmerUi";
import { Button } from "@/components/ui/Button";
import { requireFarmerWorkspace } from "@/lib/farmer-workspace";
import { FarmerPortalClient } from "../../FarmerPortalClient";

export const dynamic = "force-dynamic";

export default async function FarmerProducePage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string; fromCrop?: string }>;
}) {
  const sp = searchParams ? await searchParams : {};
  const tab = sp.tab || "list";
  const fromCropId = sp.fromCrop?.trim() || "";
  const { farmer, categories, purchaseOrders, stats } = await requireFarmerWorkspace();

  let cropPrefill: {
    id: string;
    nameEn: string;
    expectedQty: number | null;
    actualQty: number | null;
    unit: string;
    farmStatus: string | null;
    fertilizerUsed: string | null;
    pesticidesUsed: string | null;
    diseases: string | null;
    pests: string | null;
    irrigation: string | null;
    notes: string | null;
    expectedHarvestDate: string | null;
  } | null = null;

  if (tab === "submit" && fromCropId) {
    const { prisma } = await import("@/lib/prisma");
    const crop = await prisma.farmCrop.findFirst({
      where: { id: fromCropId, supplierId: farmer.id },
    });
    if (crop) {
      cropPrefill = {
        id: crop.id,
        nameEn: crop.nameEn,
        expectedQty: crop.expectedQty,
        actualQty: crop.actualQty,
        unit: crop.unit,
        farmStatus: crop.farmStatus,
        fertilizerUsed: crop.fertilizerUsed,
        pesticidesUsed: crop.pesticidesUsed,
        diseases: crop.diseases,
        pests: crop.pests,
        irrigation: crop.irrigation,
        notes: crop.notes,
        expectedHarvestDate: crop.expectedHarvestDate
          ? crop.expectedHarvestDate.toISOString()
          : null,
      };
    }
  }

  const products = (farmer.products || []).map((p) => ({
    id: p.id,
    nameEn: p.nameEn,
    price: p.price,
    unit: p.unit,
    stockQty: p.stockQty,
    reviewStatus: p.reviewStatus,
    reviewNote: p.reviewNote,
    reviewRecommendation: p.reviewRecommendation,
    reviewedAt: p.reviewedAt,
    qualityGeneral: p.qualityGeneral,
    category: p.category
      ? { nameEn: p.category.nameEn, slug: p.category.slug }
      : null,
    images: p.images?.map((img) => ({ id: img.id, url: img.url, alt: img.alt })) ?? [],
  }));

  return (
    <div>
      <FarmerPageHeader
        title="My Produce"
        subtitle="Register crops you intend to sell to Youth Huza. Fruit salads and juices are prepared by HUZA FRESH."
        action={
          tab !== "submit" ? (
            <Link href="/farmer/produce?tab=submit">
              <Button variant={stats.listed === 0 ? "primary" : "ghost"}>
                {stats.listed === 0 ? "Submit my main crop" : "Submit another crop"}
              </Button>
            </Link>
          ) : null
        }
      />
      <Suspense fallback={null}>
        <FarmerHubTabs tabs={PRODUCE_TABS} />
      </Suspense>

      {tab === "submit" ? (
        <FarmerPortalClient
          farmer={farmer as never}
          categories={categories}
          purchaseOrders={purchaseOrders}
          panel="submit"
          cropPrefill={cropPrefill}
        />
      ) : tab === "approvals" ? (
        <FarmerApprovalsClient
          account={{
            businessName: farmer.businessName,
            status: farmer.status,
            isVerified: Boolean(farmer.isVerified),
            farmingType: farmer.farmingType,
            rejectionReason: farmer.rejectionReason ?? null,
            adminNotes: farmer.adminNotes ?? null,
            inspectionScheduledAt: farmer.inspectionScheduledAt
              ? farmer.inspectionScheduledAt.toISOString()
              : null,
          }}
          crops={products}
        />
      ) : (
        <FarmerMyCropsPanel products={products} />
      )}
    </div>
  );
}
