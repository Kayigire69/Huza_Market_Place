"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { RefreshCw } from "lucide-react";

type RestockItem = {
  id: string;
  status: string;
  quantityWanted: number | null;
  customerName: string | null;
  customerPhone: string | null;
  note: string | null;
  softEtaLabel: string;
  createdAt: string;
  product: {
    id: string;
    nameEn: string;
    unit: string;
    available: number;
    percentLeft: number;
  };
  user?: { fullName: string; phone: string; email: string | null } | null;
};

type Counts = { OPEN: number; SOURCING: number; FULFILLED: number; CLOSED: number };

const TABS = [
  { key: "OPEN", label: "Open" },
  { key: "SOURCING", label: "Sourcing" },
  { key: "FULFILLED", label: "Fulfilled" },
  { key: "CLOSED", label: "Closed" },
  { key: "ALL", label: "All" },
] as const;

function formatWhen(iso: string) {
  return new Intl.DateTimeFormat("en-RW", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function AdminRestockClient() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("OPEN");
  const [items, setItems] = useState<RestockItem[]>([]);
  const [counts, setCounts] = useState<Counts>({ OPEN: 0, SOURCING: 0, FULFILLED: 0, CLOSED: 0 });
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/restock-requests?status=${tab}`);
      const data = await res.json();
      setItems(data.items || []);
      if (data.counts) setCounts(data.counts);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    void load();
  }, [load]);

  async function setStatus(id: string, status: string) {
    setBusyId(id);
    try {
      await fetch("/api/admin/restock-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      await load();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[var(--admin-ink)]">Restock requests</h1>
          <p className="mt-1 text-sm text-[var(--admin-muted)]">
            Customer demand when stock is empty. Soft ETA shown to shoppers: usually within a few
            hours in Kigali (not a hard SLA). Stock % alerts to admins are throttled to once per
            hour per product.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/inventory?tab=out">
            <Button size="sm" variant="ghost">
              Out of stock
            </Button>
          </Link>
          <Button size="sm" variant="secondary" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`mr-1.5 size-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              tab === t.key
                ? "bg-[var(--admin-ink)] text-white"
                : "bg-[var(--admin-soft)] text-[var(--admin-ink)]"
            }`}
          >
            {t.label}
            {t.key !== "ALL" && counts[t.key] != null ? (
              <span className="ml-1.5 opacity-80">({counts[t.key]})</span>
            ) : null}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-[var(--admin-muted)]">Loading…</p>
      ) : items.length === 0 ? (
        <p className="rounded-lg border border-[var(--admin-line)] bg-[var(--admin-soft)] p-6 text-sm text-[var(--admin-muted)]">
          No requests in this view.
        </p>
      ) : (
        <ul className="divide-y divide-[var(--admin-line)] rounded-lg border border-[var(--admin-line)] bg-white">
          {items.map((r) => {
            const who =
              r.customerName || r.user?.fullName || r.customerPhone || r.user?.phone || "Guest";
            return (
              <li key={r.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <p className="font-semibold text-[var(--admin-ink)]">{r.product.nameEn}</p>
                  <p className="text-sm text-[var(--admin-muted)]">
                    {who}
                    {r.customerPhone || r.user?.phone
                      ? ` · ${r.customerPhone || r.user?.phone}`
                      : ""}
                    {r.quantityWanted ? ` · wants ${r.quantityWanted} ${r.product.unit}` : ""}
                  </p>
                  <p className="text-xs text-[var(--admin-muted)]">
                    Stock now: {r.product.available} ({r.product.percentLeft}% left) · {formatWhen(r.createdAt)}
                  </p>
                  {r.note ? <p className="text-sm italic">{r.note}</p> : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {r.status === "OPEN" ? (
                    <Button
                      size="sm"
                      disabled={busyId === r.id}
                      onClick={() => void setStatus(r.id, "SOURCING")}
                    >
                      Start sourcing
                    </Button>
                  ) : null}
                  {r.status === "OPEN" || r.status === "SOURCING" ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={busyId === r.id}
                      onClick={() => void setStatus(r.id, "FULFILLED")}
                    >
                      Mark fulfilled
                    </Button>
                  ) : null}
                  {r.status !== "CLOSED" ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busyId === r.id}
                      onClick={() => void setStatus(r.id, "CLOSED")}
                    >
                      Close
                    </Button>
                  ) : null}
                  <Link href={`/admin/inventory`}>
                    <Button size="sm" variant="ghost">
                      Inventory
                    </Button>
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
