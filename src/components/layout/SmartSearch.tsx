"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { cn } from "@/lib/utils";

type Suggestion = { type: string; id: string; label: string; href: string };

export function SmartSearch({
  className = "",
  size = "md",
}: {
  className?: string;
  /** lg ≈ 48–52px tall — Phase 1 header */
  size?: "md" | "lg";
}) {
  const { t } = useLocale();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const query = q.trim();
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(query)}`, {
          signal: ctrl.signal,
        });
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions || []);
          setOpen(true);
        }
      } catch {
        /* aborted or network */
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [q]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={box} className={cn("relative w-full", className)}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          router.push(q.trim() ? `/products?q=${encodeURIComponent(q.trim())}` : "/products");
          setOpen(false);
        }}
      >
        <Search
          className={cn(
            "pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--huza-muted)]",
            size === "lg" ? "size-[18px]" : "size-4"
          )}
          aria-hidden
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder={t("searchPlaceholder")}
          className={cn(
            "w-full rounded-[999px] border border-[var(--huza-line)] bg-[var(--huza-cream)] text-[var(--huza-ink)] outline-none transition-colors placeholder:text-[var(--huza-muted)] focus:border-[var(--huza-green)] focus:bg-white focus:ring-2 focus:ring-[var(--huza-green)]/20",
            size === "lg"
              ? "h-[48px] sm:h-[50px] pl-11 pr-5 text-[15px]"
              : "rounded-[999px] py-2.5 pl-10 pr-4 text-sm"
          )}
          autoComplete="off"
          enterKeyHint="search"
        />
      </form>
      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-2 max-h-72 w-full overflow-auto rounded-xl border border-[var(--huza-line)] bg-white shadow-lg">
          {suggestions.map((s) => (
            <li key={`${s.type}-${s.id}`}>
              <button
                type="button"
                className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-[var(--huza-mint)]"
                onClick={() => {
                  router.push(s.href);
                  setOpen(false);
                  setQ(s.label);
                }}
              >
                <span>{s.label}</span>
                <span className="text-[10px] uppercase tracking-wide text-[var(--huza-muted)]">
                  {s.type}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
