"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatRwf, formatUnit } from "@/lib/utils";
import { AdminProductImages } from "@/components/admin/AdminProductImages";

type PendingProduct = {
  id: string;
  nameEn: string;
  price: number;
  unit: string;
  stockQty: number;
  reviewStatus?: string | null;
  descriptionEn?: string | null;
  category?: { nameEn?: string } | null;
  supplier?: { businessName?: string; user?: { fullName?: string; phone?: string } | null } | null;
  images?: { id?: string; url: string; kind?: string; isCover?: boolean }[];
};

/**
 * Farmer-submitted products awaiting Huza inspection & approval
 * (Procurement Phase 6. Before purchase / website publish).
 */
export function AdminApprovalsClient() {
  const [products, setProducts] = useState<PendingProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/products?mode=pending");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setProducts(Array.isArray(data) ? data : data.products || []);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const review = async (id: string, action: "approve" | "reject") => {
    setBusy(id);
    try {
      let note: string | undefined;
      let recommendation: string | undefined;
      let confirmedQty: number | undefined;
      let qualityGrade: string | undefined;
      if (action === "reject") {
        note =
          window.prompt("Rejection reason (shown to farmer)", "Pesticide residue above accepted level") ||
          undefined;
        if (!note?.trim()) {
          setBusy(null);
          setMsg("Rejection cancelled. Reason is required for the farmer");
          return;
        }
        recommendation =
          window.prompt(
            "What should the farmer do next? (required. Partnership guidance)",
            "Wait the recommended number of days after spraying before harvesting."
          ) || undefined;
        if (!recommendation?.trim()) {
          setBusy(null);
          setMsg("Rejection cancelled. Recommendation is required so the farmer can improve");
          return;
        }
      } else {
        const product = products.find((p) => p.id === id);
        if (product && product.stockQty <= 0) {
          const qtyRaw = window.prompt(
            "Verified harvest quantity to stock (required. No invented qty)",
            ""
          );
          if (!qtyRaw?.trim()) {
            setBusy(null);
            setMsg("Approval cancelled. Enter verified quantity");
            return;
          }
          confirmedQty = Number(qtyRaw);
          if (!Number.isFinite(confirmedQty) || confirmedQty <= 0) {
            setBusy(null);
            setMsg("Enter a valid verified quantity");
            return;
          }
        }
        const gradeRaw = window.prompt("Quality grade required (1 / 2 / 3 or A / B / C)", "1");
        if (!gradeRaw?.trim()) {
          setBusy(null);
          setMsg("Approval cancelled. Grade is required");
          return;
        }
        qualityGrade = gradeRaw.trim();
      }
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, note, recommendation, confirmedQty, qualityGrade }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");
      setMsg(action === "approve" ? "Product approved" : "Product rejected with farmer guidance");
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="admin-panel-title">Product Approvals</h1>
      </div>

      {msg ? (
        <p className="rounded-lg border border-[var(--admin-line)] bg-[var(--admin-soft)] px-3 py-2 text-sm">
          {msg}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-[var(--admin-muted)]">Loading pending products…</p>
      ) : products.length === 0 ? (
        <div className="admin-panel p-6 text-sm text-[var(--admin-muted)]">
          No products waiting for approval.
        </div>
      ) : (
        <div className="space-y-4">
          {products.map((p) => (
            <article key={p.id} className="admin-panel space-y-3 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold">{p.nameEn}</h2>
                  <p className="text-sm text-[var(--admin-muted)]">
                    {p.supplier?.businessName || p.supplier?.user?.fullName || "Farmer"} ·{" "}
                    {p.category?.nameEn || "—"} · {formatRwf(p.price)}/{formatUnit(p.unit)}
                  </p>
                  {p.descriptionEn ? (
                    <p className="mt-2 text-sm text-[var(--admin-muted)]">{p.descriptionEn}</p>
                  ) : null}
                </div>
                <span className="admin-status admin-status-warn">
                  {p.reviewStatus || "PENDING"}
                </span>
              </div>

              <AdminProductImages
                productId={p.id}
                images={p.images || []}
                onDone={(m) => {
                  setMsg(m);
                  void load();
                }}
              />

              <div className="flex flex-wrap gap-2 border-t border-[var(--admin-line)] pt-3">
                <Button
                  type="button"
                  size="sm"
                  disabled={busy === p.id}
                  onClick={() => void review(p.id, "approve")}
                >
                  Approve
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="danger"
                  disabled={busy === p.id}
                  onClick={() => void review(p.id, "reject")}
                >
                  Reject
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
