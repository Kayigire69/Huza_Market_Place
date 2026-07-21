import { Suspense } from "react";
import { redirect } from "next/navigation";
import { FarmerHubTabs, SALES_TABS } from "@/components/portals/FarmerHubTabs";
import { FarmerI18nHeader } from "@/components/portals/FarmerI18nHeader";
import { FarmerOrdersClient } from "@/components/portals/FarmerOrdersClient";
import { FarmerPaymentsClient } from "@/components/portals/FarmerPaymentsClient";
import { requireFarmerWorkspace } from "@/lib/farmer-workspace";

export const dynamic = "force-dynamic";

export default async function FarmerSalesPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const sp = searchParams ? await searchParams : {};
  const tab = sp.tab === "payments" ? "payments" : "orders";
  const { farmer, purchaseOrders } = await requireFarmerWorkspace();
  if (farmer.status !== "APPROVED") {
    redirect("/farmer/dashboard");
  }

  return (
    <div>
      <FarmerI18nHeader titleKey="foSalesTitle" />
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
