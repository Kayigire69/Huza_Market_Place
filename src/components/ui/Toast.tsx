"use client";

import { create } from "zustand";

type Toast = {
  id: number;
  message: string;
};

type ToastState = {
  items: Toast[];
  show: (message: string) => void;
  dismiss: (id: number) => void;
};

let nextId = 1;

export const useToastStore = create<ToastState>((set) => ({
  items: [],
  show: (message) => {
    const id = nextId++;
    set((s) => ({ items: [...s.items.slice(-2), { id, message }] }));
    window.setTimeout(() => {
      set((s) => ({ items: s.items.filter((t) => t.id !== id) }));
    }, 2400);
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
    >
      {items.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto rounded-full border border-[var(--huza-line)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--huza-ink)] shadow-lg"
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
