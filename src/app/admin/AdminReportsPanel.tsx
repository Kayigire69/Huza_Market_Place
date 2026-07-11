"use client";

import { FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { REPORT_LABELS, REPORT_TYPES, type ReportType } from "@/lib/documents/report-types";

type Snapshot = {
  orders: unknown[];
  allSuppliers: unknown[];
  lowStock: unknown[];
  deliveries: unknown[];
  payments: unknown[];
};

function defaultFrom() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

function defaultTo() {
  return new Date().toISOString().slice(0, 10);
}

export function AdminReportsPanel({ snapshot }: { snapshot: Snapshot }) {
  const [type, setType] = useState<ReportType>("sales");
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reports = useMemo(
    () => REPORT_TYPES.map((id) => ({ id, label: REPORT_LABELS[id] })),
    []
  );

  async function downloadPdf(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ type, from, to });
      const res = await fetch(`/api/admin/reports?${qs.toString()}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed (${res.status})`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `huza-${type}-report.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate PDF");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[var(--huza-line)] bg-white p-5 space-y-4">
        <div>
          <h2 className="font-semibold">PDF activity reports</h2>
          <p className="mt-1 text-sm text-[var(--huza-muted)]">
            Download branded Youth Huza / HUZA FRESH reports with period detail, prepared-by
            (logged-in employee), and manager approval signature lines. Each download is written to
            the audit log.
          </p>
        </div>

        <form onSubmit={downloadPdf} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm space-y-1">
            <span className="font-medium">Report</span>
            <select
              className="input-field"
              value={type}
              onChange={(e) => setType(e.target.value as ReportType)}
            >
              {reports.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm space-y-1">
            <span className="font-medium">From</span>
            <input
              type="date"
              className="input-field"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              required
            />
          </label>
          <label className="text-sm space-y-1">
            <span className="font-medium">To</span>
            <input
              type="date"
              className="input-field"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              required
            />
          </label>
          <div className="flex items-end">
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Generating…" : "Download PDF"}
            </Button>
          </div>
        </form>

        {error && <p className="text-sm text-red-700">{error}</p>}

        <ul className="grid sm:grid-cols-2 gap-2 text-sm text-[var(--huza-muted)]">
          {reports.map((r) => (
            <li key={r.id} className="rounded-xl border border-[var(--huza-line)] px-3 py-2">
              <span className="font-medium text-[var(--huza-ink)]">{r.label}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-[var(--huza-line)] bg-white p-5 space-y-2">
        <h3 className="font-semibold">Live snapshot</h3>
        <ul className="text-sm space-y-1 text-[var(--huza-muted)]">
          <li>Latest orders loaded: {snapshot.orders.length}</li>
          <li>Farmers on file: {snapshot.allSuppliers.length}</li>
          <li>Low-stock SKUs: {snapshot.lowStock.length}</li>
          <li>Deliveries tracked: {snapshot.deliveries.length}</li>
          <li>Payments recorded: {snapshot.payments.length}</li>
        </ul>
      </div>
    </div>
  );
}
