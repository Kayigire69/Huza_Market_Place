import { FarmerPaymentsClient } from "@/components/portals/FarmerPaymentsClient";
import { FarmerPageHeader } from "@/components/portals/FarmerUi";
import { requireFarmerWorkspace } from "@/lib/farmer-workspace";

export const dynamic = "force-dynamic";

export default async function FarmerPaymentsPage() {
  const { purchaseOrders } = await requireFarmerWorkspace();

  return (
    <div>
      <FarmerPageHeader
        title="Payments"
        subtitle="Payouts from Youth Huza for accepted purchase orders — paid vs waiting, with references."
      />
      <FarmerPaymentsClient orders={purchaseOrders} />
    </div>
  );
}
