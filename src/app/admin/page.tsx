import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatRwf } from "@/lib/utils";
import { AdminClient } from "./AdminClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") redirect("/auth/login");

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
  ] = await Promise.all([
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.supplier.count(),
    prisma.product.count(),
    prisma.order.count(),
    prisma.order.count({ where: { status: { in: ["PENDING", "CONFIRMED"] } } }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { status: { not: "CANCELLED" } },
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

  const stats = {
    customers,
    suppliers,
    products,
    orders,
    pendingOrders,
    revenue: revenueAgg._sum.total ?? 0,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <h1 className="section-title">Administration dashboard</h1>
      <p className="mt-2 text-[var(--huza-muted)] mb-8">
        Full control of Huza Market Place by Youth Huza
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Customers", value: stats.customers },
          { label: "Suppliers", value: stats.suppliers },
          { label: "Products", value: stats.products },
          { label: "Orders", value: stats.orders },
          { label: "Pending orders", value: stats.pendingOrders },
          { label: "Revenue", value: formatRwf(stats.revenue) },
          { label: "Low stock", value: lowStock.length },
          { label: "New supplier requests", value: pendingSuppliers.length },
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
      />
    </div>
  );
}
