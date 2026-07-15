import { FarmerPortalClient } from "../../FarmerPortalClient";
import { FarmerPageHeader } from "@/components/portals/FarmerUi";
import { requireFarmerWorkspace } from "@/lib/farmer-workspace";

export const dynamic = "force-dynamic";

export default async function FarmerProfilePage() {
  const { farmer, categories, purchaseOrders } = await requireFarmerWorkspace();
  const isOrganic = farmer.farmingType !== "STANDARD";

  return (
    <div>
      <FarmerPageHeader
        title="My Profile"
        subtitle={
          isOrganic
            ? "Organic farm details for Youth Huza."
            : "Your Huza purchase agreement and contact details."
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
