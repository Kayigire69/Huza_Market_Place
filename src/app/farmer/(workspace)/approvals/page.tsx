import { FarmerApprovalsClient } from "@/components/portals/FarmerApprovalsClient";
import { FarmerPageHeader } from "@/components/portals/FarmerUi";
import { requireFarmerWorkspace } from "@/lib/farmer-workspace";

export const dynamic = "force-dynamic";

export default async function FarmerApprovalsPage() {
  const { farmer } = await requireFarmerWorkspace();

  const crops = (farmer.products || []).map((p) => ({
    id: p.id,
    nameEn: p.nameEn,
    price: p.price,
    unit: p.unit,
    stockQty: p.stockQty,
    reviewStatus: p.reviewStatus,
    reviewNote: p.reviewNote,
    reviewRecommendation: p.reviewRecommendation,
    reviewedAt: p.reviewedAt,
    category: p.category ? { nameEn: p.category.nameEn, slug: p.category.slug } : null,
    images: p.images?.map((img) => ({ id: img.id, url: img.url, alt: img.alt })) ?? [],
  }));

  return (
    <div>
      <FarmerPageHeader
        title="Approval Status"
        subtitle="Track farm account approval and each crop’s quality review — clear results, not just “pending”."
      />
      <FarmerApprovalsClient
        account={{
          businessName: farmer.businessName,
          status: farmer.status,
          isVerified: farmer.isVerified,
          farmingType: farmer.farmingType,
          rejectionReason: farmer.rejectionReason,
          adminNotes: farmer.adminNotes,
          inspectionScheduledAt: farmer.inspectionScheduledAt?.toISOString() ?? null,
        }}
        crops={crops}
      />
    </div>
  );
}
