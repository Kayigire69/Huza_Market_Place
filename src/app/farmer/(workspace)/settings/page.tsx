import { FarmerPortalClient } from "../../FarmerPortalClient";
import { FarmerPageHeader } from "@/components/portals/FarmerUi";
import { requireFarmerWorkspace } from "@/lib/farmer-workspace";

export const dynamic = "force-dynamic";

export default async function FarmerSettingsPage() {
  const { farmer, categories, purchaseOrders } = await requireFarmerWorkspace();
  const isOrganic = farmer.farmingType !== "STANDARD";

  return (
    <div>
      <FarmerPageHeader
        title="Settings"
        subtitle={
          isOrganic
            ? "Personal information, farm dossier, language, and notification preferences."
            : "Personal information, purchase agreement, and account preferences."
        }
      />
      <FarmerPortalClient
        farmer={farmer as never}
        categories={categories}
        purchaseOrders={purchaseOrders}
        panel="profile"
      />
    </div>
  );
}
