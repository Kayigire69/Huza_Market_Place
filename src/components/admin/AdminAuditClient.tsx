"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Search } from "lucide-react";

type AuditRow = {
  id: string;
  actorId?: string | null;
  actorName?: string | null;
  actorEmail?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: string | null;
  beforeJson?: unknown;
  afterJson?: unknown;
  ipAddress?: string | null;
  createdAt: string;
};

type ErrorRow = {
  id: string;
  source: string;
  message: string;
  path?: string | null;
  createdAt: string;
  stack?: string | null;
};

type TabKey = "audit" | "errors";

function pretty(value: unknown) {
  if (value == null) return "—";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function AdminAuditClient() {
  const [tab, setTab] = useState<TabKey>("audit");
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [logs, setLogs] = useState<AuditRow[]>([]);
  const [errors, setErrors] = useState<ErrorRow[]>([]);
  const [actionCounts, setActionCounts] = useState<{ action: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ tab });
      if (debouncedQ) params.set("q", debouncedQ);
      if (actionFilter && tab === "audit") params.set("action", actionFilter);
      const res = await fetch(`/api/admin/audit?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      if (tab === "errors") setErrors(data.errors || []);
      else {
        setLogs(data.logs || []);
        setActionCounts(data.actionCounts || []);
      }
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [tab, debouncedQ, actionFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="admin-panel-title">System logs</h1>
        </div>
        <Link href="/admin/staff">
          <Button size="sm" variant="ghost">
            Staff accounts
          </Button>
        </Link>
      </div>

      {msg ? <p className="text-sm text-red-700">{msg}</p> : null}

      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          className={`admin-filter-chip ${tab === "audit" ? "is-active" : ""}`}
          onClick={() => setTab("audit")}
        >
          Audit trail
        </button>
        <button
          type="button"
          className={`admin-filter-chip ${tab === "errors" ? "is-active" : ""}`}
          onClick={() => setTab("errors")}
        >
          Error logs
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <label className="relative block min-w-[200px] flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--admin-muted)]" />
          <input
            className="admin-input pl-9"
            placeholder={tab === "audit" ? "Actor, action, entity…" : "Message, source, path…"}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        {tab === "audit" ? (
          <select
            className="admin-input w-auto"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          >
            <option value="">All actions</option>
            {actionCounts.map((a) => (
              <option key={a.action} value={a.action}>
                {a.action} ({a.count})
              </option>
            ))}
          </select>
        ) : null}
      </div>

      {loading ? (
        <p className="text-sm text-[var(--admin-muted)]">Loading…</p>
      ) : tab === "audit" ? (
        logs.length === 0 ? (
          <div className="admin-panel p-6 text-sm text-[var(--admin-muted)]">No audit events.</div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <details key={log.id} className="admin-panel p-3 open:bg-[var(--admin-soft)]">
                <summary className="cursor-pointer list-none">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">
                        {log.action} · {log.entity}
                        {log.entityId ? ` · ${String(log.entityId).slice(0, 10)}` : ""}
                      </p>
                      <p className="text-xs text-[var(--admin-muted)]">
                        {log.actorName || "System"}
                        {log.actorEmail ? ` · ${log.actorEmail}` : ""}
                        {log.ipAddress ? ` · IP ${log.ipAddress}` : ""}
                      </p>
                      {log.details ? <p className="mt-1 text-sm">{log.details}</p> : null}
                    </div>
                    <p className="whitespace-nowrap text-xs text-[var(--admin-muted)]">
                      {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </div>
                </summary>
                {(log.beforeJson != null || log.afterJson != null) && (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-[var(--admin-muted)]">
                        Before
                      </p>
                      <pre className="mt-1 overflow-x-auto rounded-lg bg-[var(--admin-soft)] p-2 text-[11px]">
                        {pretty(log.beforeJson)}
                      </pre>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-[var(--admin-muted)]">
                        After
                      </p>
                      <pre className="mt-1 overflow-x-auto rounded-lg bg-[var(--admin-soft)] p-2 text-[11px]">
                        {pretty(log.afterJson)}
                      </pre>
                    </div>
                  </div>
                )}
              </details>
            ))}
          </div>
        )
      ) : errors.length === 0 ? (
        <div className="admin-panel p-6 text-sm text-[var(--admin-muted)]">No error logs.</div>
      ) : (
        <div className="space-y-2">
          {errors.map((err) => (
            <details key={err.id} className="admin-panel p-3">
              <summary className="cursor-pointer list-none">
                <div className="flex flex-wrap justify-between gap-2">
                  <div>
                    <p className="font-medium">{err.source}</p>
                    <p className="text-sm">{err.message}</p>
                    {err.path ? (
                      <p className="text-xs text-[var(--admin-muted)]">{err.path}</p>
                    ) : null}
                  </div>
                  <p className="text-xs text-[var(--admin-muted)]">
                    {new Date(err.createdAt).toLocaleString()}
                  </p>
                </div>
              </summary>
              {err.stack ? (
                <pre className="mt-2 overflow-x-auto rounded-lg bg-[var(--admin-soft)] p-2 text-[10px]">
                  {err.stack}
                </pre>
              ) : null}
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
