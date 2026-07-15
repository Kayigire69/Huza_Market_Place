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
        subtitle="When Youth Huza buys your harvest — quantity, inspection, and order progress in one place."
      />
      <FarmerOrdersClient orders={purchaseOrders} />
    </div>
  );
}
