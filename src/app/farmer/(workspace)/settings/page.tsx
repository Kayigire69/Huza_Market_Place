import { FarmerPortalClient } from "../../FarmerPortalClient";
import { FarmerI18nHeader } from "@/components/portals/FarmerI18nHeader";
import { requireFarmerWorkspace } from "@/lib/farmer-workspace";

export const dynamic = "force-dynamic";

export default async function FarmerSettingsPage() {
  const { farmer, categories, purchaseOrders } = await requireFarmerWorkspace();

  return (
    <div>
      <FarmerI18nHeader titleKey="foSettingsTitle" />
      <FarmerPortalClient
        farmer={farmer as never}
        categories={categories}
        purchaseOrders={purchaseOrders}
        panel="profile"
      />
    </div>
  );
}
