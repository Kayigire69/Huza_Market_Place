import { FarmerComingSoon, FarmerPageHeader, FarmerPanel } from "@/components/portals/FarmerUi";
import Link from "next/link";

export default async function FarmerSupportPage({
  searchParams,
}: {
  searchParams?: Promise<{ topic?: string }>;
}) {
  const sp = searchParams ? await searchParams : {};
  const topic = sp.topic || "";
  const qualityFocus = topic === "quality-standards";

  return (
    <div>
      <FarmerPageHeader
        title="Farmer Support"
        subtitle="Practical guides — organic tips, soil, pests, harvest timing, and HUZA quality standards."
      />

      {qualityFocus ? (
        <FarmerPanel className="mb-5 max-w-2xl border-[var(--huza-green)]/35">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--huza-green-dark)]">
            Featured guide
          </p>
          <h2 className="mt-1 font-[family-name:var(--font-display)] text-xl font-bold text-[var(--huza-ink)]">
            How to Meet HUZA Quality Standards
          </h2>
          <p className="mt-1 text-xs text-[var(--huza-muted)]">5-minute guide · Updated for partners</p>
          <p className="mt-3 text-sm text-[var(--huza-muted)]">
            Learn the harvesting, handling, and cleanliness practices that reduce rejection and improve
            acceptance rates. Full library unlocks in the next Farmer Support phase — for now use this
            checklist while you prepare your next harvest.
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[var(--huza-ink)]">
            <li>Harvest at the right maturity — not overripe or underripe.</li>
            <li>Respect spray / pesticide wait times before harvest.</li>
            <li>Sort damaged produce; pack only sound crops.</li>
            <li>Keep hands, water, and containers clean.</li>
            <li>Take clear daylight photos for Huza review.</li>
          </ul>
          <Link
            href="/farmer/agronomist"
            className="mt-4 inline-block text-sm font-bold text-[var(--huza-green-dark)] underline underline-offset-4"
          >
            Still unsure? Ask an Agronomist
          </Link>
        </FarmerPanel>
      ) : null}

      <FarmerComingSoon
        title={qualityFocus ? "More guides coming next" : "Knowledge library coming next"}
        body="Short, practical guides (not a big e-learning platform): organic tips, soil, pests, harvest timing, post-harvest handling, and Huza quality standards."
        ctaHref="/farmer/dashboard"
        ctaLabel="Back to Dashboard"
      />
    </div>
  );
}
