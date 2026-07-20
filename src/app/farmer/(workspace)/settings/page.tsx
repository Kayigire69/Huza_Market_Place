import { FarmerPortalClient } from "../../FarmerPortalClient";
import { FarmerPageHeader } from "@/components/portals/FarmerUi";
import { requireFarmerWorkspace } from "@/lib/farmer-workspace";

export const dynamic = "force-dynamic";

export default async function FarmerSettingsPage() {
  const { farmer, categories, purchaseOrders } = await requireFarmerWorkspace();

  return (
    <div>
      <FarmerPageHeader title="Settings" />
      <FarmerPortalClient
        farmer={farmer as never}
        categories={categories}
        purchaseOrders={purchaseOrders}
        panel="profile"
      />
    </div>
  );
}
