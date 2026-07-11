import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { loadAdminWorkspace } from "@/services/admin-data.service";
import { AdminClient } from "./AdminClient";

type Tab =
  | "overview"
  | "suppliers"
  | "products"
  | "catalog"
  | "inventory"
  | "procurement"
  | "orders"
  | "delivery"
  | "payments"
  | "reviews"
  | "promos"
  | "hours"
  | "reports"
  | "audit";

export async function renderAdminModule(forcedTab: Tab) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");
  if (session.user.role !== "ADMIN") redirect("/");

  const data = await loadAdminWorkspace();

  return (
    <AdminClient
      forcedTab={forcedTab}
      adminName={session.user.name}
      pendingSuppliers={data.pendingSuppliers}
      allSuppliers={data.allSuppliers}
      pendingFarmerProducts={data.pendingFarmerProducts}
      orders={data.orders}
      deliveries={data.deliveries}
      payments={data.payments}
      reviews={data.reviews}
      lowStock={data.lowStock}
      topProducts={data.topProducts}
      promotions={data.promotions}
      businessHours={data.businessHours}
      holidays={data.holidays}
      emergency={data.emergency}
      deliveryPeople={data.deliveryPeople}
      auditLogs={data.auditLogs}
      procurementOffers={data.procurementOffers}
      purchaseOrders={data.purchaseOrders}
      catalogProducts={data.catalogProducts}
      recentMovements={data.recentMovements}
    />
  );
}
