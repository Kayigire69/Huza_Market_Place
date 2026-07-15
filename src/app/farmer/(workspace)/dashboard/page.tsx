import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Package,
  Upload,
  Wallet,
} from "lucide-react";
import { FarmerPageHeader, FarmerPanel } from "@/components/portals/FarmerUi";
import { Button } from "@/components/ui/Button";
import { requireFarmerWorkspace } from "@/lib/farmer-workspace";
import { formatRwf, formatUnit } from "@/lib/utils";

export const dynamic = "force-dynamic";

type AttentionItem = {
  tone: "warn" | "info" | "ok";
  title: string;
  body: string;
  href: string;
  cta: string;
};

function workflowState(args: {
  hasCrop: boolean;
  pendingReviews: number;
  approvedProducts: number;
  openPurchaseOrders: number;
  unpaidOrders: number;
  paidOrders: number;
}) {
  return [
    {
      step: "1",
      title: "Submit your crop",
      href: "/farmer/products/submit",
      body: "Send your main harvest (usually one crop in volume) for Youth Huza review.",
      done: args.hasCrop,
    },
    {
      step: "2",
      title: "Approval Status",
      href: "/farmer/approvals",
      body: "Follow quality review results and improve when needed.",
      done: args.approvedProducts > 0 && args.pendingReviews === 0,
      active: args.hasCrop && (args.pendingReviews > 0 || args.approvedProducts === 0),
    },
    {
      step: "3",
      title: "Purchase Orders",
      href: "/farmer/orders",
      body: "See what Huza wants to buy and inspection outcomes.",
      done: args.openPurchaseOrders > 0 || args.paidOrders > 0 || args.unpaidOrders > 0,
      active: args.approvedProducts > 0 && args.openPurchaseOrders === 0 && args.paidOrders === 0,
    },
    {
      step: "4",
      title: "Payments",
      href: "/farmer/payments",
      body: "Track payouts for accepted purchase orders.",
      done: args.paidOrders > 0,
      active: args.unpaidOrders > 0,
    },
  ] as const;
}

export default async function FarmerDashboardPage() {
  const { farmer, stats, purchaseOrders } = await requireFarmerWorkspace();
  const latestPo = purchaseOrders[0];
  const accountApproved = farmer.status === "APPROVED";
  const hasCrop = stats.listed > 0;

  const steps = workflowState({
    hasCrop,
    pendingReviews: stats.pendingReviews,
    approvedProducts: stats.approvedProducts,
    openPurchaseOrders: stats.openPurchaseOrders,
    unpaidOrders: stats.unpaidOrders,
    paidOrders: stats.paidOrders,
  });

  const attention: AttentionItem[] = [];
  if (!accountApproved) {
    attention.push({
      tone: "warn",
      title: "Farm account awaiting Youth Huza approval",
      body:
        farmer.status === "REJECTED"
          ? farmer.rejectionReason || "Your application was not approved. Update your profile and wait for Huza to review again."
          : "You can explore the portal. Crop submissions unlock after approval.",
      href: "/farmer/profile",
      cta: "View profile",
    });
  }
  if (accountApproved && !hasCrop) {
    attention.push({
      tone: "info",
      title: "Add your main crop supply",
      body: "Submit one main crop with harvest details and available volume.",
      href: "/farmer/products/submit",
      cta: "Submit my main crop",
    });
  }
  if (stats.pendingReviews > 0) {
    attention.push({
      tone: "info",
      title: `${stats.pendingReviews} crop review${stats.pendingReviews === 1 ? "" : "s"} in progress`,
      body: "Youth Huza is reviewing quality. Check status on Approval Status.",
      href: "/farmer/approvals",
      cta: "Open Approval Status",
    });
  }
  if (stats.rejectedProducts > 0) {
    attention.push({
      tone: "warn",
      title: `${stats.rejectedProducts} crop submission${stats.rejectedProducts === 1 ? "" : "s"} need improvement`,
      body: "Read the feedback, fix the issues, and resubmit when ready.",
      href: "/farmer/approvals",
      cta: "See feedback",
    });
  }
  if (stats.unpaidOrders > 0) {
    attention.push({
      tone: "info",
      title: `${stats.unpaidOrders} purchase order${stats.unpaidOrders === 1 ? "" : "s"} awaiting payment`,
      body: `About ${formatRwf(stats.pendingPayoutAmount)} still pending from Huza.`,
      href: "/farmer/payments",
      cta: "Check payments",
    });
  }
  if (attention.length === 0) {
    attention.push({
      tone: "ok",
      title: "All clear for now",
      body: "Keep available quantity up to date so Huza can buy when ready.",
      href: "/farmer/products",
      cta: "Update crop supply",
    });
  }

  const nextAction = attention[0];

  const recentActivity = [
    ...purchaseOrders.slice(0, 4).map((po) => ({
      id: `po-${po.id}`,
      when: po.createdAt,
      title: `Purchase order ${po.poNumber}`,
      detail: `${formatRwf(po.totalAmount)} · ${po.status} · ${po.paymentStatus}`,
      href: "/farmer/orders",
    })),
    ...farmer.products.slice(0, 4).map((p) => ({
      id: `prod-${p.id}`,
      when: (p.reviewedAt || p.updatedAt).toISOString(),
      title: p.nameEn,
      detail: `Review: ${p.reviewStatus || "PENDING"} · Stock ${p.stockQty} ${formatUnit(p.unit)}`,
      href: "/farmer/approvals",
    })),
  ]
    .sort((a, b) => +new Date(b.when) - +new Date(a.when))
    .slice(0, 6);

  const kpis = [
    {
      label: "Available volume",
      value: hasCrop ? stats.availableVolume.toLocaleString() : "—",
      hint: hasCrop ? formatUnit(stats.primaryUnit) : "No crop yet",
      href: "/farmer/products",
      icon: Package,
    },
    {
      label: "In review",
      value: String(stats.pendingReviews),
      hint: stats.rejectedProducts ? `${stats.rejectedProducts} rejected` : "Quality checks",
      href: "/farmer/approvals",
      icon: ClipboardList,
    },
    {
      label: "Open POs",
      value: String(stats.openPurchaseOrders),
      hint: `${stats.unpaidOrders} awaiting pay`,
      href: "/farmer/orders",
      icon: ClipboardList,
    },
    {
      label: "Paid to you",
      value: formatRwf(stats.paidAmount),
      hint: `${stats.paidOrders} paid order${stats.paidOrders === 1 ? "" : "s"}`,
      href: "/farmer/payments",
      icon: Wallet,
    },
  ];

  return (
    <div>
      <FarmerPageHeader title={`Welcome, ${farmer.user?.fullName || farmer.businessName}`} />

      {/* Recommended next step */}
      <FarmerPanel className="mb-5 border-[var(--huza-green)]/35 bg-gradient-to-br from-white to-[var(--huza-mint)]/50">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--huza-green-dark)]">
              Recommended next step
            </p>
            <h2 className="mt-1 font-[family-name:var(--font-display)] text-xl font-bold text-[var(--huza-ink)]">
              {nextAction.title}
            </h2>
            <p className="mt-1 max-w-xl text-sm text-[var(--huza-muted)]">{nextAction.body}</p>
          </div>
          <Link href={nextAction.href}>
            <Button className="gap-2">
              {nextAction.cta}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </FarmerPanel>

      {/* KPIs */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Link key={kpi.label} href={kpi.href} className="block">
              <FarmerPanel className="!p-4 transition hover:border-[var(--huza-green)] hover:shadow-md">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--huza-muted)]">
                    {kpi.label}
                  </p>
                  <Icon className="h-4 w-4 text-[var(--huza-green)]" />
                </div>
                <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--huza-green-dark)]">
                  {kpi.value}
                </p>
                <p className="mt-0.5 text-xs text-[var(--huza-muted)]">{kpi.hint}</p>
              </FarmerPanel>
            </Link>
          );
        })}
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-5">
        {/* Needs attention */}
        <FarmerPanel className="lg:col-span-3">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <h3 className="font-semibold text-[var(--huza-ink)]">Needs attention</h3>
          </div>
          <ul className="space-y-3">
            {attention.map((item) => (
              <li
                key={item.title}
                className={`rounded-xl border px-3 py-3 ${
                  item.tone === "warn"
                    ? "border-amber-200 bg-amber-50/80"
                    : item.tone === "ok"
                      ? "border-[var(--huza-line)] bg-[var(--huza-mint)]/40"
                      : "border-[var(--huza-line)] bg-white"
                }`}
              >
                <p className="text-sm font-semibold text-[var(--huza-ink)]">{item.title}</p>
                <p className="mt-1 text-xs text-[var(--huza-muted)]">{item.body}</p>
                <Link
                  href={item.href}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[var(--huza-green-dark)] underline underline-offset-4"
                >
                  {item.cta}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </li>
            ))}
          </ul>
        </FarmerPanel>

        {/* Main crop snapshot */}
        <FarmerPanel className="lg:col-span-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--huza-muted)]">
            Main crop supply
          </p>
          {stats.mainCropName ? (
            <>
              <h3 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--huza-ink)]">
                {stats.mainCropName}
              </h3>
              <p className="mt-2 text-sm text-[var(--huza-muted)]">
                <span className="font-[family-name:var(--font-display)] text-3xl font-bold tabular-nums text-[var(--huza-green-dark)]">
                  {stats.availableVolume.toLocaleString()}
                </span>{" "}
                {formatUnit(stats.primaryUnit)} available
              </p>
              <p className="mt-2 text-xs text-[var(--huza-muted)]">
                Update quantity after each harvest.
              </p>
              <Link href="/farmer/products" className="mt-4 inline-block">
                <Button size="sm" variant="ghost" className="gap-1 px-0">
                  Manage crop supply <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </>
          ) : (
            <>
              <h3 className="mt-1 font-semibold text-[var(--huza-ink)]">No crop listed yet</h3>
              <p className="mt-2 text-sm text-[var(--huza-muted)]">
                Submit one main crop in large quantity to start selling to Huza.
              </p>
              <Link href="/farmer/products/submit" className="mt-4 inline-block">
                <Button size="sm" className="gap-2">
                  <Upload className="h-4 w-4" />
                  Submit crop
                </Button>
              </Link>
            </>
          )}
        </FarmerPanel>
      </div>

      {/* Selling workflow with progress */}
      <FarmerPanel className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--huza-green-dark)]">
          Selling workflow
        </p>
        <h2 className="mt-1 font-[family-name:var(--font-display)] text-lg font-bold text-[var(--huza-ink)]">
          Keep business at the center
        </h2>
        <p className="mt-1 text-sm text-[var(--huza-muted)]">
          Sell first. Support tools are secondary.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {steps.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-xl border p-4 transition hover:border-[var(--huza-green)] hover:bg-[var(--huza-mint)] ${
                item.done
                  ? "border-[var(--huza-green)]/30 bg-[var(--huza-mint)]/50"
                  : "active" in item && item.active
                    ? "border-[var(--huza-gold)] bg-[#FFF8E6]"
                    : "border-[var(--huza-line)] bg-white"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-[var(--huza-green-dark)]">Step {item.step}</p>
                {item.done ? (
                  <CheckCircle2 className="h-4 w-4 text-[var(--huza-green)]" />
                ) : "active" in item && item.active ? (
                  <span className="rounded-full bg-[var(--huza-gold)]/30 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                    Now
                  </span>
                ) : null}
              </div>
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
          {farmer.inspectionScheduledAt ? (
            <p className="mt-2 text-xs text-[var(--huza-muted)]">
              Agent visit scheduled: {new Date(farmer.inspectionScheduledAt).toLocaleString()}
            </p>
          ) : null}
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
              No purchase orders yet. Keep your crop supply ready for Huza.
            </p>
          )}
        </FarmerPanel>
      </div>

      {/* Recent activity */}
      <FarmerPanel className="mt-4">
        <h3 className="font-semibold text-[var(--huza-ink)]">Recent activity</h3>
        {recentActivity.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--huza-muted)]">No activity yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-[var(--huza-line)]">
            {recentActivity.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <div>
                  <p className="text-sm font-medium text-[var(--huza-ink)]">{row.title}</p>
                  <p className="text-xs text-[var(--huza-muted)]">{row.detail}</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-[var(--huza-muted)]">
                    {new Date(row.when).toLocaleDateString()}
                  </p>
                  <Link
                    href={row.href}
                    className="text-xs font-bold text-[var(--huza-green-dark)] underline underline-offset-4"
                  >
                    Open
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </FarmerPanel>
    </div>
  );
}
