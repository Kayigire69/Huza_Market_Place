import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatRwf } from "@/lib/utils";
import { AccountActions } from "./AccountActions";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      addresses: true,
      favorites: { include: { product: { include: { images: true } } } },
      orders: {
        orderBy: { createdAt: "desc" },
        include: { items: { include: { product: true } }, payment: true },
        take: 20,
      },
      notifications: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

  if (!user) redirect("/auth/login");

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
      <h1 className="section-title">My account</h1>
      <p className="mt-2 text-[var(--huza-muted)]">
        Welcome, {user.fullName}
      </p>

      <div className="mt-8 grid lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-[var(--huza-line)] bg-white p-5">
            <h2 className="font-semibold mb-4">Order history</h2>
            {user.orders.length === 0 ? (
              <p className="text-sm text-[var(--huza-muted)]">No orders yet.</p>
            ) : (
              <div className="space-y-3">
                {user.orders.map((o) => (
                  <div key={o.id} className="rounded-xl border border-[var(--huza-line)] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-[var(--huza-muted)]">
                          Order number
                        </p>
                        <p className="font-mono font-semibold text-[var(--huza-green-dark)]">
                          {o.orderNumber}
                        </p>
                      </div>
                      <span className="text-xs rounded-full bg-[var(--huza-mint)] px-2 py-1">
                        {o.status}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--huza-muted)] mt-1">
                      {formatRwf(o.total)} · {o.items.length} items ·{" "}
                      {o.createdAt.toLocaleDateString()}
                    </p>
                    <ul className="mt-2 text-sm text-[var(--huza-muted)]">
                      {o.items.map((i) => (
                        <li key={i.id}>
                          {i.product.nameEn} × {i.quantity}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 flex flex-wrap gap-3 text-sm">
                      <Link
                        href={`/track?orderNumber=${encodeURIComponent(o.orderNumber)}&phone=${encodeURIComponent(user.phone)}`}
                        className="font-semibold text-[var(--huza-green)]"
                      >
                        Track order →
                      </Link>
                      <a
                        href={`/api/invoices/${o.orderNumber}`}
                        className="font-semibold text-[var(--huza-green)]"
                        target="_blank"
                        rel="noreferrer"
                      >
                        View invoice →
                      </a>
                      <a
                        href={`/api/invoices/${o.orderNumber}?format=pdf`}
                        className="font-semibold text-[var(--huza-green)]"
                      >
                        PDF invoice ↓
                      </a>
                      <a
                        href={`/api/receipts/${o.orderNumber}?format=pdf`}
                        className="font-semibold text-[var(--huza-green)]"
                      >
                        PDF receipt ↓
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-[var(--huza-line)] bg-white p-5">
            <h2 className="font-semibold mb-4">Favorite products</h2>
            {user.favorites.length === 0 ? (
              <p className="text-sm text-[var(--huza-muted)]">
                No favorites yet. Browse{" "}
                <Link href="/products" className="text-[var(--huza-green)] font-semibold">
                  products
                </Link>
                .
              </p>
            ) : (
              <ul className="space-y-2">
                {user.favorites.map((f) => (
                  <li key={f.id}>
                    <Link
                      href={`/products/${f.productId}`}
                      className="text-[var(--huza-green-dark)] font-medium hover:underline"
                    >
                      {f.product.nameEn}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-[var(--huza-line)] bg-white p-5">
            <h2 className="font-semibold mb-3">Saved addresses</h2>
            {user.addresses.length === 0 ? (
              <p className="text-sm text-[var(--huza-muted)]">No saved addresses.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {user.addresses.map((a) => (
                  <li key={a.id} className="rounded-lg bg-[var(--huza-mint)] p-3">
                    <p className="font-medium">{a.label}</p>
                    <p className="text-[var(--huza-muted)]">{a.fullAddress}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-[var(--huza-line)] bg-white p-5">
            <h2 className="font-semibold mb-3">Notifications</h2>
            {user.notifications.length === 0 ? (
              <p className="text-sm text-[var(--huza-muted)]">No notifications.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {user.notifications.map((n) => (
                  <li key={n.id} className="border-b border-[var(--huza-line)] pb-2">
                    <p className="font-medium">{n.title}</p>
                    <p className="text-[var(--huza-muted)]">{n.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <AccountActions />
        </aside>
      </div>
    </div>
  );
}
