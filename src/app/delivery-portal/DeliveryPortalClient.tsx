"use client";

import { FormEvent, useState, startTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { formatRwf, formatUnit } from "@/lib/utils";

type DeliveryRow = {
  id: string;
  status: string;
  podNotes: string | null;
  podPhotoUrl: string | null;
  estimatedMinutes: number | null;
  order: {
    orderNumber: string;
    deliveryAddress: string;
    total: number;
    guestName: string | null;
    guestPhone: string | null;
    deliveryInstructions: string | null;
    user: { fullName: string; phone: string } | null;
    items: { quantity: number; product: { nameEn: string; unit: string } }[];
  };
};

export function DeliveryPortalClient({ deliveries }: { deliveries: DeliveryRow[] }) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [podFor, setPodFor] = useState<string | null>(null);

  const updateStatus = async (
    deliveryId: string,
    status: "OUT_FOR_DELIVERY" | "DELIVERED",
    extra?: { podNotes?: string; podPhotoUrl?: string }
  ) => {
    setLoading(true);
    setMsg("");
    const res = await fetch("/api/delivery-portal", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deliveryId, status, ...extra }),
    });
    const data = await res.json();
    setLoading(false);
    setMsg(res.ok ? `Updated to ${status}` : data.error || "Failed");
    if (res.ok) {
      setPodFor(null);
      router.refresh();
    }
  };

  const submitPod = async (e: FormEvent<HTMLFormElement>, deliveryId: string) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await updateStatus(deliveryId, "DELIVERED", {
      podNotes: String(form.get("podNotes") || ""),
      podPhotoUrl: String(form.get("podPhotoUrl") || ""),
    });
  };

  return (
    <div className="space-y-4">
      {msg && <p className="text-sm text-[var(--huza-green-dark)]">{msg}</p>}
      {deliveries.length === 0 ? (
        <p className="text-[var(--huza-muted)]">No assigned deliveries.</p>
      ) : (
        deliveries.map((d) => {
          const phone = d.order.user?.phone || d.order.guestPhone || "—";
          const name = d.order.user?.fullName || d.order.guestName || "Customer";
          return (
            <article
              key={d.id}
              className="rounded-2xl border border-[var(--huza-line)] bg-white p-5 space-y-3"
            >
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <p className="font-semibold text-[var(--huza-green-dark)]">
                    {d.order.orderNumber}
                  </p>
                  <p className="text-sm text-[var(--huza-muted)]">
                    {name} ·{" "}
                    <a href={`tel:${phone}`} className="text-[var(--huza-green)] font-medium">
                      {phone}
                    </a>
                  </p>
                </div>
                <span className="text-xs rounded-full bg-[var(--huza-mint)] px-2 py-1 h-fit">
                  {d.status}
                </span>
              </div>
              <p className="text-sm">{d.order.deliveryAddress}</p>
              {d.order.deliveryInstructions && (
                <p className="text-sm text-[var(--huza-muted)]">
                  Note: {d.order.deliveryInstructions}
                </p>
              )}
              <p className="text-xs text-[var(--huza-muted)]">
                {d.order.items
                  .map((i) => `${i.quantity} ${formatUnit(i.product.unit)} ${i.product.nameEn}`)
                  .join(", ")}{" "}
                · {formatRwf(d.order.total)}
              </p>
              {(d.podNotes || d.podPhotoUrl) && (
                <p className="text-xs text-[var(--huza-muted)]">
                  POD: {d.podNotes || "—"}
                  {d.podPhotoUrl ? ` · ${d.podPhotoUrl}` : ""}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {d.status !== "OUT_FOR_DELIVERY" && d.status !== "DELIVERED" && (
                  <Button
                    size="sm"
                    disabled={loading}
                    onClick={() => updateStatus(d.id, "OUT_FOR_DELIVERY")}
                  >
                    Out for delivery
                  </Button>
                )}
                {d.status !== "DELIVERED" && (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={loading}
                    onClick={() => setPodFor(podFor === d.id ? null : d.id)}
                  >
                    Mark delivered + POD
                  </Button>
                )}
              </div>
              {podFor === d.id && (
                <form
                  onSubmit={(e) => submitPod(e, d.id)}
                  className="mt-2 space-y-2 rounded-xl bg-[var(--huza-mint)]/40 p-3"
                >
                  <label className="label">POD notes</label>
                  <textarea
                    name="podNotes"
                    className="input-field min-h-20"
                    placeholder="Received by…"
                    required
                  />
                  <label className="label">POD photo URL</label>
                  <input
                    name="podPhotoUrl"
                    className="input-field"
                    placeholder="https://… or /uploads/…"
                  />
                  <Button type="submit" size="sm" disabled={loading}>
                    Confirm delivered
                  </Button>
                </form>
              )}
            </article>
          );
        })
      )}
    </div>
  );
}
