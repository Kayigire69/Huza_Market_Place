import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { isAdminPortalRole, isSuperAdmin } from "@/lib/rbac";
import {
  loadAdminWorkspaceForTab,
  type AdminWorkspaceTab,
} from "@/services/admin-data.service";
import { AdminClient } from "./AdminClient";

type Tab = AdminWorkspaceTab;

const SUPER_ONLY_TABS: Tab[] = ["staff", "audit", "hours"];

export async function renderAdminModule(forcedTab: Tab) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");
  if (!isAdminPortalRole(session.user.role)) redirect("/");

  if (SUPER_ONLY_TABS.includes(forcedTab) && !isSuperAdmin(session.user.role)) {
    redirect("/admin");
  }

  const data = await loadAdminWorkspaceForTab(forcedTab);

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
      auditLogs={isSuperAdmin(session.user.role) ? data.auditLogs : []}
      staffUsers={isSuperAdmin(session.user.role) ? data.staffUsers : []}
      procurementOffers={data.procurementOffers}
      purchaseOrders={data.purchaseOrders}
      catalogProducts={data.catalogProducts}
      recentMovements={data.recentMovements}
    />
  );
}
