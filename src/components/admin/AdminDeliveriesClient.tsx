"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { DELIVERY_ZONE_LABELS, formatRwf, type DeliveryZoneKey } from "@/lib/utils";
import { MapPin, Phone, Search, Truck, X } from "lucide-react";

type Driver = {
  id: string;
  fullName: string;
  phone: string;
  activeCount?: number;
  onWayCount?: number;
  zones?: string[];
};

type Vehicle = { id: string; plateNumber: string; label: string; capacityKg?: number | null };

type DeliveryRow = {
  id: string;
  status: string;
  deliveryPersonId: string | null;
  vehicleId?: string | null;
  routeNotes?: string | null;
  estimatedMinutes?: number | null;
  pickedAt?: string | null;
  deliveredAt?: string | null;
  podPhotoUrl?: string | null;
  podNotes?: string | null;
  notes?: string | null;
  order?: {
    orderNumber: string;
    total: number;
    deliveryAddress: string;
    deliveryDistrict?: string | null;
    deliverySector?: string | null;
    deliveryZone: string;
    deliveryInstructions?: string | null;
    deliveryFee?: number;
    estimatedDelivery?: string | null;
    gpsLat?: number | null;
    gpsLng?: number | null;
    guestName?: string | null;
    guestPhone?: string | null;
    status?: string;
    user?: { fullName: string; phone: string } | null;
    items?: { quantity: number; product?: { nameEn: string } | null }[];
  } | null;
  deliveryPerson?: Driver | null;
  vehicle?: Vehicle | null;
};

type TabKey = "pending" | "assigned" | "on_way" | "delivered" | "failed";

const TABS: { key: TabKey; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "assigned", label: "Assigned" },
  { key: "on_way", label: "On the Way" },
  { key: "delivered", label: "Delivered" },
  { key: "failed", label: "Failed" },
];

function zoneLabel(code?: string) {
  if (!code) return "—";
  return DELIVERY_ZONE_LABELS[code as DeliveryZoneKey] || code;
}

function mapsUrl(lat?: number | null, lng?: number | null, address?: string) {
  if (lat != null && lng != null) return `https://www.google.com/maps?q=${lat},${lng}`;
  if (address) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  return null;
}

export function AdminDeliveriesClient() {
  const [tab, setTab] = useState<TabKey>("pending");
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [zoneFilter, setZoneFilter] = useState("");
  const [driverFilter, setDriverFilter] = useState("");
  const [deliveries, setDeliveries] = useState<DeliveryRow[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [viewing, setViewing] = useState<DeliveryRow | null>(null);
  const [routeDraft, setRouteDraft] = useState("");
  const [groupByZone, setGroupByZone] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ tab });
      if (debouncedQ) params.set("q", debouncedQ);
      if (zoneFilter) params.set("zone", zoneFilter);
      if (driverFilter) params.set("driverId", driverFilter);
      const res = await fetch(`/api/admin/deliveries?${params}`);
      const data = await res.json();
      if (res.ok) {
        setDeliveries(data.deliveries || []);
        setDrivers(data.drivers || []);
        setVehicles(data.vehicles || []);
        setCounts(data.counts || {});
      } else setMsg(data.error || "Failed to load");
    } catch {
      setMsg("Failed to load deliveries");
    } finally {
      setLoading(false);
    }
  }, [tab, debouncedQ, zoneFilter, driverFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const patch = async (
    deliveryId: string,
    body: Record<string, unknown>,
    okMsg = "Delivery updated"
  ) => {
    setBusy(deliveryId);
    try {
      const res = await fetch("/api/admin/deliveries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryId, ...body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      setMsg(okMsg);
      if (viewing?.id === deliveryId) setViewing(data);
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(null);
    }
  };

  const markFailed = async (d: DeliveryRow) => {
    const reason = window.prompt(
      "Failure reason",
      "Customer unavailable / wrong address / refused"
    );
    if (!reason) return;
    await patch(d.id, { status: "RETURNED", failReason: reason }, "Marked as failed");
    setViewing(null);
  };

  const saveRoute = async (d: DeliveryRow) => {
    await patch(d.id, { routeNotes: routeDraft }, "Route notes saved");
  };

  const grouped = useMemo(() => {
    if (!groupByZone || (tab !== "assigned" && tab !== "on_way" && tab !== "pending")) {
      return [{ zone: "", label: "", rows: deliveries }];
    }
    const map = new Map<string, DeliveryRow[]>();
    for (const d of deliveries) {
      const z = d.order?.deliveryZone || "UNKNOWN";
      if (!map.has(z)) map.set(z, []);
      map.get(z)!.push(d);
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([zone, rows]) => ({ zone, label: zoneLabel(zone), rows }));
  }, [deliveries, groupByZone, tab]);

  const openView = (d: DeliveryRow) => {
    setViewing(d);
    setRouteDraft(d.routeNotes || "");
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="admin-panel-title">Deliveries</h1>
        <p className="admin-panel-sub">
          Drivers, assignment, zone routes, status, proof of delivery, and failed trips.
        </p>
      </div>

      {msg ? (
        <p className="rounded-lg border border-[var(--admin-line)] bg-[var(--admin-soft)] px-3 py-2 text-sm">
          {msg}
        </p>
      ) : null}

      {/* Driver board */}
      <section className="admin-panel p-4">
        <div className="mb-3 flex items-center gap-2">
          <Truck className="size-4 text-[var(--huza-green-dark)]" />
          <h2 className="text-sm font-semibold">Driver board</h2>
        </div>
        {drivers.length === 0 ? (
          <p className="text-sm text-[var(--admin-muted)]">
            No active delivery staff. Add users with the Delivery role in Settings → Staff.
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {drivers.map((dr) => (
              <button
                key={dr.id}
                type="button"
                className={`rounded-lg border px-3 py-2 text-left transition ${
                  driverFilter === dr.id
                    ? "border-[var(--huza-green)] bg-[var(--admin-soft)]"
                    : "border-[var(--admin-line)] hover:bg-[var(--admin-soft)]"
                }`}
                onClick={() =>
                  setDriverFilter((prev) => (prev === dr.id ? "" : dr.id))
                }
              >
                <p className="font-medium">{dr.fullName}</p>
                <p className="text-xs text-[var(--admin-muted)]">{dr.phone}</p>
                <p className="mt-1 text-xs">
                  <span className="font-semibold tabular-nums">{dr.activeCount ?? 0}</span> active
                  {dr.onWayCount ? (
                    <span className="text-amber-700"> · {dr.onWayCount} on the way</span>
                  ) : null}
                </p>
                {dr.zones?.length ? (
                  <p className="mt-0.5 text-[10px] text-[var(--admin-muted)]">
                    {dr.zones.map(zoneLabel).join(" · ")}
                  </p>
                ) : null}
              </button>
            ))}
          </div>
        )}
      </section>

      <div className="flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`admin-filter-chip ${tab === t.key ? "is-active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
            {counts[t.key] != null ? (
              <span className="ml-1 tabular-nums opacity-70">{counts[t.key]}</span>
            ) : null}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="relative block min-w-[200px] flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--admin-muted)]" />
          <input
            className="admin-input pl-9"
            placeholder="Search order, phone, address, driver…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <select
          className="admin-input w-auto"
          value={zoneFilter}
          onChange={(e) => setZoneFilter(e.target.value)}
        >
          <option value="">All zones</option>
          {(Object.keys(DELIVERY_ZONE_LABELS) as DeliveryZoneKey[]).map((z) => (
            <option key={z} value={z}>
              {DELIVERY_ZONE_LABELS[z]}
            </option>
          ))}
        </select>
        {(tab === "assigned" || tab === "on_way" || tab === "pending") && (
          <label className="flex items-center gap-2 text-sm text-[var(--admin-muted)]">
            <input
              type="checkbox"
              checked={groupByZone}
              onChange={(e) => setGroupByZone(e.target.checked)}
            />
            Route by zone
          </label>
        )}
      </div>

      <div className="space-y-6">
        {loading ? (
          <p className="text-sm text-[var(--admin-muted)]">Loading…</p>
        ) : deliveries.length === 0 ? (
          <div className="admin-panel p-6 text-sm text-[var(--admin-muted)]">
            No deliveries in this view.
          </div>
        ) : (
          grouped.map((group) => (
            <div key={group.zone || "all"} className="space-y-3">
              {group.label ? (
                <div className="flex items-center gap-2 border-b border-[var(--admin-line)] pb-2">
                  <MapPin className="size-4 text-[var(--huza-green-dark)]" />
                  <h3 className="text-sm font-semibold">
                    {group.label}
                    <span className="ml-2 font-normal text-[var(--admin-muted)]">
                      {group.rows.length} stop{group.rows.length === 1 ? "" : "s"}
                    </span>
                  </h3>
                </div>
              ) : null}
              {group.rows.map((d) => {
                const cust =
                  d.order?.user?.fullName || d.order?.guestName || "Customer";
                const phone = d.order?.user?.phone || d.order?.guestPhone || "—";
                const map = mapsUrl(d.order?.gpsLat, d.order?.gpsLng, d.order?.deliveryAddress);
                return (
                  <article key={d.id} className="admin-panel p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-mono text-sm font-bold text-[var(--huza-green-dark)]">
                            {d.order?.orderNumber}
                          </p>
                          <span className="admin-status admin-status-warn">
                            {d.status.replace(/_/g, " ")}
                          </span>
                          <span className="text-xs text-[var(--admin-muted)]">
                            {zoneLabel(d.order?.deliveryZone)}
                          </span>
                        </div>
                        <p className="mt-1 font-medium">{cust}</p>
                        <p className="inline-flex items-center gap-1 text-xs text-[var(--admin-muted)]">
                          <Phone className="size-3" /> {phone}
                        </p>
                        <p className="mt-1 text-sm text-[var(--admin-muted)]">
                          {d.order?.deliveryAddress}
                        </p>
                        <p className="mt-1 text-sm font-semibold">
                          {formatRwf(d.order?.total || 0)}
                          {d.estimatedMinutes ? (
                            <span className="ml-2 font-normal text-xs text-[var(--admin-muted)]">
                              ~{d.estimatedMinutes} min
                            </span>
                          ) : null}
                        </p>
                        {d.deliveryPerson ? (
                          <p className="mt-1 text-xs text-[var(--admin-muted)]">
                            Driver: {d.deliveryPerson.fullName}
                            {d.vehicle
                              ? ` · ${d.vehicle.label} (${d.vehicle.plateNumber})`
                              : ""}
                          </p>
                        ) : null}
                        {d.routeNotes ? (
                          <p className="mt-1 text-xs italic text-[var(--admin-muted)]">
                            Route: {d.routeNotes}
                          </p>
                        ) : null}
                        {d.podNotes || d.podPhotoUrl ? (
                          <p className="mt-1 text-xs text-emerald-700">
                            POD: {d.podNotes || "photo on file"}
                          </p>
                        ) : null}
                        {d.notes?.startsWith("Failed") ? (
                          <p className="mt-1 text-xs text-red-700">{d.notes}</p>
                        ) : null}
                      </div>
                      <div className="flex min-w-[180px] flex-col gap-2">
                        {(tab === "pending" || !d.deliveryPersonId) && tab !== "failed" ? (
                          <select
                            className="admin-input"
                            defaultValue=""
                            disabled={busy === d.id}
                            onChange={(e) => {
                              if (e.target.value)
                                void patch(
                                  d.id,
                                  { deliveryPersonId: e.target.value },
                                  "Driver assigned"
                                );
                            }}
                          >
                            <option value="">Assign driver…</option>
                            {drivers.map((dr) => (
                              <option key={dr.id} value={dr.id}>
                                {dr.fullName} ({dr.activeCount ?? 0})
                              </option>
                            ))}
                          </select>
                        ) : null}
                        {d.deliveryPersonId && tab !== "delivered" && tab !== "failed" ? (
                          <select
                            className="admin-input"
                            value={d.vehicleId || ""}
                            disabled={busy === d.id || vehicles.length === 0}
                            onChange={(e) =>
                              void patch(d.id, { vehicleId: e.target.value || null }, "Vehicle set")
                            }
                          >
                            <option value="">
                              {vehicles.length ? "Vehicle…" : "No vehicles"}
                            </option>
                            {vehicles.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.label} · {v.plateNumber}
                              </option>
                            ))}
                          </select>
                        ) : null}
                        {d.deliveryPersonId &&
                        d.status !== "OUT_FOR_DELIVERY" &&
                        d.status !== "DELIVERED" &&
                        tab !== "failed" ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={busy === d.id}
                            onClick={() =>
                              void patch(d.id, { status: "OUT_FOR_DELIVERY" }, "On the way")
                            }
                          >
                            Mark On the Way
                          </Button>
                        ) : null}
                        {d.status === "OUT_FOR_DELIVERY" ? (
                          <Button
                            type="button"
                            size="sm"
                            disabled={busy === d.id}
                            onClick={() =>
                              void patch(d.id, { status: "DELIVERED" }, "Delivered")
                            }
                          >
                            Mark Delivered
                          </Button>
                        ) : null}
                        {tab !== "delivered" && tab !== "failed" ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="danger"
                            disabled={busy === d.id}
                            onClick={() => void markFailed(d)}
                          >
                            Mark Failed
                          </Button>
                        ) : null}
                        <div className="flex flex-wrap gap-2">
                          <Button type="button" size="sm" variant="ghost" onClick={() => openView(d)}>
                            View
                          </Button>
                          {map ? (
                            <a href={map} target="_blank" rel="noreferrer">
                              <Button type="button" size="sm" variant="ghost">
                                Map
                              </Button>
                            </a>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ))
        )}
      </div>

      {viewing ? (
        <div className="admin-drawer-backdrop" onClick={() => setViewing(null)}>
          <aside
            className="admin-drawer"
            style={{ width: "min(480px, 100%)" }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
          >
            <div className="flex items-center justify-between border-b border-[var(--admin-line)] px-5 py-4">
              <div>
                <h2 className="font-mono text-lg font-semibold">
                  {viewing.order?.orderNumber}
                </h2>
                <p className="text-xs text-[var(--admin-muted)]">
                  {zoneLabel(viewing.order?.deliveryZone)} ·{" "}
                  {viewing.status.replace(/_/g, " ")}
                </p>
              </div>
              <button type="button" className="admin-icon-btn" onClick={() => setViewing(null)}>
                <X className="size-4" />
              </button>
            </div>
            <div className="space-y-4 overflow-y-auto p-5 text-sm">
              <div>
                <p className="text-xs uppercase text-[var(--admin-muted)]">Customer</p>
                <p className="font-medium">
                  {viewing.order?.user?.fullName || viewing.order?.guestName}
                </p>
                <p>{viewing.order?.user?.phone || viewing.order?.guestPhone}</p>
                <p className="mt-1 text-[var(--admin-muted)]">{viewing.order?.deliveryAddress}</p>
                {viewing.order?.deliveryInstructions ? (
                  <p className="mt-1 text-xs italic">Note: {viewing.order.deliveryInstructions}</p>
                ) : null}
              </div>

              <div>
                <p className="text-xs uppercase text-[var(--admin-muted)]">Items</p>
                <ul className="mt-1 space-y-0.5">
                  {(viewing.order?.items || []).map((it, i) => (
                    <li key={i}>
                      {it.product?.nameEn || "Item"} × {it.quantity}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="mb-1 text-xs uppercase text-[var(--admin-muted)]">Route planning</p>
                <textarea
                  className="admin-input min-h-[72px]"
                  placeholder="Stop order, landmark, gate code…"
                  value={routeDraft}
                  onChange={(e) => setRouteDraft(e.target.value)}
                />
                <Button
                  type="button"
                  size="sm"
                  className="mt-2"
                  variant="ghost"
                  disabled={busy === viewing.id}
                  onClick={() => void saveRoute(viewing)}
                >
                  Save route notes
                </Button>
              </div>

              <div>
                <p className="text-xs uppercase text-[var(--admin-muted)]">Proof of delivery</p>
                {viewing.podNotes || viewing.podPhotoUrl || viewing.deliveredAt ? (
                  <div className="mt-1 rounded-lg bg-[var(--admin-soft)] p-3 text-xs">
                    {viewing.deliveredAt ? (
                      <p>Delivered {new Date(viewing.deliveredAt).toLocaleString()}</p>
                    ) : null}
                    {viewing.podNotes ? <p className="mt-1">{viewing.podNotes}</p> : null}
                    {viewing.podPhotoUrl ? (
                      <a
                        className="mt-1 inline-block text-[var(--huza-green-dark)] underline"
                        href={viewing.podPhotoUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View POD photo
                      </a>
                    ) : (
                      <p className="mt-1 text-[var(--admin-muted)]">No photo uploaded yet</p>
                    )}
                  </div>
                ) : (
                  <p className="mt-1 text-xs text-[var(--admin-muted)]">
                    POD appears when the driver marks delivered (notes / photo URL).
                  </p>
                )}
              </div>

              {viewing.deliveryPersonId ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={busy === viewing.id}
                  onClick={() => void patch(viewing.id, { unassign: true }, "Driver unassigned")}
                >
                  Unassign driver
                </Button>
              ) : null}
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
