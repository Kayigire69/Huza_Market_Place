"use client";

import { FormEvent, useState, startTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { formatUnit } from "@/lib/utils";

type ProductOpt = { id: string; nameEn: string; stockQty: number; unit: string };
type LowStock = ProductOpt & { lowStockAt: number; barcode: string | null };
type PackOrder = {
  id: string;
  orderNumber: string;
  status: string;
  deliveryAddress: string;
  guestName: string | null;
  guestPhone: string | null;
  user: { fullName: string; phone: string } | null;
  items: { quantity: number; product: { nameEn: string; unit: string } }[];
};
type Movement = {
  id: string;
  type: string;
  quantity: number;
  reason: string | null;
  createdAt: string | Date;
  product: { nameEn: string; unit: string };
};
type Location = { id: string; code: string; name: string };

export function WarehouseClient({
  lowStock,
  packOrders,
  products,
  movements,
  locations,
}: {
  lowStock: LowStock[];
  packOrders: PackOrder[];
  products: ProductOpt[];
  movements: Movement[];
  locations: Location[];
}) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const refresh = () => startTransition(() => router.refresh());

  const callApi = async (body: Record<string, unknown>, method: "POST" | "PATCH" = "POST") => {
    setLoading(true);
    setMsg("");
    const res = await fetch("/api/warehouse", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setLoading(false);
    setMsg(res.ok ? "Saved" : data.error || "Failed");
    if (res.ok) refresh();
    return res.ok;
  };

  const onReceive = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const ok = await callApi({
      action: "receive",
      productId: form.get("productId"),
      qty: Number(form.get("qty")),
      batchNumber: form.get("batchNumber"),
      expiry: form.get("expiry") || null,
      locationCode: form.get("locationCode") || null,
      damage: Number(form.get("damage") || 0),
      notes: form.get("notes") || null,
    });
    if (ok) (e.target as HTMLFormElement).reset();
  };

  const onDamage = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const ok = await callApi(
      {
        action: "damage",
        productId: form.get("productId"),
        qty: Number(form.get("qty")),
        reason: form.get("reason") || "Warehouse damage",
      },
      "PATCH"
    );
    if (ok) (e.target as HTMLFormElement).reset();
  };

  const onCount = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const ok = await callApi(
      {
        action: "count",
        productId: form.get("productId"),
        qty: Number(form.get("qty")),
        reason: form.get("reason") || "Stock count",
      },
      "PATCH"
    );
    if (ok) (e.target as HTMLFormElement).reset();
  };

  return (
    <div className="space-y-8">
      {msg && <p className="text-sm text-[var(--huza-green-dark)]">{msg}</p>}

      <section className="rounded-2xl border border-[var(--huza-line)] bg-white p-5">
        <h2 className="font-semibold text-[var(--huza-green-dark)]">Low stock</h2>
        <p className="text-sm text-[var(--huza-muted)] mt-1 mb-4">
          Products at or below their reorder threshold.
        </p>
        {lowStock.length === 0 ? (
          <p className="text-sm text-[var(--huza-muted)]">No low-stock items.</p>
        ) : (
          <ul className="divide-y divide-[var(--huza-line)]">
            {lowStock.map((p) => (
              <li key={p.id} className="py-3 flex flex-wrap justify-between gap-2 text-sm">
                <span className="font-medium">{p.nameEn}</span>
                <span className="text-[var(--huza-muted)]">
                  {p.stockQty} / {p.lowStockAt} {formatUnit(p.unit)}
                  {p.barcode ? ` · ${p.barcode}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-[var(--huza-line)] bg-white p-5">
        <h2 className="font-semibold text-[var(--huza-green-dark)]">Receive goods</h2>
        <p className="text-sm text-[var(--huza-muted)] mt-1 mb-4">
          Create a goods receipt, stock batch, and RECEIVE movement.
        </p>
        <form onSubmit={onReceive} className="grid sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="label">Product</label>
            <select name="productId" className="input-field" required>
              <option value="">Select product</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nameEn} ({p.stockQty} {formatUnit(p.unit)})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Quantity</label>
            <input name="qty" type="number" min={1} className="input-field" required />
          </div>
          <div>
            <label className="label">Batch number</label>
            <input name="batchNumber" className="input-field" required />
          </div>
          <div>
            <label className="label">Expiry</label>
            <input name="expiry" type="date" className="input-field" />
          </div>
          <div>
            <label className="label">Location code</label>
            <input
              name="locationCode"
              className="input-field"
              list="wh-locations"
              placeholder={locations[0]?.code || "A-01"}
            />
            <datalist id="wh-locations">
              {locations.map((l) => (
                <option key={l.id} value={l.code} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="label">Damaged qty</label>
            <input name="damage" type="number" min={0} defaultValue={0} className="input-field" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Notes</label>
            <input name="notes" className="input-field" />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={loading}>
              Receive goods
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-[var(--huza-line)] bg-white p-5">
        <h2 className="font-semibold text-[var(--huza-green-dark)]">Pack &amp; dispatch</h2>
        <p className="text-sm text-[var(--huza-muted)] mt-1 mb-4">
          Mark orders PACKED or READY_FOR_DISPATCH.
        </p>
        {packOrders.length === 0 ? (
          <p className="text-sm text-[var(--huza-muted)]">No orders to pack.</p>
        ) : (
          <ul className="space-y-3">
            {packOrders.map((o) => {
              const phone = o.user?.phone || o.guestPhone || "—";
              const name = o.user?.fullName || o.guestName || "Guest";
              return (
                <li
                  key={o.id}
                  className="rounded-xl border border-[var(--huza-line)] p-4 flex flex-wrap justify-between gap-3"
                >
                  <div>
                    <p className="font-semibold">{o.orderNumber}</p>
                    <p className="text-sm text-[var(--huza-muted)]">
                      {name} · {phone} · {o.status}
                    </p>
                    <p className="text-xs text-[var(--huza-muted)] mt-1">
                      {o.items
                        .map((i) => `${i.quantity} ${formatUnit(i.product.unit)} ${i.product.nameEn}`)
                        .join(", ")}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 h-fit">
                    {o.status !== "PACKED" && o.status !== "READY_FOR_DISPATCH" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={loading}
                        onClick={() => callApi({ action: "pack", orderId: o.id }, "PATCH")}
                      >
                        Mark PACKED
                      </Button>
                    )}
                    {o.status !== "READY_FOR_DISPATCH" && (
                      <Button
                        size="sm"
                        disabled={loading}
                        onClick={() =>
                          callApi({ action: "ready_for_dispatch", orderId: o.id }, "PATCH")
                        }
                      >
                        Ready for dispatch
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="grid md:grid-cols-2 gap-6">
        <section className="rounded-2xl border border-[var(--huza-line)] bg-white p-5">
          <h2 className="font-semibold text-[var(--huza-green-dark)] mb-3">Record damage</h2>
          <form onSubmit={onDamage} className="space-y-3">
            <select name="productId" className="input-field" required>
              <option value="">Product</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nameEn}
                </option>
              ))}
            </select>
            <input name="qty" type="number" min={1} className="input-field" placeholder="Qty" required />
            <input name="reason" className="input-field" placeholder="Reason" />
            <Button type="submit" variant="danger" size="sm" disabled={loading}>
              Log damage
            </Button>
          </form>
        </section>

        <section className="rounded-2xl border border-[var(--huza-line)] bg-white p-5">
          <h2 className="font-semibold text-[var(--huza-green-dark)] mb-3">Stock count</h2>
          <form onSubmit={onCount} className="space-y-3">
            <select name="productId" className="input-field" required>
              <option value="">Product</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nameEn} (system: {p.stockQty})
                </option>
              ))}
            </select>
            <input
              name="qty"
              type="number"
              min={0}
              className="input-field"
              placeholder="Counted qty"
              required
            />
            <input name="reason" className="input-field" placeholder="Notes" />
            <Button type="submit" size="sm" disabled={loading}>
              Apply count
            </Button>
          </form>
        </section>
      </div>

      <section className="rounded-2xl border border-[var(--huza-line)] bg-white p-5">
        <h2 className="font-semibold text-[var(--huza-green-dark)]">Recent stock movements</h2>
        <p className="text-sm text-[var(--huza-muted)] mt-1 mb-4">Latest RECEIVE, DAMAGE, COUNT, and other moves.</p>
        {movements.length === 0 ? (
          <p className="text-sm text-[var(--huza-muted)]">No movements yet.</p>
        ) : (
          <ul className="divide-y divide-[var(--huza-line)] text-sm">
            {movements.map((m) => (
              <li key={m.id} className="py-3 flex flex-wrap justify-between gap-2">
                <span>
                  <span className="font-medium text-[var(--huza-green-dark)]">{m.type}</span>{" "}
                  {m.quantity} {formatUnit(m.product.unit)} · {m.product.nameEn}
                  {m.reason ? (
                    <span className="text-[var(--huza-muted)]"> — {m.reason}</span>
                  ) : null}
                </span>
                <span className="text-[var(--huza-muted)] text-xs">
                  {new Date(m.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
