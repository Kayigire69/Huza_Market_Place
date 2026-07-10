"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { formatRwf, formatUnit } from "@/lib/utils";

type Category = { id: string; nameEn: string; slug: string };
type Product = {
  id: string;
  nameEn: string;
  price: number;
  unit: string;
  stockQty: number;
  isActive: boolean;
  category: { nameEn: string };
};
type OrderItem = {
  id: string;
  quantity: number;
  lineTotal: number;
  product: { nameEn: string };
  order: { id: string; orderNumber: string; status: string; createdAt: string | Date };
};

type Supplier = {
  id: string;
  businessName: string;
  description: string | null;
  location: string;
  district: string;
  phone: string;
  availability: string;
  openHour: number;
  closeHour: number;
  status: string;
  products: Product[];
  orders: OrderItem[];
};

export function SupplierPortalClient({
  supplier,
  categories,
}: {
  supplier: Supplier;
  categories: Category[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"products" | "orders" | "profile">("products");
  const [msg, setMsg] = useState("");

  const refresh = () => router.refresh();

  const uploadProduct = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/supplier/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nameEn: form.get("nameEn"),
        nameFr: form.get("nameFr") || form.get("nameEn"),
        nameRw: form.get("nameRw") || form.get("nameEn"),
        descriptionEn: form.get("descriptionEn"),
        descriptionFr: form.get("descriptionEn"),
        descriptionRw: form.get("descriptionEn"),
        price: Number(form.get("price")),
        unit: form.get("unit"),
        stockQty: Number(form.get("stockQty")),
        categoryId: form.get("categoryId"),
        isOrganic: form.get("isOrganic") === "on",
      }),
    });
    const data = await res.json();
    setMsg(res.ok ? "Product uploaded" : data.error || "Failed");
    if (res.ok) {
      (e.target as HTMLFormElement).reset();
      refresh();
    }
  };

  const updateStock = async (productId: string, stockQty: number) => {
    await fetch(`/api/supplier/products/${productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stockQty }),
    });
    refresh();
  };

  const updateProfile = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/supplier/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessName: form.get("businessName"),
        description: form.get("description"),
        location: form.get("location"),
        district: form.get("district"),
        phone: form.get("phone"),
        availability: form.get("availability"),
        openHour: Number(form.get("openHour")),
        closeHour: Number(form.get("closeHour")),
      }),
    });
    setMsg(res.ok ? "Profile updated" : "Update failed");
    refresh();
  };

  const respondOrder = async (orderId: string, accept: boolean) => {
    await fetch("/api/supplier/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, accept }),
    });
    refresh();
  };

  return (
    <div>
      <div className="flex gap-2 mb-6">
        {(["products", "orders", "profile"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${
              tab === t ? "bg-[var(--huza-green)] text-white" : "bg-white border border-[var(--huza-line)]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      {msg && <p className="mb-4 text-sm text-[var(--huza-green-dark)]">{msg}</p>}

      {tab === "products" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <form onSubmit={uploadProduct} className="rounded-2xl border border-[var(--huza-line)] bg-white p-5 space-y-3">
            <h2 className="font-semibold">Upload product</h2>
            <input name="nameEn" placeholder="Product name (EN)" className="input-field" required />
            <input name="nameFr" placeholder="Nom (FR)" className="input-field" />
            <input name="nameRw" placeholder="Izina (RW)" className="input-field" />
            <textarea name="descriptionEn" placeholder="Description" className="input-field min-h-16" required />
            <div className="grid grid-cols-2 gap-2">
              <input name="price" type="number" placeholder="Price (RWF)" className="input-field" required />
              <select name="unit" className="input-field" defaultValue="KG">
                {["KG", "PIECE", "BUNCH", "LITRE", "PACK", "DOZEN"].map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input name="stockQty" type="number" placeholder="Stock" className="input-field" required />
              <select name="categoryId" className="input-field" required>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nameEn}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isOrganic" /> Organic
            </label>
            <Button type="submit" className="w-full" disabled={supplier.status !== "APPROVED"}>
              Upload product
            </Button>
            {supplier.status !== "APPROVED" && (
              <p className="text-xs text-[var(--huza-muted)]">Product upload unlocks after approval.</p>
            )}
          </form>

          <div className="rounded-2xl border border-[var(--huza-line)] bg-white p-5">
            <h2 className="font-semibold mb-4">Inventory</h2>
            <div className="space-y-3 max-h-[480px] overflow-y-auto">
              {supplier.products.map((p) => (
                <div key={p.id} className="rounded-xl border border-[var(--huza-line)] p-3">
                  <div className="flex justify-between gap-2">
                    <div>
                      <p className="font-medium">{p.nameEn}</p>
                      <p className="text-xs text-[var(--huza-muted)]">
                        {p.category.nameEn} · {formatRwf(p.price)}/{formatUnit(p.unit)}
                      </p>
                    </div>
                    <span className={`text-xs ${p.stockQty <= 5 ? "text-red-700" : ""}`}>
                      Stock: {p.stockQty}
                    </span>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <input
                      type="number"
                      defaultValue={p.stockQty}
                      className="input-field"
                      id={`stock-${p.id}`}
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        const el = document.getElementById(`stock-${p.id}`) as HTMLInputElement;
                        updateStock(p.id, Number(el.value));
                      }}
                    >
                      Update
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "orders" && (
        <div className="rounded-2xl border border-[var(--huza-line)] bg-white p-5">
          <h2 className="font-semibold mb-4">Incoming orders</h2>
          {supplier.orders.length === 0 ? (
            <p className="text-sm text-[var(--huza-muted)]">No orders yet.</p>
          ) : (
            <div className="space-y-3">
              {supplier.orders.map((item) => (
                <div key={item.id} className="rounded-xl border border-[var(--huza-line)] p-4">
                  <div className="flex flex-wrap justify-between gap-2">
                    <p className="font-semibold">{item.order.orderNumber}</p>
                    <span className="text-xs bg-[var(--huza-mint)] px-2 py-1 rounded-full">
                      {item.order.status}
                    </span>
                  </div>
                  <p className="text-sm mt-1">
                    {item.product.nameEn} × {item.quantity} · {formatRwf(item.lineTotal)}
                  </p>
                  {item.order.status === "PENDING" || item.order.status === "CONFIRMED" ? (
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" onClick={() => respondOrder(item.order.id, true)}>
                        Accept
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => respondOrder(item.order.id, false)}>
                        Reject
                      </Button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "profile" && (
        <form onSubmit={updateProfile} className="max-w-xl rounded-2xl border border-[var(--huza-line)] bg-white p-5 space-y-3">
          <h2 className="font-semibold">Profile & working hours</h2>
          <input name="businessName" defaultValue={supplier.businessName} className="input-field" required />
          <textarea name="description" defaultValue={supplier.description ?? ""} className="input-field min-h-20" />
          <input name="location" defaultValue={supplier.location} className="input-field" required />
          <input name="district" defaultValue={supplier.district} className="input-field" required />
          <input name="phone" defaultValue={supplier.phone} className="input-field" required />
          <select name="availability" defaultValue={supplier.availability} className="input-field">
            <option value="OPEN">Open</option>
            <option value="BUSY">Busy</option>
            <option value="CLOSED">Closed</option>
          </select>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">Open hour</label>
              <input name="openHour" type="number" min={0} max={23} defaultValue={supplier.openHour} className="input-field" />
            </div>
            <div>
              <label className="label">Close hour</label>
              <input name="closeHour" type="number" min={0} max={23} defaultValue={supplier.closeHour} className="input-field" />
            </div>
          </div>
          <Button type="submit">Save profile</Button>
        </form>
      )}
    </div>
  );
}
