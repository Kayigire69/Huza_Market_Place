import { FarmerOrdersClient } from "@/components/portals/FarmerOrdersClient";
import { FarmerPageHeader } from "@/components/portals/FarmerUi";
import { requireFarmerWorkspace } from "@/lib/farmer-workspace";

export const dynamic = "force-dynamic";

export default async function FarmerOrdersPage() {
  const { purchaseOrders } = await requireFarmerWorkspace();

  return (
    <div>
      <FarmerPageHeader
        title="Purchase Orders"
        subtitle="Quantity, inspection, and status when Youth Huza buys your harvest."
      />
      <FarmerOrdersClient orders={purchaseOrders} />
    </div>
  );
}
