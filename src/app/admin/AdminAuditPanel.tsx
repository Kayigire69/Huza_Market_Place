"use client";

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

function pretty(value: unknown) {
  if (value == null) return "—";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function AdminAuditPanel({ logs }: { logs: AuditRow[] }) {
  return (
    <div className="admin-panel p-5 space-y-3">
      <div>
        <h2 className="admin-panel-title text-xl">Accountability audit log</h2>
      </div>

      {logs.length === 0 ? (
        <p className="text-sm text-[var(--huza-muted)]">No audit events yet.</p>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <details
              key={log.id}
              className="rounded-xl border border-[var(--huza-line)] bg-[#f8fbf9] p-3 open:bg-white"
            >
              <summary className="cursor-pointer list-none">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">
                      {log.action} · {log.entity}
                      {log.entityId ? ` #${String(log.entityId).slice(0, 8)}` : ""}
                    </p>
                    <p className="text-sm text-[var(--huza-muted)]">
                      {log.actorName || "System"}
                      {log.actorEmail ? ` · ${log.actorEmail}` : ""}
                      {log.ipAddress ? ` · IP ${log.ipAddress}` : ""}
                    </p>
                    {log.details && (
                      <p className="mt-1 text-sm text-[var(--huza-ink)]">{log.details}</p>
                    )}
                  </div>
                  <p className="text-xs text-[var(--huza-muted)] whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </p>
                </div>
              </summary>
              {(log.beforeJson != null || log.afterJson != null) && (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--huza-muted)]">
                      Before
                    </p>
                    <pre className="mt-1 overflow-x-auto rounded-lg bg-[#f4f7f5] p-2 text-[11px]">
                      {pretty(log.beforeJson)}
                    </pre>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--huza-muted)]">
                      After
                    </p>
                    <pre className="mt-1 overflow-x-auto rounded-lg bg-[#f4f7f5] p-2 text-[11px]">
                      {pretty(log.afterJson)}
                    </pre>
                  </div>
                </div>
              )}
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
