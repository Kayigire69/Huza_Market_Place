import { FarmerPortalClient } from "../../FarmerPortalClient";
import { FarmerPageHeader } from "@/components/portals/FarmerUi";
import { requireFarmerWorkspace } from "@/lib/farmer-workspace";

export const dynamic = "force-dynamic";

export default async function FarmerPaymentsPage() {
  const { farmer, categories, purchaseOrders } = await requireFarmerWorkspace();

  return (
    <div>
      <FarmerPageHeader
        title="Payments"
        subtitle="Payout status for purchase orders Huza has accepted."
      />
      <FarmerPortalClient
        farmer={farmer as never}
        categories={categories}
        purchaseOrders={purchaseOrders}
        panel="payments"
      />
    </div>
  );
}
