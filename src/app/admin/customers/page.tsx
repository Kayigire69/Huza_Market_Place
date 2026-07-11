import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { isAdminPortalRole } from "@/lib/rbac";
import { loadAdminWorkspace } from "@/services/admin-data.service";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");
  if (!isAdminPortalRole(session.user.role)) redirect("/");
  const { customers } = await loadAdminWorkspace();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--huza-green-dark)]">
          Customers
        </h1>
        <p className="text-sm text-[var(--huza-muted)]">Registered shoppers on HUZA FRESH.</p>
      </div>
      <div className="rounded-2xl border border-[var(--huza-line)] bg-white divide-y divide-[var(--huza-line)]">
        {customers.map((c) => (
          <div key={c.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
            <div>
              <p className="font-semibold">{c.fullName}</p>
              <p className="text-sm text-[var(--huza-muted)]">
                {c.phone}
                {c.email ? ` · ${c.email}` : ""}
              </p>
            </div>
            <p className="text-sm text-[var(--huza-muted)]">{c._count.orders} orders</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-[var(--huza-muted)]">Showing latest {customers.length} customers.</p>
    </div>
  );
}
