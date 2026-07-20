"use client";

import { create } from "zustand";

type Toast = {
  id: number;
  message: string;
  tone?: "default" | "success" | "error";
};

type ToastState = {
  items: Toast[];
  show: (message: string, tone?: Toast["tone"]) => void;
  dismiss: (id: number) => void;
};

let nextId = 1;

export const useToastStore = create<ToastState>((set) => ({
  items: [],
  show: (message, tone = "default") => {
    const id = nextId++;
    set((s) => ({ items: [...s.items.slice(-2), { id, message, tone }] }));
    window.setTimeout(() => {
      set((s) => ({ items: s.items.filter((t) => t.id !== id) }));
    }, 2800);
  },
  dismiss: (id) => set((s) => ({ items: s.items.filter((t) => t.id !== id) })),
}));

export function ToastHost() {
  const items = useToastStore((s) => s.items);
  if (items.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-[max(0.75rem,env(safe-area-inset-top))] z-[100] flex flex-col items-center gap-2 px-4"
      aria-live="polite"
      role="status"
    >
      {items.map((t) => (
        <div
          key={t.id}
          className={
            t.tone === "success"
              ? "pointer-events-auto rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-900 shadow-lg"
              : t.tone === "error"
                ? "pointer-events-auto rounded-full border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-800 shadow-lg"
                : "pointer-events-auto rounded-full border border-[var(--huza-line)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--huza-ink)] shadow-lg"
          }
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
