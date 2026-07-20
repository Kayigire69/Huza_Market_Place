"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

type FollowUp = {
  id: string;
  type: string;
  notes: string;
  recordedAt: string;
};

type AgronomyItem = {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  kind: "visit" | "advice";
  status: string;
  farmName: string | null;
  crop?: string;
  followUps?: FollowUp[];
  supplier: {
    id: string;
    businessName: string;
    phone: string | null;
    district: string;
    location: string;
    inspectionScheduledAt: string | null;
    farmerName: string | null;
  } | null;
};

export function AdminAgronomyClient() {
  const [items, setItems] = useState<AgronomyItem[]>([]);
  const [openCount, setOpenCount] = useState(0);
  const [filter, setFilter] = useState<"open" | "all">("open");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/agronomy?filter=${filter}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setItems(Array.isArray(data.items) ? data.items : []);
      setOpenCount(data.counts?.open ?? 0);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  const act = async (
    id: string,
    action: "mark_handled" | "reply" | "schedule_visit" | "add_follow_up",
    extra?: Record<string, string>
  ) => {
    setBusy(id);
    try {
      const res = await fetch("/api/admin/agronomy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");
      setMsg(
        action === "mark_handled"
          ? "Marked as handled"
          : action === "reply"
            ? "Reply sent to farmer"
            : action === "add_follow_up"
              ? "Follow-up recorded"
              : "Visit scheduled"
      );
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(null);
    }
  };

  const reply = (item: AgronomyItem) => {
    const message = window.prompt(
      "Reply to farmer (shown in Farmers Portal notifications)",
      "Thank you. Our agronomy team will follow up shortly."
    );
    if (!message?.trim()) return;
    void act(item.id, "reply", { message: message.trim() });
  };

  const schedule = (item: AgronomyItem) => {
    const when = window.prompt(
      "Visit date/time (YYYY-MM-DD or full datetime)",
      new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
    );
    if (!when?.trim()) return;
    const note =
      window.prompt("Optional note for the farmer", "Please be available at the farm.") || "";
    void act(item.id, "schedule_visit", { when: when.trim(), note });
  };

  const followUp = (item: AgronomyItem) => {
    const type =
      window.prompt(
        "Follow-up type: VISIT | RECOMMENDATION | DISEASE | PEST | SOIL | TRAINING | NOTE",
        "RECOMMENDATION"
      ) || "NOTE";
    const notes = window.prompt("Follow-up notes", "");
    if (!notes?.trim()) return;
    void act(item.id, "add_follow_up", { type: type.trim().toUpperCase(), notes: notes.trim() });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="admin-panel-title">Agronomy Support</h1>
          <p className="mt-1 text-sm text-[var(--admin-muted)]">
            Advice and farm-visit requests from the Farmers Portal · {openCount} open
          </p>
        </div>
        <div className="flex gap-2">
          {(["open", "all"] as const).map((f) => (
            <Button
              key={f}
              type="button"
              size="sm"
              variant={filter === f ? "primary" : "ghost"}
              onClick={() => setFilter(f)}
            >
              {f === "open" ? "Open" : "All"}
            </Button>
          ))}
        </div>
      </div>

      {msg ? (
        <p className="rounded-lg border border-[var(--admin-line)] bg-[var(--admin-soft)] px-3 py-2 text-sm">
          {msg}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-[var(--admin-muted)]">Loading agronomy inbox…</p>
      ) : items.length === 0 ? (
        <div className="admin-panel p-6 text-sm text-[var(--admin-muted)]">
          {filter === "open"
            ? "No open agronomy requests."
            : "No agronomy requests yet."}
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <article key={item.id} className="admin-panel space-y-3 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold">
                    {item.farmName || item.title.replace(/^\[Agronomy\]\s*/, "")}
                  </h2>
                  <p className="text-sm text-[var(--admin-muted)]">
                    {item.supplier?.farmerName || "Farmer"}
                    {item.supplier?.phone ? ` · ${item.supplier.phone}` : ""}
                    {item.supplier?.district ? ` · ${item.supplier.district}` : ""}
                    {item.crop ? ` · ${item.crop}` : ""}
                    {" · "}
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span
                    className={
                      item.kind === "visit" ? "admin-status admin-status-warn" : "admin-status"
                    }
                  >
                    {item.kind === "visit" ? "Farm visit" : "Advice"}
                  </span>
                  <span
                    className={
                      item.status === "HANDLED" || item.status === "CLOSED"
                        ? "admin-status"
                        : "admin-status admin-status-warn"
                    }
                  >
                    {item.status}
                  </span>
                </div>
              </div>

              <pre className="whitespace-pre-wrap rounded-lg bg-[var(--admin-soft)] p-3 font-[family-name:var(--font-body)] text-sm text-[var(--admin-ink)]">
                {item.body}
              </pre>

              {item.followUps && item.followUps.length > 0 ? (
                <ul className="space-y-1 text-sm text-[var(--admin-muted)]">
                  {item.followUps.map((f) => (
                    <li key={f.id}>
                      <span className="font-medium text-[var(--admin-ink)]">{f.type}</span>
                      {" · "}
                      {f.notes}
                      {" · "}
                      {new Date(f.recordedAt).toLocaleDateString()}
                    </li>
                  ))}
                </ul>
              ) : null}

              {item.supplier?.inspectionScheduledAt ? (
                <p className="text-sm text-[var(--admin-muted)]">
                  Visit already scheduled:{" "}
                  {new Date(item.supplier.inspectionScheduledAt).toLocaleString()}
                </p>
              ) : null}

              <div className="flex flex-wrap gap-2 border-t border-[var(--admin-line)] pt-3">
                {item.status !== "HANDLED" && item.status !== "CLOSED" ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={busy === item.id}
                    onClick={() => void act(item.id, "mark_handled")}
                  >
                    Mark handled
                  </Button>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  disabled={busy === item.id || !item.supplier}
                  onClick={() => reply(item)}
                >
                  Reply to farmer
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={busy === item.id || !item.supplier}
                  onClick={() => schedule(item)}
                >
                  Schedule visit
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={busy === item.id}
                  onClick={() => followUp(item)}
                >
                  Add follow-up
                </Button>
                {item.supplier ? (
                  <Link href={`/admin/suppliers?id=${item.supplier.id}`}>
                    <Button type="button" size="sm" variant="ghost">
                      Open farmer
                    </Button>
                  </Link>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
