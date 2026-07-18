"use client";

import { FormEvent, useState } from "react";
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

const VISIT_STATUSES = [
  "Request Submitted",
  "Agronomist Assigned",
  "Visit Scheduled",
  "Visit Completed",
  "Recommendations Available",
] as const;

/**
 * Agronomy Support — request advice or a farm visit.
 * Requests are stored as farmer notifications for Youth Huza follow-up.
 */
export function FarmerAgronomyClient() {
  const [mode, setMode] = useState<"advice" | "visit">("advice");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
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

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/supplier/agronomy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "advice"
            ? { kind: "advice", ...advice }
            : { kind: "visit", ...visit }
        ),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not submit request");
      setMsg(
        mode === "advice"
          ? "Advice request submitted. Youth Huza will follow up."
          : "Farm visit request submitted. You will see status updates in Messages."
      );
      setAdvice({ topic: ADVICE_TOPICS[0], crop: "", description: "" });
      setVisit({ reason: "", crop: "", preferredDate: "", description: "" });
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
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--huza-muted)]">
          Visit request progress
        </p>
        <ol className="mt-3 space-y-2">
          {VISIT_STATUSES.map((s, i) => (
            <li key={s} className="flex items-center gap-2 text-sm text-[var(--huza-ink)]">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--huza-mint)] text-[10px] font-bold text-[var(--huza-green-dark)]">
                {i + 1}
              </span>
              {s}
            </li>
          ))}
        </ol>
        <p className="mt-3 text-xs text-[var(--huza-muted)]">
          After you submit, status updates appear under Messages and Notifications.
        </p>
      </FarmerPanel>
    </div>
  );
}
