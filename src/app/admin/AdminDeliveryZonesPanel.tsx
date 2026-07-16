"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatRwf } from "@/lib/utils";

type ZoneRow = {
  id: string;
  code: string;
  labelEn: string;
  feeRwf: number;
  etaMinutes: number;
  etaLabelEn: string;
  isActive: boolean;
  sortOrder: number;
};

export function AdminDeliveryZonesPanel() {
  const [zones, setZones] = useState<ZoneRow[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const res = await fetch("/api/admin/settings");
    if (!res.ok) {
      setMsg("Failed to load zones (Super Admin required to edit)");
      return;
    }
    const data = await res.json();
    setZones(data.zones || []);
  };

  useEffect(() => {
    void load();
  }, []);

  const saveZone = async (zone: ZoneRow) => {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "zone",
          id: zone.id,
          labelEn: zone.labelEn,
          feeRwf: zone.feeRwf,
          etaMinutes: zone.etaMinutes,
          etaLabelEn: zone.etaLabelEn,
          isActive: zone.isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Save failed");
        return;
      }
      setMsg(`Saved ${zone.labelEn}`);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const updateLocal = (id: string, patch: Partial<ZoneRow>) => {
    setZones((prev) => prev.map((z) => (z.id === id ? { ...z, ...patch } : z)));
  };

  return (
    <div className="rounded-2xl border border-[var(--huza-line)] bg-white p-5 space-y-4">
      <div>
        <h2 className="font-semibold">Delivery zones &amp; ETAs</h2>
      </div>
      {msg && <p className="text-sm text-[var(--huza-green-dark)]">{msg}</p>}
      <div className="space-y-4">
        {zones.map((z) => (
          <div
            key={z.id}
            className="grid gap-3 rounded-xl border border-[var(--huza-line)] p-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            <div>
              <label className="label">Label</label>
              <input
                className="input-field"
                value={z.labelEn}
                onChange={(e) => updateLocal(z.id, { labelEn: e.target.value })}
              />
              <p className="mt-1 text-[10px] uppercase text-[var(--huza-muted)]">{z.code}</p>
            </div>
            <div>
              <label className="label">Fee (RWF)</label>
              <input
                type="number"
                className="input-field"
                value={z.feeRwf}
                onChange={(e) => updateLocal(z.id, { feeRwf: Number(e.target.value) || 0 })}
              />
              <p className="mt-1 text-xs text-[var(--huza-muted)]">{formatRwf(z.feeRwf)}</p>
            </div>
            <div>
              <label className="label">ETA label</label>
              <input
                className="input-field"
                value={z.etaLabelEn}
                onChange={(e) => updateLocal(z.id, { etaLabelEn: e.target.value })}
                placeholder="45–90 minutes"
              />
            </div>
            <div>
              <label className="label">ETA minutes (upper)</label>
              <input
                type="number"
                className="input-field"
                value={z.etaMinutes}
                onChange={(e) => updateLocal(z.id, { etaMinutes: Number(e.target.value) || 0 })}
              />
            </div>
            <div className="flex items-end gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={z.isActive}
                  onChange={(e) => updateLocal(z.id, { isActive: e.target.checked })}
                />
                Active
              </label>
              <Button size="sm" disabled={busy} onClick={() => saveZone(z)}>
                Save
              </Button>
            </div>
          </div>
        ))}
        {zones.length === 0 && (
          <p className="text-sm text-[var(--huza-muted)]">No zones loaded.</p>
        )}
      </div>
    </div>
  );
}
