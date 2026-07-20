"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { FarmerPanel } from "@/components/portals/FarmerUi";
import { Button } from "@/components/ui/Button";

const ADVICE_TOPICS = [
  "Crop Diseases",
  "Pest Infestation",
  "Soil Fertility",
  "Fertilizer Recommendation",
  "Irrigation",
  "Organic Farming",
  "Harvest Timing",
  "Post-Harvest Handling",
] as const;

type FollowUp = {
  id: string;
  type: string;
  notes: string;
  recordedAt: string;
};

type AgronomyRow = {
  id: string;
  kind: string;
  crop: string;
  topicOrReason: string;
  description: string;
  preferredDate: string | null;
  status: string;
  adminReply: string | null;
  scheduledAt: string | null;
  handledAt: string | null;
  createdAt: string;
  followUps: FollowUp[];
};

function statusLabel(status: string) {
  switch (status) {
    case "OPEN":
      return "Submitted — waiting for Huza";
    case "REPLIED":
      return "Agronomist replied";
    case "SCHEDULED":
      return "Visit scheduled";
    case "HANDLED":
      return "Visit / advice completed";
    case "CLOSED":
      return "Closed";
    default:
      return status;
  }
}

function followUpTypeLabel(type: string) {
  const map: Record<string, string> = {
    VISIT: "Visit report",
    RECOMMENDATION: "Recommendation",
    DISEASE: "Disease note",
    PEST: "Pest note",
    SOIL: "Soil note",
    TRAINING: "Training",
    NOTE: "Note",
  };
  return map[type] || type;
}

function formatWhen(iso: string | null) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-RW", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

/**
 * Agronomy Support — request advice or a farm visit + live request/visit ledger.
 */
export function FarmerAgronomyClient() {
  const [mode, setMode] = useState<"advice" | "visit">("advice");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [historyLoading, setHistoryLoading] = useState(true);
  const [requests, setRequests] = useState<AgronomyRow[]>([]);
  const [advice, setAdvice] = useState<{
    topic: (typeof ADVICE_TOPICS)[number];
    crop: string;
    description: string;
  }>({ topic: ADVICE_TOPICS[0], crop: "", description: "" });
  const [visit, setVisit] = useState({
    reason: "",
    crop: "",
    preferredDate: "",
    description: "",
  });

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/supplier/agronomy");
      const data = await res.json();
      if (res.ok) setRequests(data.requests || []);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/supplier/agronomy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "advice" ? { kind: "advice", ...advice } : { kind: "visit", ...visit }
        ),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not submit request");
      setMsg(
        mode === "advice"
          ? "Advice request submitted. Youth Huza will follow up."
          : "Farm visit request submitted. Track progress in the ledger below."
      );
      setAdvice({ topic: ADVICE_TOPICS[0], crop: "", description: "" });
      setVisit({ reason: "", crop: "", preferredDate: "", description: "" });
      await loadHistory();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Request failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setMode("advice")}
          className={`rounded-full px-3 py-1.5 text-xs font-bold ${
            mode === "advice"
              ? "bg-[var(--huza-green)] text-white"
              : "bg-white text-[var(--huza-green-dark)] ring-1 ring-[var(--huza-line)]"
          }`}
        >
          Request expert advice
        </button>
        <button
          type="button"
          onClick={() => setMode("visit")}
          className={`rounded-full px-3 py-1.5 text-xs font-bold ${
            mode === "visit"
              ? "bg-[var(--huza-green)] text-white"
              : "bg-white text-[var(--huza-green-dark)] ring-1 ring-[var(--huza-line)]"
          }`}
        >
          Request farm visit
        </button>
      </div>

      <FarmerPanel className="max-w-2xl">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--huza-ink)]">
          {mode === "advice" ? "Request expert advice" : "Request farm visit"}
        </h2>
        <p className="mt-1 text-sm text-[var(--huza-muted)]">
          Youth Huza helps improve farming practices — not only buys produce.
        </p>

        <form onSubmit={submit} className="mt-4 space-y-3">
          {mode === "advice" ? (
            <>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Topic</span>
                <select
                  className="w-full rounded-xl border border-[var(--huza-line)] px-3 py-2"
                  value={advice.topic}
                  onChange={(e) =>
                    setAdvice((a) => ({
                      ...a,
                      topic: e.target.value as (typeof ADVICE_TOPICS)[number],
                    }))
                  }
                >
                  {ADVICE_TOPICS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Crop concerned</span>
                <input
                  className="w-full rounded-xl border border-[var(--huza-line)] px-3 py-2"
                  required
                  value={advice.crop}
                  onChange={(e) => setAdvice((a) => ({ ...a, crop: e.target.value }))}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Describe the problem</span>
                <textarea
                  className="min-h-[100px] w-full rounded-xl border border-[var(--huza-line)] px-3 py-2"
                  required
                  value={advice.description}
                  onChange={(e) => setAdvice((a) => ({ ...a, description: e.target.value }))}
                />
              </label>
            </>
          ) : (
            <>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Reason for visit</span>
                <input
                  className="w-full rounded-xl border border-[var(--huza-line)] px-3 py-2"
                  required
                  value={visit.reason}
                  onChange={(e) => setVisit((v) => ({ ...v, reason: e.target.value }))}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Crop concerned</span>
                <input
                  className="w-full rounded-xl border border-[var(--huza-line)] px-3 py-2"
                  required
                  value={visit.crop}
                  onChange={(e) => setVisit((v) => ({ ...v, crop: e.target.value }))}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Preferred date</span>
                <input
                  type="date"
                  className="w-full rounded-xl border border-[var(--huza-line)] px-3 py-2"
                  value={visit.preferredDate}
                  onChange={(e) => setVisit((v) => ({ ...v, preferredDate: e.target.value }))}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Description</span>
                <textarea
                  className="min-h-[100px] w-full rounded-xl border border-[var(--huza-line)] px-3 py-2"
                  required
                  value={visit.description}
                  onChange={(e) => setVisit((v) => ({ ...v, description: e.target.value }))}
                />
              </label>
            </>
          )}

          {msg ? <p className="text-sm text-[var(--huza-green-dark)]">{msg}</p> : null}

          <Button type="submit" disabled={busy} className="w-full sm:w-auto">
            {busy ? "Sending…" : "Submit request"}
          </Button>
        </form>
      </FarmerPanel>

      <FarmerPanel className="max-w-2xl">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="font-semibold text-[var(--huza-ink)]">My requests & visit reports</h2>
            <p className="mt-1 text-sm text-[var(--huza-muted)]">
              Live status and agronomist notes for your farm.
            </p>
          </div>
          <Button type="button" size="sm" variant="ghost" onClick={() => void loadHistory()}>
            Refresh
          </Button>
        </div>

        {historyLoading ? (
          <p className="mt-4 text-sm text-[var(--huza-muted)]">Loading history…</p>
        ) : requests.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--huza-muted)]">
            No requests yet. Submit advice or a farm visit above.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {requests.map((r) => (
              <li
                key={r.id}
                className="rounded-xl border border-[var(--huza-line)] bg-white p-3 text-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-[var(--huza-ink)]">
                      {r.kind === "VISIT" ? "Farm visit" : "Advice"} · {r.crop}
                    </p>
                    <p className="text-xs text-[var(--huza-muted)]">
                      {r.topicOrReason} · {formatWhen(r.createdAt)}
                      {r.scheduledAt ? ` · Scheduled ${formatWhen(r.scheduledAt)}` : ""}
                    </p>
                  </div>
                  <span className="rounded-lg bg-[var(--huza-mint)] px-2 py-1 text-xs font-bold text-[var(--huza-green-dark)]">
                    {statusLabel(r.status)}
                  </span>
                </div>
                {r.adminReply ? (
                  <p className="mt-2 rounded-lg bg-[var(--huza-mint)]/40 px-2.5 py-2 text-[var(--huza-ink)]">
                    <span className="font-semibold">Huza reply: </span>
                    {r.adminReply}
                  </p>
                ) : null}
                {r.followUps?.length ? (
                  <div className="mt-3 space-y-2 border-t border-[var(--huza-line)] pt-2">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--huza-muted)]">
                      Visit / follow-up ledger
                    </p>
                    {r.followUps.map((f) => (
                      <div key={f.id} className="rounded-lg bg-[var(--huza-soft,#f7f7f5)] px-2.5 py-2">
                        <p className="text-xs font-semibold text-[var(--huza-green-dark)]">
                          {followUpTypeLabel(f.type)} · {formatWhen(f.recordedAt)}
                        </p>
                        <p className="mt-0.5 text-[var(--huza-ink)]">{f.notes}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </FarmerPanel>
    </div>
  );
}
