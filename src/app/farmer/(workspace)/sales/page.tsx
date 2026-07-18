import { Suspense } from "react";
import { FarmerHubTabs, SALES_TABS } from "@/components/portals/FarmerHubTabs";
import { FarmerOrdersClient } from "@/components/portals/FarmerOrdersClient";
import { FarmerPaymentsClient } from "@/components/portals/FarmerPaymentsClient";
import { FarmerPageHeader } from "@/components/portals/FarmerUi";
import { requireFarmerWorkspace } from "@/lib/farmer-workspace";

export const dynamic = "force-dynamic";

export default async function FarmerSalesPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const sp = searchParams ? await searchParams : {};
  const tab = sp.tab === "payments" ? "payments" : "orders";
  const { purchaseOrders } = await requireFarmerWorkspace();

  return (
    <div>
      <FarmerPageHeader
        title="Sales"
        subtitle="Purchases Youth Huza makes from your farm — including commission settlements after HUZA FRESH sales."
      />
      <Suspense fallback={null}>
        <FarmerHubTabs tabs={SALES_TABS} />
      </Suspense>
      {tab === "payments" ? (
        <FarmerPaymentsClient orders={purchaseOrders} />
      ) : (
        <FarmerOrdersClient orders={purchaseOrders} />
      )}
    </div>
  );
}
