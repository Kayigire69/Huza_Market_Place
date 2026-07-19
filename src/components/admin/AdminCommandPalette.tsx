"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { canAccessAdminPath } from "@/lib/rbac";

type SearchHit = {
  type: string;
  id: string;
  label: string;
  sub: string;
  href: string;
};

type Command = {
  id: string;
  label: string;
  hint?: string;
  href?: string;
  run?: () => void;
  group: string;
};

const NAV_COMMANDS: Command[] = [
  { id: "nav-dash", label: "Go to Dashboard", href: "/admin", group: "Navigate" },
  { id: "nav-orders", label: "Go to Orders", href: "/admin/orders", group: "Navigate" },
  { id: "nav-support", label: "Go to Support", href: "/admin/support", group: "Navigate" },
  { id: "nav-categories", label: "Go to Categories", href: "/admin/categories", group: "Navigate" },
  { id: "nav-products", label: "Go to Products", href: "/admin/products", group: "Navigate" },
  { id: "nav-promotions", label: "Go to Promotions", href: "/admin/offers", group: "Navigate" },
  { id: "nav-approvals", label: "Go to Product Approvals", href: "/admin/approvals", group: "Navigate" },
  { id: "nav-agronomy", label: "Go to Agronomy Support", href: "/admin/agronomy", group: "Navigate" },
  { id: "nav-crops", label: "Go to Crop Monitoring", href: "/admin/crops", group: "Navigate" },
  { id: "nav-photography", label: "Go to Photography Queue", href: "/admin/photography", group: "Navigate" },
  { id: "nav-market", label: "Go to Market Procurement", href: "/admin/procurement/market", group: "Navigate" },
  { id: "nav-farmers", label: "Go to Farmers", href: "/admin/suppliers", group: "Navigate" },
  { id: "nav-delivery", label: "Go to Deliveries", href: "/admin/delivery", group: "Navigate" },
  { id: "nav-reports", label: "Go to Reports", href: "/admin/reports", group: "Navigate" },
  { id: "nav-customers", label: "Go to Customers", href: "/admin/customers", group: "Navigate" },
  { id: "nav-payments", label: "Go to Payments", href: "/admin/payments", group: "Navigate" },
  { id: "nav-inventory", label: "Go to Inventory", href: "/admin/inventory", group: "Navigate" },
  { id: "nav-procurement", label: "Go to Purchase Orders", href: "/admin/procurement/orders", group: "Navigate" },
  { id: "nav-settings", label: "Go to Settings", href: "/admin/settings", group: "Navigate" },
  { id: "act-product", label: "Create product", href: "/admin/products", group: "Actions" },
  { id: "act-farmer", label: "Approve farmer", href: "/admin/suppliers", group: "Actions" },
  { id: "act-promo", label: "Create promotion", href: "/admin/offers", group: "Actions" },
  { id: "act-po", label: "New purchase order", href: "/admin/procurement/orders", group: "Actions" },
  {
    id: "act-pending",
    label: "Pending deliveries",
    href: "/admin/delivery",
    group: "Actions",
  },
];

export function AdminCommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const role = session?.user?.role;
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setQ("");
    setHits([]);
    setActive(0);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  useEffect(() => {
    if (!open || q.trim().length < 2) {
      setHits([]);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(q.trim())}`);
        if (res.ok) {
          const data = await res.json();
          const results = (data.results || []) as SearchHit[];
          setHits(results.filter((h) => canAccessAdminPath(role, h.href)));
        }
      } catch {
        setHits([]);
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => clearTimeout(t);
  }, [q, open]);

  const commands = useMemo(() => {
    const allowed = NAV_COMMANDS.filter(
      (c) => !c.href || canAccessAdminPath(role, c.href)
    );
    const needle = q.trim().toLowerCase();
    if (!needle) return allowed;
    return allowed.filter(
      (c) =>
        c.label.toLowerCase().includes(needle) ||
        (c.hint && c.hint.toLowerCase().includes(needle))
    );
  }, [q, role]);

  const rows = useMemo(() => {
    const list: { kind: "hit" | "cmd"; key: string; label: string; sub?: string; href?: string }[] =
      [];
    for (const h of hits) {
      list.push({
        kind: "hit",
        key: `${h.type}-${h.id}`,
        label: h.label,
        sub: `${h.type} · ${h.sub}`,
        href: h.href,
      });
    }
    for (const c of commands) {
      list.push({
        kind: "cmd",
        key: c.id,
        label: c.label,
        sub: c.group,
        href: c.href,
      });
    }
    return list.slice(0, 14);
  }, [hits, commands]);

  useEffect(() => {
    setActive(0);
  }, [rows.length, q]);

  const go = (href?: string) => {
    if (!href) return;
    onClose();
    router.push(href);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((i) => Math.min(i + 1, Math.max(0, rows.length - 1)));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const row = rows[active];
        if (row?.href) go(row.href);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, rows, active, onClose]);

  if (!open) return null;

  return (
    <div className="admin-cmd-overlay" role="dialog" aria-modal aria-label="Command palette">
      <button type="button" className="admin-cmd-backdrop" aria-label="Close" onClick={onClose} />
      <div className="admin-cmd-panel">
        <div className="admin-cmd-input-wrap">
          <span className="admin-cmd-kbd">⌘K</span>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search orders, products, farmers, customers… or jump anywhere"
            className="admin-cmd-input"
          />
          {loading ? <span className="admin-cmd-loading">…</span> : null}
        </div>
        <ul className="admin-cmd-list">
          {rows.length === 0 ? (
            <li className="admin-cmd-empty">Type to search or filter commands</li>
          ) : (
            rows.map((row, i) => (
              <li key={row.key}>
                <button
                  type="button"
                  className={`admin-cmd-item ${i === active ? "is-active" : ""}`}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(row.href)}
                >
                  <span className="admin-cmd-item-label">{row.label}</span>
                  {row.sub ? <span className="admin-cmd-item-sub">{row.sub}</span> : null}
                </button>
              </li>
            ))
          )}
        </ul>
        <p className="admin-cmd-hint">↑↓ navigate · Enter open · Esc close</p>
      </div>
    </div>
  );
}
