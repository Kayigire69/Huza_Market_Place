import Link from "next/link";
import { listDeliveryZones } from "@/services/settings.service";
import { formatRwf } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DeliveryInfoPage() {
  const zones = await listDeliveryZones();

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--huza-green)]">
        HUZA FRESH
      </p>
      <h1 className="section-title mt-2">Delivery Information</h1>
      <p className="mt-4 text-[var(--huza-muted)] leading-relaxed">
        Youth Huza delivers your order with our own team. Choose Today, Tomorrow, or a scheduled
        slot at checkout. Share a live location or typed address for faster drop-off.
      </p>

      <h2 className="mt-10 font-semibold text-lg">Delivery zones &amp; fees</h2>
      <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--huza-line)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--huza-mint)] text-left">
            <tr>
              <th className="px-4 py-3">Area</th>
              <th className="px-4 py-3">Fee</th>
              <th className="px-4 py-3">Typical ETA</th>
            </tr>
          </thead>
          <tbody>
            {zones.map((z) => (
              <tr key={z.code} className="border-t border-[var(--huza-line)]">
                <td className="px-4 py-3">{z.labelEn}</td>
                <td className="px-4 py-3">{formatRwf(z.feeRwf)}</td>
                <td className="px-4 py-3">
                  {("etaLabelEn" in z && typeof z.etaLabelEn === "string" && z.etaLabelEn) ||
                    `About ${z.etaMinutes} min`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-6 text-sm text-[var(--huza-muted)]">
        Open daily 6:00 AM – 9:00 PM. Outside hours you can still browse and schedule for the next
        business day.
      </p>
      <Link href="/track" className="mt-6 inline-block font-semibold text-[var(--huza-green)]">
        Track an order →
      </Link>
    </div>
  );
}
