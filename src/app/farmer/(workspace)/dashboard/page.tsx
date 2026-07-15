import Link from "next/link";
import { FarmerPageHeader, FarmerPanel } from "@/components/portals/FarmerUi";
import { requireFarmerWorkspace } from "@/lib/farmer-workspace";
import { formatRwf } from "@/lib/utils";

export const dynamic = "force-dynamic";

const WORKFLOW = [
  {
    step: "1",
    title: "Submit your crop",
    href: "/farmer/products/submit",
    body: "Send your main harvest (usually one crop in volume) for Youth Huza review.",
  },
  {
    step: "2",
    title: "Approval Status",
    href: "/farmer/approvals",
    body: "Follow quality review results and improve when needed.",
  },
  {
    step: "3",
    title: "Purchase Orders",
    href: "/farmer/orders",
    body: "See what Huza wants to buy and inspection outcomes.",
  },
  {
    step: "4",
    title: "Payments",
    href: "/farmer/payments",
    body: "Track payouts for accepted purchase orders.",
  },
] as const;

export default async function FarmerDashboardPage() {
  const { farmer, stats, purchaseOrders } = await requireFarmerWorkspace();
  const latestPo = purchaseOrders[0];

  return (
    <div>
      <FarmerPageHeader
        title="Dashboard"
        subtitle="Grow Better. Sell Better. Earn Better. — Youth Huza is your agricultural partner; HUZA FRESH is the customer brand."
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Crops listed", value: String(stats.listed) },
          { label: "In review", value: String(stats.pendingReviews) },
          { label: "Open POs", value: String(stats.openPurchaseOrders) },
          { label: "Paid orders", value: String(stats.paidOrders) },
        ].map((kpi) => (
          <FarmerPanel key={kpi.label} className="!p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--huza-muted)]">
              {kpi.label}
            </p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--huza-green-dark)]">
              {kpi.value}
            </p>
          </FarmerPanel>
        ))}
      </div>

      <FarmerPanel className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--huza-green-dark)]">
          Selling workflow
        </p>
        <h2 className="mt-1 font-[family-name:var(--font-display)] text-lg font-bold text-[var(--huza-ink)]">
          Keep business at the center
        </h2>
        <p className="mt-1 text-sm text-[var(--huza-muted)]">
          Support tools help you grow quality — they stay secondary to selling.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {WORKFLOW.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl border border-[var(--huza-line)] bg-[var(--huza-mint)]/40 p-4 transition hover:border-[var(--huza-green)] hover:bg-[var(--huza-mint)]"
            >
              <p className="text-xs font-bold text-[var(--huza-green-dark)]">Step {item.step}</p>
              <p className="mt-1 font-semibold text-[var(--huza-ink)]">{item.title}</p>
              <p className="mt-1 text-xs text-[var(--huza-muted)]">{item.body}</p>
            </Link>
          ))}
        </div>
      </FarmerPanel>

      <div className="grid gap-4 lg:grid-cols-2">
        <FarmerPanel>
          <h3 className="font-semibold text-[var(--huza-ink)]">Account</h3>
          <p className="mt-2 text-sm text-[var(--huza-muted)]">
            {farmer.businessName} · {farmer.farmingType === "STANDARD" ? "Standard" : "Organic"} path
          </p>
          <p className="mt-1 text-sm">
            Status: <strong>{farmer.status}</strong>
            {farmer.isVerified ? " · Verified" : ""}
          </p>
          <Link
            href="/farmer/profile"
            className="mt-3 inline-block text-sm font-bold text-[var(--huza-green-dark)] underline underline-offset-4"
          >
            My Profile
          </Link>
        </FarmerPanel>

        <FarmerPanel>
          <h3 className="font-semibold text-[var(--huza-ink)]">Latest purchase order</h3>
          {latestPo ? (
            <>
              <p className="mt-2 font-mono text-sm font-semibold text-[var(--huza-green-dark)]">
                {latestPo.poNumber}
              </p>
              <p className="text-sm">
                {formatRwf(latestPo.totalAmount)} · {latestPo.status}
              </p>
              <p className="text-xs text-[var(--huza-muted)]">{latestPo.paymentStatus}</p>
              <Link
                href="/farmer/orders"
                className="mt-3 inline-block text-sm font-bold text-[var(--huza-green-dark)] underline underline-offset-4"
              >
                View all orders
              </Link>
            </>
          ) : (
            <p className="mt-2 text-sm text-[var(--huza-muted)]">
              No purchase orders yet. Submit a product to get started.
            </p>
          )}
        </FarmerPanel>
      </div>
    </div>
  );
}
