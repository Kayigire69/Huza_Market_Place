"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { formatRwf, formatUnit } from "@/lib/utils";

type Category = { id: string; nameEn: string; slug: string };
type Offer = {
  id: string;
  title: string;
  description: string | null;
  unit: string;
  quantityOffered: number;
  askPrice: number;
  suggestedRetail: number | null;
  status: string;
  adminNote: string | null;
  purchasedQty: number | null;
  category: { nameEn: string } | null;
};

type PurchaseOrder = {
  id: string;
  poNumber: string;
  status: string;
  productName: string;
  quantity: number;
  unit: string;
  negotiatedPrice: number;
  totalAmount: number;
  paymentRef: string | null;
  paymentMethod: string | null;
  paidAt: string | Date | null;
  notes: string | null;
  orderedAt: string | Date | null;
};

type ProductRow = {
  id: string;
  nameEn: string;
  price: number;
  unit: string;
  stockQty: number;
  lowStockAt: number;
  isActive: boolean;
  isOrganic: boolean;
  category?: { nameEn: string } | null;
};

type Farmer = {
  id: string;
  businessName: string;
  description: string | null;
  location: string;
  district: string;
  sector: string | null;
  phone: string;
  email: string | null;
  nationalId: string | null;
  companyRegNo: string | null;
  tin: string | null;
  farmSize: string | null;
  productionCapacity: string | null;
  productCategories: string | null;
  paymentMomo: string | null;
  bankAccount: string | null;
  bankName: string | null;
  nationalIdUrl: string | null;
  businessCertUrl: string | null;
  foodSafetyUrl: string | null;
  organicCertUrl: string | null;
  availability: string;
  openHour: number;
  closeHour: number;
  status: string;
  offers: Offer[];
  purchaseOrders?: PurchaseOrder[];
  products?: ProductRow[];
};

type Tab = "products" | "inventory" | "orders" | "offers" | "profile";

const TABS: { key: Tab; label: string }[] = [
  { key: "products", label: "Products" },
  { key: "inventory", label: "Inventory" },
  { key: "orders", label: "Incoming orders" },
  { key: "offers", label: "Wholesale offers" },
  { key: "profile", label: "Profile" },
];

export function FarmerPortalClient({
  farmer,
  categories,
}: {
  farmer: Farmer;
  categories: Category[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("products");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [products, setProducts] = useState<ProductRow[]>(farmer.products || []);
  const [editingId, setEditingId] = useState<string | null>(null);

  const refresh = () => router.refresh();
  const purchaseOrders = farmer.purchaseOrders || [];
  const approved = farmer.status === "APPROVED";

  useEffect(() => {
    setProducts(farmer.products || []);
  }, [farmer.products]);

  const loadProducts = async () => {
    const res = await fetch("/api/supplier/products");
    const data = await res.json();
    if (Array.isArray(data)) setProducts(data);
  };

  const createProduct = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!approved) {
      setMsg("Wait for admin approval before uploading products.");
      return;
    }
    setBusy(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/supplier/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nameEn: form.get("nameEn"),
        descriptionEn: form.get("descriptionEn"),
        categoryId: form.get("categoryId"),
        price: Number(form.get("price")),
        unit: form.get("unit"),
        stockQty: Number(form.get("stockQty")),
        isOrganic: form.get("isOrganic") === "on",
        originDistrict: form.get("originDistrict") || farmer.district,
      }),
    });
    const data = await res.json();
    setBusy(false);
    setMsg(res.ok ? "Product uploaded" : data.error || "Upload failed");
    if (res.ok) {
      (e.target as HTMLFormElement).reset();
      await loadProducts();
      refresh();
    }
  };

  const saveProduct = async (e: FormEvent<HTMLFormElement>, id: string) => {
    e.preventDefault();
    setBusy(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch(`/api/supplier/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nameEn: form.get("nameEn"),
        price: Number(form.get("price")),
        stockQty: Number(form.get("stockQty")),
        isActive: form.get("isActive") === "on",
      }),
    });
    const data = await res.json();
    setBusy(false);
    setMsg(res.ok ? "Product updated" : data.error || "Update failed");
    if (res.ok) {
      setEditingId(null);
      await loadProducts();
      refresh();
    }
  };

  const updateStock = async (id: string, stockQty: number) => {
    setBusy(true);
    const res = await fetch(`/api/supplier/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stockQty }),
    });
    const data = await res.json();
    setBusy(false);
    setMsg(res.ok ? "Inventory updated" : data.error || "Update failed");
    if (res.ok) {
      await loadProducts();
      refresh();
    }
  };

  const submitOffer = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/supplier/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.get("title"),
        description: form.get("description"),
        categoryId: form.get("categoryId") || null,
        unit: form.get("unit"),
        quantityOffered: Number(form.get("quantityOffered")),
        askPrice: Number(form.get("askPrice")),
        suggestedRetail: form.get("suggestedRetail")
          ? Number(form.get("suggestedRetail"))
          : null,
      }),
    });
    const data = await res.json();
    setMsg(res.ok ? "Offer sent to Youth Huza" : data.error || "Failed");
    if (res.ok) {
      (e.target as HTMLFormElement).reset();
      refresh();
    }
  };

  const acceptPo = async (poId: string) => {
    setBusy(true);
    const res = await fetch("/api/supplier/pos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ poId, action: "accept" }),
    });
    const data = await res.json();
    setBusy(false);
    setMsg(res.ok ? "Purchase order accepted" : data.error || "Accept failed");
    if (res.ok) refresh();
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
        sector: form.get("sector"),
        phone: form.get("phone"),
        email: form.get("email"),
        nationalId: form.get("nationalId"),
        companyRegNo: form.get("companyRegNo"),
        tin: form.get("tin"),
        farmSize: form.get("farmSize"),
        productionCapacity: form.get("productionCapacity"),
        productCategories: form.get("productCategories"),
        paymentMomo: form.get("paymentMomo"),
        bankAccount: form.get("bankAccount"),
        bankName: form.get("bankName"),
        nationalIdUrl: form.get("nationalIdUrl"),
        businessCertUrl: form.get("businessCertUrl"),
        foodSafetyUrl: form.get("foodSafetyUrl"),
        organicCertUrl: form.get("organicCertUrl"),
        availability: form.get("availability"),
        openHour: Number(form.get("openHour")),
        closeHour: Number(form.get("closeHour")),
      }),
    });
    setMsg(res.ok ? "Profile updated" : "Update failed");
    refresh();
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              tab === key
                ? "bg-[var(--huza-green)] text-white"
                : "bg-white border border-[var(--huza-line)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {msg && <p className="mb-4 text-sm text-[var(--huza-green-dark)]">{msg}</p>}

      {tab === "products" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <form
            onSubmit={createProduct}
            className="rounded-2xl border border-[var(--huza-line)] bg-white p-5 space-y-3"
          >
            <h2 className="font-semibold">Upload product</h2>
            <p className="text-xs text-[var(--huza-muted)]">
              Add produce Youth Huza can buy from your farm. Customers never see your farm name —
              Huza sells under HUZA FRESH.
            </p>
            <input name="nameEn" placeholder="Product name" className="input-field" required />
            <textarea
              name="descriptionEn"
              placeholder="Description, harvest notes, quality..."
              className="input-field min-h-16"
            />
            <select name="categoryId" className="input-field" required>
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameEn}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input
                name="price"
                type="number"
                placeholder="Wholesale ask (RWF)"
                className="input-field"
                required
              />
              <select name="unit" className="input-field" defaultValue="KG">
                {["KG", "PIECE", "BUNCH", "LITRE", "PACK", "DOZEN"].map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                name="stockQty"
                type="number"
                placeholder="Available stock"
                className="input-field"
                required
              />
              <input
                name="originDistrict"
                placeholder="Origin district"
                defaultValue={farmer.district}
                className="input-field"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input name="isOrganic" type="checkbox" /> Organic
            </label>
            <Button type="submit" className="w-full" disabled={busy || !approved}>
              Upload product
            </Button>
            {!approved && (
              <p className="text-xs text-[var(--huza-muted)]">
                Product upload unlocks after admin approval.
              </p>
            )}
          </form>

          <div className="rounded-2xl border border-[var(--huza-line)] bg-white p-5">
            <h2 className="font-semibold mb-4">Your products</h2>
            <div className="space-y-3 max-h-[560px] overflow-y-auto">
              {products.length === 0 ? (
                <p className="text-sm text-[var(--huza-muted)]">No products uploaded yet.</p>
              ) : (
                products.map((p) => (
                  <div key={p.id} className="rounded-xl border border-[var(--huza-line)] p-3">
                    {editingId === p.id ? (
                      <form onSubmit={(e) => saveProduct(e, p.id)} className="space-y-2">
                        <input
                          name="nameEn"
                          defaultValue={p.nameEn}
                          className="input-field"
                          required
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            name="price"
                            type="number"
                            defaultValue={p.price}
                            className="input-field"
                            required
                          />
                          <input
                            name="stockQty"
                            type="number"
                            defaultValue={p.stockQty}
                            className="input-field"
                            required
                          />
                        </div>
                        <label className="flex items-center gap-2 text-sm">
                          <input name="isActive" type="checkbox" defaultChecked={p.isActive} /> Active
                        </label>
                        <div className="flex gap-2">
                          <Button type="submit" size="sm" disabled={busy}>
                            Save
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="flex justify-between gap-2">
                          <p className="font-medium">{p.nameEn}</p>
                          <span className="text-xs rounded-full bg-[var(--huza-mint)] px-2 py-1 h-fit">
                            {p.isActive ? "Active" : "Hidden"}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--huza-muted)] mt-1">
                          {formatRwf(p.price)}/{formatUnit(p.unit)} · Stock {p.stockQty}{" "}
                          {formatUnit(p.unit)}
                          {p.category ? ` · ${p.category.nameEn}` : ""}
                        </p>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="mt-2"
                          onClick={() => setEditingId(p.id)}
                        >
                          Edit product
                        </Button>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "inventory" && (
        <div className="rounded-2xl border border-[var(--huza-line)] bg-white p-5">
          <h2 className="font-semibold mb-1">Inventory management</h2>
          <p className="text-xs text-[var(--huza-muted)] mb-4">
            Update available stock for each product. Low-stock items are highlighted.
          </p>
          {products.length === 0 ? (
            <p className="text-sm text-[var(--huza-muted)]">Upload products first.</p>
          ) : (
            <div className="space-y-3">
              {products.map((p) => {
                const low = p.stockQty <= (p.lowStockAt || 5);
                return (
                  <div
                    key={p.id}
                    className={`rounded-xl border p-3 flex flex-wrap items-end justify-between gap-3 ${
                      low ? "border-[var(--huza-gold)] bg-[#FFF8E6]" : "border-[var(--huza-line)]"
                    }`}
                  >
                    <div>
                      <p className="font-medium">{p.nameEn}</p>
                      <p className="text-xs text-[var(--huza-muted)]">
                        Current: {p.stockQty} {formatUnit(p.unit)}
                        {low ? " · Low stock" : ""}
                      </p>
                    </div>
                    <form
                      className="flex items-end gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const form = new FormData(e.currentTarget);
                        updateStock(p.id, Number(form.get("stockQty")));
                      }}
                    >
                      <div>
                        <label className="label">New stock</label>
                        <input
                          name="stockQty"
                          type="number"
                          min={0}
                          defaultValue={p.stockQty}
                          className="input-field w-28"
                          required
                        />
                      </div>
                      <Button type="submit" size="sm" disabled={busy}>
                        Update
                      </Button>
                    </form>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === "orders" && (
        <div className="rounded-2xl border border-[var(--huza-line)] bg-white p-5">
          <h2 className="font-semibold mb-1">Incoming orders from Youth Huza</h2>
          <p className="text-xs text-[var(--huza-muted)] mb-4">
            These are purchase orders when Huza buys from your farm — not customer storefront
            orders.
          </p>
          {purchaseOrders.length === 0 ? (
            <p className="text-sm text-[var(--huza-muted)]">No incoming orders yet.</p>
          ) : (
            <div className="space-y-3">
              {purchaseOrders.map((po) => (
                <div key={po.id} className="rounded-xl border border-[var(--huza-line)] p-3">
                  <div className="flex flex-wrap justify-between gap-2">
                    <p className="font-medium">
                      {po.poNumber} · {po.productName}
                    </p>
                    <span className="text-xs rounded-full bg-[var(--huza-mint)] px-2 py-1 h-fit">
                      {po.status}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--huza-muted)] mt-1">
                    {po.quantity} {formatUnit(po.unit)} · {formatRwf(po.negotiatedPrice)}/
                    {formatUnit(po.unit)} · Total {formatRwf(po.totalAmount)}
                  </p>
                  {po.notes && (
                    <p className="text-xs text-[var(--huza-muted)] mt-1 whitespace-pre-wrap">
                      {po.notes}
                    </p>
                  )}
                  {po.status === "DRAFT" && (
                    <div className="mt-3">
                      <Button
                        type="button"
                        size="sm"
                        disabled={busy}
                        onClick={() => acceptPo(po.id)}
                      >
                        Accept order
                      </Button>
                    </div>
                  )}
                  {po.status === "PAID" && po.paymentRef && (
                    <p className="text-sm text-[var(--huza-green-dark)] mt-2 font-medium">
                      Paid · Ref: {po.paymentRef}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "offers" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <form
            onSubmit={submitOffer}
            className="rounded-2xl border border-[var(--huza-line)] bg-white p-5 space-y-3"
          >
            <h2 className="font-semibold">Submit wholesale offer</h2>
            <p className="text-xs text-[var(--huza-muted)]">
              Optional: offer a batch for Huza procurement to review and create a purchase order.
            </p>
            <input
              name="title"
              placeholder="Product name (e.g. Fresh Avocados)"
              className="input-field"
              required
            />
            <textarea
              name="description"
              placeholder="Quality, harvest date, notes..."
              className="input-field min-h-16"
            />
            <select name="categoryId" className="input-field">
              <option value="">Category (optional)</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameEn}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input
                name="quantityOffered"
                type="number"
                step="0.1"
                placeholder="Quantity"
                className="input-field"
                required
              />
              <select name="unit" className="input-field" defaultValue="KG">
                {["KG", "PIECE", "BUNCH", "LITRE", "PACK", "DOZEN"].map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                name="askPrice"
                type="number"
                placeholder="Ask price (RWF / unit)"
                className="input-field"
                required
              />
              <input
                name="suggestedRetail"
                type="number"
                placeholder="Suggested retail (optional)"
                className="input-field"
              />
            </div>
            <Button type="submit" className="w-full" disabled={!approved}>
              Submit offer
            </Button>
          </form>

          <div className="rounded-2xl border border-[var(--huza-line)] bg-white p-5">
            <h2 className="font-semibold mb-4">Offer status</h2>
            <div className="space-y-3 max-h-[520px] overflow-y-auto">
              {farmer.offers.length === 0 ? (
                <p className="text-sm text-[var(--huza-muted)]">No offers yet.</p>
              ) : (
                farmer.offers.map((o) => (
                  <div key={o.id} className="rounded-xl border border-[var(--huza-line)] p-3">
                    <div className="flex justify-between gap-2">
                      <p className="font-medium">{o.title}</p>
                      <span className="text-xs rounded-full bg-[var(--huza-mint)] px-2 py-1 h-fit">
                        {o.status}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--huza-muted)] mt-1">
                      {o.quantityOffered} {formatUnit(o.unit)} · Ask {formatRwf(o.askPrice)}/
                      {formatUnit(o.unit)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "profile" && (
        <form
          onSubmit={updateProfile}
          className="max-w-3xl rounded-2xl border border-[var(--huza-line)] bg-white p-5 space-y-3"
        >
          <h2 className="font-semibold">Farm profile &amp; documents</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              name="businessName"
              defaultValue={farmer.businessName}
              className="input-field"
              required
            />
            <input name="phone" defaultValue={farmer.phone} className="input-field" required />
            <input
              name="email"
              defaultValue={farmer.email ?? ""}
              className="input-field"
              placeholder="Email"
            />
            <input
              name="nationalId"
              defaultValue={farmer.nationalId ?? ""}
              className="input-field"
              placeholder="National ID"
            />
            <input name="location" defaultValue={farmer.location} className="input-field" required />
            <input name="district" defaultValue={farmer.district} className="input-field" required />
            <input
              name="sector"
              defaultValue={farmer.sector ?? ""}
              className="input-field"
              placeholder="Sector"
            />
            <input
              name="productCategories"
              defaultValue={farmer.productCategories ?? ""}
              className="input-field"
              placeholder="Product categories"
            />
            <input
              name="farmSize"
              defaultValue={farmer.farmSize ?? ""}
              className="input-field"
              placeholder="Farm size"
            />
            <input
              name="productionCapacity"
              defaultValue={farmer.productionCapacity ?? ""}
              className="input-field"
              placeholder="Production capacity"
            />
            <input
              name="paymentMomo"
              defaultValue={farmer.paymentMomo ?? ""}
              className="input-field"
              placeholder="MoMo number"
            />
            <input
              name="bankAccount"
              defaultValue={farmer.bankAccount ?? ""}
              className="input-field"
              placeholder="Bank account"
            />
            <input
              name="bankName"
              defaultValue={farmer.bankName ?? ""}
              className="input-field"
              placeholder="Bank name"
            />
            <input
              name="tin"
              defaultValue={farmer.tin ?? ""}
              className="input-field"
              placeholder="TIN"
            />
            <input
              name="companyRegNo"
              defaultValue={farmer.companyRegNo ?? ""}
              className="input-field"
              placeholder="Company reg. no."
            />
            <input
              name="nationalIdUrl"
              defaultValue={farmer.nationalIdUrl ?? ""}
              className="input-field"
              placeholder="National ID doc URL"
            />
            <input
              name="businessCertUrl"
              defaultValue={farmer.businessCertUrl ?? ""}
              className="input-field"
              placeholder="Business cert URL"
            />
            <input
              name="foodSafetyUrl"
              defaultValue={farmer.foodSafetyUrl ?? ""}
              className="input-field"
              placeholder="Food safety cert URL"
            />
            <input
              name="organicCertUrl"
              defaultValue={farmer.organicCertUrl ?? ""}
              className="input-field"
              placeholder="Organic cert URL"
            />
          </div>
          <textarea
            name="description"
            defaultValue={farmer.description ?? ""}
            className="input-field min-h-20"
          />
          <select name="availability" defaultValue={farmer.availability} className="input-field">
            <option value="OPEN">Open / available</option>
            <option value="BUSY">Busy</option>
            <option value="CLOSED">Closed</option>
          </select>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">Open hour</label>
              <input
                name="openHour"
                type="number"
                min={0}
                max={23}
                defaultValue={farmer.openHour}
                className="input-field"
              />
            </div>
            <div>
              <label className="label">Close hour</label>
              <input
                name="closeHour"
                type="number"
                min={0}
                max={23}
                defaultValue={farmer.closeHour}
                className="input-field"
              />
            </div>
          </div>
          <Button type="submit">Save farm profile</Button>
        </form>
      )}
    </div>
  );
}
