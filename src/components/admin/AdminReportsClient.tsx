"use client";

import {
  ArrowLeft,
  BarChart3,
  Boxes,
  FileSpreadsheet,
  FileText,
  PackageCheck,
  Truck,
  Users,
  Wallet,
  Wheat,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { REPORT_LABELS, type ReportType } from "@/lib/documents/report-types";

const CATEGORIES: {
  id: string;
  label: string;
  description: string;
  icon: typeof BarChart3;
  types: ReportType[];
}[] = [
  {
    id: "sales",
    label: "Sales",
    description: "Revenue and order volume",
    icon: BarChart3,
    types: ["sales"],
  },
  {
    id: "inventory",
    label: "Inventory",
    description: "Stock movements with source, method, and grade breakdown",
    icon: Boxes,
    types: ["inventory"],
  },
  {
    id: "procurement",
    label: "Procurement",
    description: "Purchase orders and farmer spend",
    icon: PackageCheck,
    types: ["procurement"],
  },
  {
    id: "farmers",
    label: "Farmers",
    description: "Applications and sourcing partners",
    icon: Wheat,
    types: ["farmers", "procurement"],
  },
  {
    id: "customers",
    label: "Customers",
    description: "New shoppers and spend",
    icon: Users,
    types: ["customers"],
  },
  {
    id: "payments",
    label: "Payments",
    description: "MoMo / Airtel reconciliation",
    icon: Wallet,
    types: ["payments"],
  },
  {
    id: "deliveries",
    label: "Deliveries",
    description: "Dispatch and delivery outcomes",
    icon: Truck,
    types: ["deliveries"],
  },
];

function defaultFrom() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

function defaultTo() {
  return new Date().toISOString().slice(0, 10);
}

type Preview = {
  label: string;
  summary: string[];
  totalHighlight?: string;
  rowCount: number;
  headers: string[];
  sampleRows: string[][];
};

export function AdminReportsClient() {
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [type, setType] = useState<ReportType>("sales");
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [busy, setBusy] = useState<"pdf" | "excel" | "csv" | "preview" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);

  const category = useMemo(
    () => CATEGORIES.find((c) => c.id === categoryId) || null,
    [categoryId]
  );

  const loadPreview = useCallback(async () => {
    if (!categoryId) return;
    setBusy("preview");
    setError(null);
    try {
      const params = new URLSearchParams({ type, from, to, preview: "1" });
      const res = await fetch(`/api/admin/reports?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Preview failed");
      setPreview({
        label: data.label,
        summary: data.summary || [],
        totalHighlight: data.totalHighlight,
        rowCount: data.rowCount || 0,
        headers: data.headers || [],
        sampleRows: data.sampleRows || [],
      });
    } catch (err) {
      setPreview(null);
      setError(err instanceof Error ? err.message : "Preview failed");
    } finally {
      setBusy(null);
    }
  }, [categoryId, type, from, to]);

  useEffect(() => {
    if (!categoryId) return;
    const t = setTimeout(() => void loadPreview(), 300);
    return () => clearTimeout(t);
  }, [categoryId, loadPreview]);

  async function download(format: "pdf" | "excel" | "csv", e?: FormEvent) {
    e?.preventDefault();
    setBusy(format);
    setError(null);
    try {
      const params = new URLSearchParams({ type, from, to, format });
      const res = await fetch(`/api/admin/reports?${params}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || "Could not generate report");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const ext = format === "pdf" ? "pdf" : format === "excel" ? "xls" : "csv";
      a.download = `huza-${type}-${from}-${to}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  if (!category) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="admin-panel-title">Reports</h1>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              className="admin-cat-card admin-cat-card--click text-left"
              onClick={() => {
                setCategoryId(c.id);
                setType(c.types[0]);
                setError(null);
                setPreview(null);
              }}
            >
              <c.icon className="size-5 text-[var(--huza-green)]" />
              <h2 className="mt-2 text-base font-semibold">{c.label}</h2>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--huza-green-dark)]"
        onClick={() => {
          setCategoryId(null);
          setPreview(null);
        }}
      >
        <ArrowLeft className="size-3.5" />
        Reports
      </button>
      <div>
        <h1 className="admin-panel-title">{category.label}</h1>
      </div>

      <form
        onSubmit={(e) => void download("pdf", e)}
        className="admin-panel max-w-xl space-y-4 p-5"
      >
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Report type</span>
          <select
            className="admin-input"
            value={type}
            onChange={(e) => setType(e.target.value as ReportType)}
          >
            {category.types.map((id) => (
              <option key={id} value={id}>
                {REPORT_LABELS[id]}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">From</span>
            <input
              type="date"
              className="admin-input"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">To</span>
            <input
              type="date"
              className="admin-input"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>
        </div>
        {error ? <p className="text-sm text-rose-700">{error}</p> : null}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={busy !== null}>
            <FileText className="mr-1.5 size-4" />
            {busy === "pdf" ? "Generating…" : "Download PDF"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={busy !== null}
            onClick={() => void download("excel")}
          >
            <FileSpreadsheet className="mr-1.5 size-4" />
            {busy === "excel" ? "Generating…" : "Download Excel"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={busy !== null}
            onClick={() => void download("csv")}
          >
            {busy === "csv" ? "Generating…" : "Download CSV"}
          </Button>
        </div>
      </form>

      {preview ? (
        <div className="admin-panel max-w-3xl space-y-3 p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Preview · {preview.label}</h2>
            <span className="text-xs text-[var(--admin-muted)]">
              {busy === "preview" ? "Refreshing…" : `${preview.rowCount} rows`}
            </span>
          </div>
          <ul className="space-y-0.5 text-sm text-[var(--admin-muted)]">
            {preview.summary.map((line) => (
              <li key={line}>{line}</li>
            ))}
            {preview.totalHighlight ? (
              <li className="font-medium text-[var(--admin-ink)]">{preview.totalHighlight}</li>
            ) : null}
          </ul>
          {preview.sampleRows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="admin-table text-xs">
                <thead>
                  <tr>
                    {preview.headers.map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.sampleRows.map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => (
                        <td key={j}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-[var(--admin-muted)]">No rows in this period.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
