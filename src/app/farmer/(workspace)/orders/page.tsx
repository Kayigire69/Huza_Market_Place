import { FarmerPortalClient } from "../../FarmerPortalClient";
import { FarmerPageHeader } from "@/components/portals/FarmerUi";
import { requireFarmerWorkspace } from "@/lib/farmer-workspace";

export const dynamic = "force-dynamic";

export default async function FarmerOrdersPage() {
  const { farmer, categories, purchaseOrders } = await requireFarmerWorkspace();

  return (
    <div>
      <FarmerPageHeader
        title="Purchase Orders"
        subtitle="Huza purchase requests, inspection notes, and order progress."
      />
      <FarmerPortalClient
        farmer={farmer as never}
        categories={categories}
        purchaseOrders={purchaseOrders}
        panel="orders"
      />
    </div>
  );
}
