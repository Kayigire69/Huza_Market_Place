"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatRwf, formatUnit } from "@/lib/utils";
import { Search, Star, X } from "lucide-react";

type FarmerRow = {
  id: string;
  businessName: string;
  fullName: string;
  phone: string;
  email?: string | null;
  district: string;
  status: string;
  productsSubmitted: number;
  productsApproved?: number;
  productsPending?: number;
  purchaseOrders?: number;
  totalPaidRwf?: number;
  ratingAvg?: number;
  ratingCount?: number;
  isVerified?: boolean;
  farmingType?: string | null;
  createdAt: string;
};

type FarmerProfile = FarmerRow & {
  sector?: string | null;
  location?: string;
  province?: string | null;
  farmSize?: string | null;
  verificationBadge?: string | null;
  paymentMomo?: string | null;
  bankAccount?: string | null;
  bankName?: string | null;
  paymentOption?: string | null;
  adminNotes?: string | null;
  rejectionReason?: string | null;
  inspectionScheduledAt?: string | null;
  approvedAt?: string | null;
  nationalIdUrl?: string | null;
  businessCertUrl?: string | null;
  farmPhotoUrls?: string[];
  productsOffered?: string | null;
  huzaPurchaseAgreement?: string | null;
  currentCrop?: string | null;
  cell?: string | null;
  village?: string | null;
  gender?: string | null;
  ageRange?: string | null;
  fieldType?: string | null;
  pastCropsSeason1?: string | null;
  pastCropsSeason2?: string | null;
  pastCropsSeason3?: string | null;
  chemicalsPerWeek?: string | null;
  chemicalsWhy?: string | null;
  chemicalsDosage?: string | null;
  fertilizerPerWeek?: string | null;
  irrigationMethod?: string | null;
  diseasesIdentified?: string | null;
  pestsIdentified?: string | null;
  totalQuantityHarvested?: string | null;
  qualityGeneral?: string | null;
  farmerComments?: string | null;
  stats?: {
    productsSubmitted: number;
    productsApproved: number;
    productsPending: number;
    offers: number;
    purchaseOrders: number;
    totalPaidRwf: number;
    paidCount: number;
    totalKgsBoughtByHuza: number;
  };
  products?: {
    id: string;
    nameEn: string;
    price: number;
    stockQty: number;
    unit: string;
    isActive: boolean;
    reviewStatus: string | null;
    createdAt: string;
  }[];
  purchaseOrdersList?: {
    id: string;
    poNumber: string;
    productName: string;
    status: string;
    quantity: number;
    negotiatedPrice: number;
    totalAmount: number;
    createdAt: string;
  }[];
  offers?: {
    id: string;
    title: string;
    status: string;
    quantityOffered: number;
    askPrice: number;
    unit: string;
    createdAt: string;
  }[];
  payments?: {
    id: string;
    poNumber: string;
    productName: string;
    amount: number;
    paidAt: string | null;
    paymentRef: string | null;
    paymentMethod: string | null;
  }[];
};

type TabKey = "pending" | "approved" | "suspended";
type ProfileTab = "profile" | "products" | "purchases" | "payments";

const TABS: { key: TabKey; label: string }[] = [
  { key: "pending", label: "Pending Approval" },
  { key: "approved", label: "Approved" },
  { key: "suspended", label: "Suspended" },
];

export function AdminFarmersClient() {
  const [tab, setTab] = useState<TabKey>("pending");
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [farmers, setFarmers] = useState<FarmerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [profile, setProfile] = useState<FarmerProfile | null>(null);
  const [profileTab, setProfileTab] = useState<ProfileTab>("profile");
  const [notes, setNotes] = useState("");
  const [farmDetails, setFarmDetails] = useState<Record<string, string>>({});
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ tab });
      if (debouncedQ) params.set("q", debouncedQ);
      const res = await fetch(`/api/admin/suppliers?${params}`);
      const data = await res.json();
      if (res.ok) setFarmers(data.farmers || []);
      else setMsg(data.error || "Failed to load farmers");
    } catch {
      setMsg("Failed to load farmers");
    } finally {
      setLoading(false);
    }
  }, [tab, debouncedQ]);

  useEffect(() => {
    void load();
  }, [load]);

  const openProfile = async (id: string) => {
    setLoadingProfile(true);
    setProfileTab("profile");
    try {
      const res = await fetch(`/api/admin/suppliers?id=${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load profile");
      const f = data.farmer;
      setProfile({
        ...f,
        purchaseOrdersList: f.purchaseOrders || [],
      });
      setNotes(f.adminNotes || "");
      setFarmDetails({
        businessName: f.businessName || "",
        province: f.province || "",
        district: f.district || "",
        sector: f.sector || "",
        cell: f.cell || "",
        village: f.village || "",
        farmSize: f.farmSize || "",
        fieldType: f.fieldType || "",
        currentCrop: f.currentCrop || f.productsOffered || "",
        pastCropsSeason1: f.pastCropsSeason1 || "",
        pastCropsSeason2: f.pastCropsSeason2 || "",
        pastCropsSeason3: f.pastCropsSeason3 || "",
        chemicalsPerWeek: f.chemicalsPerWeek || "",
        fertilizerPerWeek: f.fertilizerPerWeek || "",
        irrigationMethod: f.irrigationMethod || "",
        diseasesIdentified: f.diseasesIdentified || "",
        pestsIdentified: f.pestsIdentified || "",
        totalQuantityHarvested: f.totalQuantityHarvested || "",
        qualityGeneral: f.qualityGeneral || "",
        farmerComments: f.farmerComments || "",
        gender: f.gender || "",
        ageRange: f.ageRange || "",
      });
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setLoadingProfile(false);
    }
  };

  const act = async (
    id: string,
    action: "approve" | "reject" | "suspend" | "reactivate"
  ) => {
    setBusy(id);
    try {
      const reason =
        action === "reject"
          ? window.prompt("Rejection reason", "Incomplete documents") || undefined
          : undefined;
      const res = await fetch("/api/admin/suppliers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");
      setMsg(`Farmer ${action}d`);
      setProfile(null);
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(null);
    }
  };

  const saveNotes = async () => {
    if (!profile) return;
    setBusy(profile.id);
    const res = await fetch("/api/admin/suppliers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: profile.id, action: "save_notes", adminNotes: notes }),
    });
    setBusy(null);
    setMsg(res.ok ? "Notes saved" : "Could not save notes");
  };

  const saveFarmDetails = async () => {
    if (!profile) return;
    setBusy(profile.id);
    const res = await fetch("/api/admin/suppliers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: profile.id,
        action: "save_farm_details",
        farmDetails,
      }),
    });
    setBusy(null);
    if (res.ok) {
      setMsg("Farm details saved");
      await openProfile(profile.id);
    } else {
      const data = await res.json().catch(() => ({}));
      setMsg(data.error || "Could not save farm details");
    }
  };

  const notify = async () => {
    if (!profile) return;
    const body = window.prompt("Message to farmer", "Please update your documents.");
    if (!body) return;
    setBusy(profile.id);
    const res = await fetch("/api/admin/suppliers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: profile.id,
        action: "notify",
        adminNotes: { title: "Message from Youth Huza", body },
      }),
    });
    setBusy(null);
    setMsg(res.ok ? "Notification sent" : "Could not notify");
  };

  const scheduleInspection = async () => {
    if (!profile) return;
    const when = window.prompt(
      "Inspection date/time (YYYY-MM-DDTHH:mm)",
      new Date(Date.now() + 86400000).toISOString().slice(0, 16)
    );
    if (!when) return;
    setBusy(profile.id);
    const res = await fetch("/api/admin/suppliers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: profile.id,
        action: "schedule_inspection",
        inspectionScheduledAt: new Date(when).toISOString(),
      }),
    });
    setBusy(null);
    if (res.ok) {
      setMsg("Inspection scheduled");
      await openProfile(profile.id);
    } else setMsg("Could not schedule");
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="admin-panel-title">Farmers</h1>
      </div>

      {msg ? (
        <p className="rounded-lg border border-[var(--admin-line)] bg-[var(--admin-soft)] px-3 py-2 text-sm">
          {msg}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`admin-filter-chip ${tab === t.key ? "is-active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <label className="relative block max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--admin-muted)]" />
        <input
          className="admin-input pl-9"
          placeholder="Search name, phone, district…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </label>

      {loading ? (
        <p className="text-sm text-[var(--admin-muted)]">Loading…</p>
      ) : farmers.length === 0 ? (
        <div className="admin-panel p-6 text-sm text-[var(--admin-muted)]">
          No farmers in this view.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {farmers.map((f) => (
            <article key={f.id} className="admin-cat-card">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-base font-semibold">{f.fullName || f.businessName}</h2>
                  <p className="mt-0.5 text-sm text-[var(--admin-muted)]">{f.businessName}</p>
                </div>
                {f.isVerified ? (
                  <span className="admin-status admin-status-ok">Verified</span>
                ) : null}
              </div>
              <dl className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-[var(--admin-muted)]">Phone</dt>
                  <dd className="font-medium">{f.phone}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-[var(--admin-muted)]">District</dt>
                  <dd className="font-medium">{f.district}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-[var(--admin-muted)]">Products</dt>
                  <dd className="font-semibold tabular-nums">
                    {f.productsSubmitted}
                    {f.productsPending ? (
                      <span className="font-normal text-amber-700"> · {f.productsPending} pending</span>
                    ) : null}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-[var(--admin-muted)]">Paid to farmer</dt>
                  <dd className="font-semibold tabular-nums">
                    {formatRwf(f.totalPaidRwf || 0)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-[var(--admin-muted)]">Rating</dt>
                  <dd className="inline-flex items-center gap-1 font-semibold">
                    <Star className="size-3.5 fill-amber-400 text-amber-400" />
                    {(f.ratingAvg || 0).toFixed(1)}
                    <span className="font-normal text-[var(--admin-muted)]">
                      ({f.ratingCount || 0})
                    </span>
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-[var(--admin-muted)]">Status</dt>
                  <dd>
                    <span className="admin-status admin-status-warn">{f.status}</span>
                  </dd>
                </div>
              </dl>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--admin-line)] pt-3">
                {tab === "pending" ? (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      disabled={busy === f.id}
                      onClick={() => void act(f.id, "approve")}
                    >
                      Approve
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="danger"
                      disabled={busy === f.id}
                      onClick={() => void act(f.id, "reject")}
                    >
                      Reject
                    </Button>
                  </>
                ) : null}
                {tab === "approved" ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={busy === f.id}
                    onClick={() => void act(f.id, "suspend")}
                  >
                    Suspend
                  </Button>
                ) : null}
                {tab === "suspended" && f.status === "SUSPENDED" ? (
                  <Button
                    type="button"
                    size="sm"
                    disabled={busy === f.id}
                    onClick={() => void act(f.id, "reactivate")}
                  >
                    Reactivate
                  </Button>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={loadingProfile}
                  onClick={() => void openProfile(f.id)}
                >
                  View
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      {profile ? (
        <div className="admin-drawer-backdrop" onClick={() => setProfile(null)}>
          <aside
            className="admin-drawer max-w-lg"
            style={{ width: "min(520px, 100%)" }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
          >
            <div className="flex items-center justify-between border-b border-[var(--admin-line)] px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold">{profile.fullName}</h2>
                <p className="text-xs text-[var(--admin-muted)]">{profile.businessName}</p>
              </div>
              <button type="button" className="admin-icon-btn" onClick={() => setProfile(null)}>
                <X className="size-4" />
              </button>
            </div>

            <div className="flex gap-1 overflow-x-auto border-b border-[var(--admin-line)] px-3 py-2">
              {(
                [
                  ["profile", "Profile"],
                  ["products", "Products"],
                  ["purchases", "Purchases"],
                  ["payments", "Payments"],
                ] as [ProfileTab, string][]
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className={`admin-filter-chip shrink-0 ${profileTab === key ? "is-active" : ""}`}
                  onClick={() => setProfileTab(key)}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-5 text-sm">
              {profileTab === "profile" ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-[var(--admin-muted)]">Phone</p>
                      <p className="font-medium">{profile.phone}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--admin-muted)]">Email</p>
                      <p className="font-medium">{profile.email || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--admin-muted)]">District</p>
                      <p className="font-medium">{profile.district}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--admin-muted)]">Type</p>
                      <p className="font-medium">{profile.farmingType || "—"}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 rounded-lg bg-[var(--admin-soft)] p-3">
                    <div>
                      <p className="text-[10px] uppercase text-[var(--admin-muted)]">Submitted</p>
                      <p className="text-lg font-bold">{profile.stats?.productsSubmitted ?? 0}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-[var(--admin-muted)]">Approved</p>
                      <p className="text-lg font-bold">{profile.stats?.productsApproved ?? 0}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-[var(--admin-muted)]">POs</p>
                      <p className="text-lg font-bold">{profile.stats?.purchaseOrders ?? 0}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-[var(--admin-muted)]">Paid</p>
                      <p className="text-lg font-bold">
                        {formatRwf(profile.stats?.totalPaidRwf || 0)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Star className="size-4 fill-amber-400 text-amber-400" />
                    <span className="font-semibold">{(profile.ratingAvg || 0).toFixed(1)}</span>
                    <span className="text-[var(--admin-muted)]">
                      · {profile.ratingCount || 0} ratings
                    </span>
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase text-[var(--admin-muted)]">
                      Payment details
                    </p>
                    <p>MoMo: {profile.paymentMomo || "—"}</p>
                    <p>
                      Bank: {profile.bankName || "—"} {profile.bankAccount || ""}
                    </p>
                    <p>Preference: {profile.paymentOption || "—"}</p>
                    {profile.status !== "APPROVED" ? (
                      <p className="mt-1 text-xs text-amber-800">
                        Farmers add MoMo/bank in Settings after approval.
                      </p>
                    ) : null}
                  </div>

                  <div className="rounded-lg border border-[var(--admin-line)] p-3">
                    <p className="mb-2 text-xs font-semibold uppercase text-[var(--admin-muted)]">
                      Farm details (agent visit)
                    </p>
                    <p className="mb-3 text-xs text-[var(--admin-muted)]">
                      Optional fields agents can complete while the farmer is pending.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {(
                        [
                          ["fieldType", "Field type"],
                          ["farmSize", "Farm size"],
                          ["currentCrop", "Current crop(s)"],
                          ["totalQuantityHarvested", "Qty harvested"],
                          ["qualityGeneral", "Quality"],
                          ["irrigationMethod", "Irrigation"],
                          ["chemicalsPerWeek", "Chemicals / week"],
                          ["fertilizerPerWeek", "Fertilizer / week"],
                          ["diseasesIdentified", "Diseases"],
                          ["pestsIdentified", "Pests"],
                          ["province", "Province"],
                          ["district", "District"],
                          ["sector", "Sector"],
                          ["cell", "Cell"],
                          ["village", "Village"],
                        ] as const
                      ).map(([key, label]) => (
                        <label key={key} className="block text-xs">
                          <span className="text-[var(--admin-muted)]">{label}</span>
                          <input
                            className="admin-input mt-0.5"
                            value={farmDetails[key] || ""}
                            onChange={(e) =>
                              setFarmDetails((prev) => ({ ...prev, [key]: e.target.value }))
                            }
                          />
                        </label>
                      ))}
                      <label className="col-span-2 block text-xs">
                        <span className="text-[var(--admin-muted)]">Comments</span>
                        <textarea
                          className="admin-input mt-0.5 min-h-[60px]"
                          value={farmDetails.farmerComments || ""}
                          onChange={(e) =>
                            setFarmDetails((prev) => ({
                              ...prev,
                              farmerComments: e.target.value,
                            }))
                          }
                        />
                      </label>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      className="mt-3"
                      disabled={busy === profile.id}
                      onClick={() => void saveFarmDetails()}
                    >
                      Save farm details
                    </Button>
                  </div>

                  {profile.inspectionScheduledAt ? (
                    <p className="text-xs text-amber-800">
                      Inspection: {new Date(profile.inspectionScheduledAt).toLocaleString()}
                    </p>
                  ) : null}

                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold uppercase text-[var(--admin-muted)]">
                      Admin notes
                    </span>
                    <textarea
                      className="admin-input min-h-[80px]"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </label>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={busy === profile.id}
                      onClick={() => void saveNotes()}
                    >
                      Save notes
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={busy === profile.id}
                      onClick={() => void notify()}
                    >
                      Send notification
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={busy === profile.id}
                      onClick={() => void scheduleInspection()}
                    >
                      Schedule inspection
                    </Button>
                    <Link href="/admin/approvals">
                      <Button type="button" size="sm" variant="ghost">
                        Product approvals
                      </Button>
                    </Link>
                  </div>
                </>
              ) : null}

              {profileTab === "products" ? (
                <ul className="space-y-2">
                  {(profile.products || []).length === 0 ? (
                    <li className="text-[var(--admin-muted)]">No products submitted.</li>
                  ) : (
                    (profile.products || []).map((p) => (
                      <li
                        key={p.id}
                        className="rounded-lg border border-[var(--admin-line)] px-3 py-2"
                      >
                        <div className="flex justify-between gap-2">
                          <span className="font-medium">{p.nameEn}</span>
                          <span className="admin-status admin-status-warn">
                            {p.reviewStatus || "—"}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--admin-muted)]">
                          {formatRwf(p.price)} · {p.stockQty} {formatUnit(p.unit)} ·{" "}
                          {p.isActive ? "Visible" : "Hidden"}
                        </p>
                      </li>
                    ))
                  )}
                </ul>
              ) : null}

              {profileTab === "purchases" ? (
                <ul className="space-y-2">
                  {(profile.purchaseOrdersList || []).length === 0 ? (
                    <li className="text-[var(--admin-muted)]">No purchase orders yet.</li>
                  ) : (
                    (profile.purchaseOrdersList || []).map((po) => (
                      <li
                        key={po.id}
                        className="rounded-lg border border-[var(--admin-line)] px-3 py-2"
                      >
                        <div className="flex justify-between gap-2">
                          <span className="font-mono text-xs font-bold">{po.poNumber}</span>
                          <span className="admin-status admin-status-ok">{po.status}</span>
                        </div>
                        <p className="font-medium">{po.productName}</p>
                        <p className="text-xs text-[var(--admin-muted)]">
                          Qty {po.quantity} · {formatRwf(po.totalAmount)}
                        </p>
                      </li>
                    ))
                  )}
                  <Link href="/admin/procurement/orders">
                    <Button type="button" size="sm" variant="ghost" className="mt-2">
                      Open purchase orders
                    </Button>
                  </Link>
                </ul>
              ) : null}

              {profileTab === "payments" ? (
                <ul className="space-y-2">
                  {(profile.payments || []).length === 0 ? (
                    <li className="text-[var(--admin-muted)]">No payments recorded yet.</li>
                  ) : (
                    (profile.payments || []).map((pay) => (
                      <li
                        key={pay.id}
                        className="rounded-lg border border-[var(--admin-line)] px-3 py-2"
                      >
                        <div className="flex justify-between gap-2">
                          <span className="font-mono text-xs font-bold">{pay.poNumber}</span>
                          <span className="font-semibold">{formatRwf(pay.amount)}</span>
                        </div>
                        <p className="text-xs text-[var(--admin-muted)]">
                          {pay.productName} · {pay.paymentMethod || "—"} ·{" "}
                          {pay.paidAt ? new Date(pay.paidAt).toLocaleDateString() : "—"}
                        </p>
                        {pay.paymentRef ? (
                          <p className="text-[10px] text-[var(--admin-muted)]">Ref {pay.paymentRef}</p>
                        ) : null}
                      </li>
                    ))
                  )}
                </ul>
              ) : null}
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
