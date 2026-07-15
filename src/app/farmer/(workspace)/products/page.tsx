import Link from "next/link";
import { FarmerMyCropsPanel } from "@/components/portals/FarmerMyCropsPanel";
import { FarmerPageHeader } from "@/components/portals/FarmerUi";
import { Button } from "@/components/ui/Button";
import { requireFarmerWorkspace } from "@/lib/farmer-workspace";

export const dynamic = "force-dynamic";

export default async function FarmerProductsPage() {
  const { farmer, stats } = await requireFarmerWorkspace();
  const products = (farmer.products || []).map((p) => ({
    id: p.id,
    nameEn: p.nameEn,
    price: p.price,
    unit: p.unit,
    stockQty: p.stockQty,
    reviewStatus: p.reviewStatus,
    reviewNote: p.reviewNote,
    reviewedAt: p.reviewedAt,
    qualityGeneral: p.qualityGeneral,
    category: p.category ? { nameEn: p.category.nameEn } : null,
    images: p.images?.map((img) => ({ id: img.id, url: img.url, alt: img.alt })) ?? [],
  }));

  return (
    <div>
      <FarmerPageHeader
        title="My Crop Supply"
        subtitle="Built for volume suppliers — usually one main crop in large quantity, not many small products."
        action={
          <Link href="/farmer/products/submit">
            <Button variant={stats.listed === 0 ? "primary" : "ghost"}>
              {stats.listed === 0 ? "Submit my main crop" : "Submit another crop"}
            </Button>
          </Link>
        }
      />
      <FarmerMyCropsPanel products={products} />
    </div>
  );
}
