import { FarmerPortalClient } from "../../../FarmerPortalClient";
import { FarmerPageHeader, FarmerPanel } from "@/components/portals/FarmerUi";
import { requireFarmerWorkspace } from "@/lib/farmer-workspace";

export const dynamic = "force-dynamic";

export default async function FarmerSubmitProductPage() {
  const { farmer, categories, purchaseOrders, stats } = await requireFarmerWorkspace();
  const isOrganic = farmer.farmingType !== "STANDARD";
  const hasMainCrop = stats.listed > 0;

  return (
    <div>
      <FarmerPageHeader
        title={hasMainCrop ? "Submit another crop" : "Submit your main crop"}
        subtitle={
          isOrganic
            ? "Tell Huza about this harvest in volume — crop name, photos, field details, and available quantity."
            : "Keep it simple: one crop name, photos, available quantity, and price per unit."
        }
      />

      <FarmerPanel className="mb-5 max-w-2xl !py-3">
        <p className="text-sm text-[var(--huza-muted)]">
          Youth Huza usually buys <strong>one crop type per farm partner in large quantity</strong>. Prefer
          updating stock on My Crop Supply unless you truly have a second harvest type ready.
        </p>
      </FarmerPanel>

      <FarmerPortalClient
        farmer={farmer as never}
        categories={categories}
        purchaseOrders={purchaseOrders}
        panel="submit"
      />
    </div>
  );
}
