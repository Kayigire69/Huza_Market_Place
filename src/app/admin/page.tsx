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
          { href: "/admin#suppliers", title: "Farmer Approval", desc: "Review, verify, approve or suspend farmers" },
          { href: "/admin#procurement", title: "Procurement", desc: "POs, receive, inspect, pay" },
          { href: "/warehouse", title: "Warehouse", desc: "Receive goods, pack orders" },
          { href: "/procurement", title: "Procurement officer", desc: "Offers, POs, messages" },
          { href: "/delivery-portal", title: "Delivery portal", desc: "Assign & track drivers" },
          { href: "/admin#orders", title: "Customer orders", desc: "Orders sold by Youth Huza" },
          { href: "/admin#payments", title: "Payments", desc: "Customer & farmer payments" },
          { href: "/support", title: "Support center", desc: "Tickets, returns, complaints" },
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

      <AdminClient
        pendingSuppliers={pendingSuppliers}
        allSuppliers={allSuppliers}
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
