import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatRwf } from "@/lib/utils";
import { AdminClient } from "./AdminClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth/login");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  const [
    customers,
    suppliers,
    products,
    orders,
    pendingOrders,
    revenueAgg,
    lowStock,
    topProducts,
    pendingSuppliers,
    deliveries,
    payments,
    reviews,
    promotions,
    businessHours,
    holidays,
    emergency,
    purchaseOrderCount,
    openPoValue,
    expenseSum,
    pendingDeliveries,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.supplier.count(),
    prisma.product.count(),
    prisma.order.count(),
    prisma.order.count({ where: { status: { in: ["PENDING", "CONFIRMED", "PAID"] } } }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { status: { notIn: ["CANCELLED", "REFUNDED"] } },
    }),
    prisma.product.findMany({
      where: { stockQty: { lte: 5 }, isActive: true },
      include: { supplier: true },
      take: 10,
    }),
    prisma.product.findMany({
      where: { isBestSeller: true },
      orderBy: { ratingCount: "desc" },
      take: 5,
    }),
    prisma.supplier.findMany({
      where: { status: "PENDING" },
      include: { user: true },
    }),
    prisma.delivery.findMany({
      include: {
        order: true,
        deliveryPerson: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
    prisma.payment.findMany({
      include: { order: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.review.findMany({
      include: {
        user: true,
        product: true,
        supplier: true,
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.promotion.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.businessHours.findMany({ orderBy: { dayOfWeek: "asc" } }),
    prisma.holiday.findMany({ orderBy: { date: "asc" } }),
    prisma.emergencyClosure.findMany({ where: { isActive: true } }),
    prisma.purchaseOrder.count(),
    prisma.purchaseOrder.aggregate({
      _sum: { totalAmount: true },
      where: { status: { notIn: ["CANCELLED", "REJECTED"] } },
    }),
    prisma.expense.aggregate({ _sum: { amount: true } }),
    prisma.delivery.count({
      where: { status: { in: ["READY_FOR_DISPATCH", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "PACKED"] } },
    }),
  ]);

  const auditLogs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const allSuppliers = await prisma.supplier.findMany({
    include: { user: true, _count: { select: { products: true } } },
    orderBy: { createdAt: "desc" },
  });

  const pendingFarmerProducts = await prisma.product.findMany({
    where: { reviewStatus: "PENDING" },
    include: {
      supplier: { include: { user: true } },
      category: true,
      images: { orderBy: { sortOrder: "asc" }, take: 4 },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const allOrders = await prisma.order.findMany({
    include: { payment: true, delivery: true, items: true },
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  const deliveryPeople = await prisma.user.findMany({
    where: { role: "DELIVERY" },
    select: { id: true, fullName: true, phone: true },
  });

  const procurementOffers = await prisma.supplierOffer.findMany({
    include: { supplier: true, category: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const purchaseOrders = await prisma.purchaseOrder.findMany({
    include: { supplier: true, offer: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const stats = {
    customers,
    suppliers,
    products,
    orders,
    pendingOrders,
    revenue: revenueAgg._sum.total ?? 0,
    purchaseOrders: purchaseOrderCount,
    expenses: expenseSum._sum.amount ?? 0,
    profit: (revenueAgg._sum.total ?? 0) - (expenseSum._sum.amount ?? 0) - (openPoValue._sum.totalAmount ?? 0),
    pendingDeliveries,
    lowStock: lowStock.length,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <h1 className="section-title">Administration dashboard</h1>
      <p className="mt-2 text-[var(--huza-muted)] mb-4">
        Manage HUZA FRESH — retailer storefront, farmer approval, and procurement.
      </p>

      <div className="mb-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { href: "/admin#suppliers", title: "Farmer Approval", desc: "Review farmer dossiers & approve" },
          { href: "/admin#products", title: "Product review", desc: "Accept or reject farmer products" },
          { href: "/admin#procurement", title: "Procurement", desc: "POs, receive, inspect, pay" },
          { href: "/warehouse", title: "Warehouse", desc: "Receive goods, pack orders" },
          { href: "/procurement", title: "Procurement officer", desc: "Offers, POs, messages" },
          { href: "/delivery-portal", title: "Delivery portal", desc: "Assign & track drivers" },
          { href: "/admin#orders", title: "Customer orders", desc: "Orders sold by Youth Huza" },
          { href: "/admin#payments", title: "Payments", desc: "Customer & farmer payments" },
        ].map((a) => (
          <a
            key={a.title}
            href={a.href}
            className="rounded-2xl border border-[var(--huza-line)] bg-white p-4 hover:border-[var(--huza-green)] transition"
          >
            <p className="font-semibold text-[var(--huza-green-dark)]">{a.title}</p>
            <p className="text-xs text-[var(--huza-muted)] mt-1">{a.desc}</p>
          </a>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          {
            color: "bg-red-50 border-red-200 text-red-800",
            label: "New / pending orders",
            value: stats.pendingOrders,
          },
          {
            color: "bg-amber-50 border-amber-200 text-amber-900",
            label: "Products low stock",
            value: stats.lowStock,
          },
          {
            color: "bg-emerald-50 border-emerald-200 text-emerald-900",
            label: "Revenue (all confirmed)",
            value: formatRwf(stats.revenue),
          },
          {
            color: "bg-sky-50 border-sky-200 text-sky-900",
            label: "Farmer applications",
            value: pendingSuppliers.length,
          },
        ].map((a) => (
          <div key={a.label} className={`rounded-2xl border p-4 ${a.color}`}>
            <p className="text-xs font-medium opacity-80">{a.label}</p>
            <p className="mt-1 text-xl font-bold">{a.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Customers", value: stats.customers },
          { label: "Farmers", value: stats.suppliers },
          { label: "Products", value: stats.products },
          { label: "Purchase orders", value: stats.purchaseOrders },
          { label: "Customer orders", value: stats.orders },
          { label: "Pending orders", value: stats.pendingOrders },
          { label: "Pending deliveries", value: stats.pendingDeliveries },
          { label: "Low stock", value: stats.lowStock },
          { label: "Revenue", value: formatRwf(stats.revenue) },
          { label: "Expenses", value: formatRwf(stats.expenses) },
          { label: "Profit (est.)", value: formatRwf(stats.profit) },
          { label: "New farmer requests", value: pendingSuppliers.length },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-[var(--huza-line)] bg-white p-4">
            <p className="text-xs text-[var(--huza-muted)]">{s.label}</p>
            <p className="mt-1 text-xl font-bold text-[var(--huza-green-dark)]">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Simple bar chart: top sellers by rating count */}
      <div className="mb-8 rounded-2xl border border-[var(--huza-line)] bg-white p-5">
        <h2 className="font-semibold text-[var(--huza-green-dark)] mb-4">Top-selling products</h2>
        <div className="space-y-3">
          {topProducts.length === 0 ? (
            <p className="text-sm text-[var(--huza-muted)]">No best sellers flagged yet.</p>
          ) : (
            topProducts.map((p) => {
              const max = Math.max(...topProducts.map((x) => x.ratingCount || 1), 1);
              const pct = Math.round(((p.ratingCount || 0) / max) * 100);
              return (
                <div key={p.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{p.nameEn}</span>
                    <span className="text-[var(--huza-muted)]">{p.ratingCount} reviews</span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--huza-mint)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--huza-green)]"
                      style={{ width: `${Math.max(pct, 8)}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <AdminClient
        pendingSuppliers={pendingSuppliers}
        allSuppliers={allSuppliers}
        pendingFarmerProducts={pendingFarmerProducts}
        orders={allOrders}
        deliveries={deliveries}
        payments={payments}
        reviews={reviews}
        lowStock={lowStock}
        topProducts={topProducts}
        promotions={promotions}
        businessHours={businessHours}
        holidays={holidays}
        emergency={emergency}
        deliveryPeople={deliveryPeople}
        auditLogs={auditLogs}
        procurementOffers={procurementOffers}
        purchaseOrders={purchaseOrders}
      />
    </div>
  );
}
