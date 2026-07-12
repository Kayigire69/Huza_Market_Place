import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { isAdminPortalRole } from "@/lib/rbac";
import { loadAdminCustomers } from "@/services/admin-data.service";

export default async function CustomersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");
  if (!isAdminPortalRole(session.user.role)) redirect("/");
  const customers = await loadAdminCustomers();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="admin-panel-title text-2xl">Customers</h1>
        <p className="admin-panel-sub">Registered shoppers on HUZA FRESH.</p>
      </div>
      <div className="admin-panel divide-y divide-[var(--huza-line)] overflow-hidden">
        {customers.map((c) => (
          <div
            key={c.id}
            className="flex flex-wrap items-center justify-between gap-2 px-4 py-3.5 transition hover:bg-[var(--huza-cream)]"
          >
            <div>
              <p className="font-semibold">{c.fullName}</p>
              <p className="text-sm text-[var(--huza-muted)]">
                {c.phone}
                {c.email ? ` · ${c.email}` : ""}
              </p>
            </div>
            <p className="rounded-full bg-[var(--huza-mint)] px-2.5 py-1 text-xs font-bold text-[var(--huza-green-dark)]">
              {c._count.orders} orders
            </p>
          </div>
        ))}
      </div>
      <p className="text-xs text-[var(--huza-muted)]">Showing latest {customers.length} customers.</p>
    </div>
  );
}
