import Link from "next/link";
import { FarmerPageHeader, FarmerPanel } from "@/components/portals/FarmerUi";

const CATEGORIES = [
  {
    slug: "soil",
    title: "Soil Management",
    body: "Test soil, compost, and organic matter for stronger root growth.",
  },
  {
    slug: "organic",
    title: "Organic Farming",
    body: "Inputs, certification path, and practices Huza looks for.",
  },
  {
    slug: "pests",
    title: "Pest & Disease Control",
    body: "Identify early signs and safe control methods.",
  },
  {
    slug: "fertilizer",
    title: "Fertilizer Application",
    body: "Timing, dosage, and avoiding chemical residues near harvest.",
  },
  {
    slug: "irrigation",
    title: "Irrigation",
    body: "Water efficiently without stressing crops.",
  },
  {
    slug: "harvest",
    title: "Harvesting",
    body: "Pick at the right maturity for Huza quality acceptance.",
  },
  {
    slug: "post-harvest",
    title: "Post-Harvest Handling",
    body: "Sorting, packing, and cold-chain habits that protect quality.",
  },
  {
    slug: "market",
    title: "Market Preparation",
    body: "Photos, quantities, and packing ready for Youth Huza purchase.",
  },
] as const;

export default async function FarmerTrainingPage({
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
        title="Training & Advisory"
        subtitle="Digital learning center — short guides to improve quality and earnings."
      />

      {qualityFocus ? (
        <FarmerPanel className="mb-5 max-w-2xl border-[var(--huza-green)]/35">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--huza-green-dark)]">
            Featured guide
          </p>
          <h2 className="mt-1 font-[family-name:var(--font-display)] text-xl font-bold text-[var(--huza-ink)]">
            How to Meet HUZA Quality Standards
          </h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[var(--huza-ink)]">
            <li>Harvest at the right maturity (not overripe or underripe).</li>
            <li>Respect spray / pesticide wait times before harvest.</li>
            <li>Sort damaged produce; pack only sound crops.</li>
            <li>Keep hands, water, and containers clean.</li>
            <li>Take clear daylight photos for Huza review.</li>
          </ul>
          <Link
            href="/farmer/agronomy"
            className="mt-4 inline-block text-sm font-bold text-[var(--huza-green-dark)] underline underline-offset-4"
          >
            Still unsure? Open Agronomy Support
          </Link>
        </FarmerPanel>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((c) => (
          <FarmerPanel key={c.slug} className="!p-4">
            <h3 className="font-semibold text-[var(--huza-ink)]">{c.title}</h3>
            <p className="mt-1 text-sm text-[var(--huza-muted)]">{c.body}</p>
            <p className="mt-3 text-[11px] font-bold uppercase tracking-wide text-[var(--huza-green-dark)]">
              Article · PDF · Seasonal tip
            </p>
          </FarmerPanel>
        ))}
      </div>

      <FarmerPanel className="mt-5 max-w-2xl">
        <p className="text-sm text-[var(--huza-muted)]">
          Full PDF guides and videos will be added here. For crop-specific help now, use{" "}
          <Link href="/farmer/agronomy" className="font-bold text-[var(--huza-green-dark)] underline">
            Agronomy Support
          </Link>
          .
        </p>
      </FarmerPanel>
    </div>
  );
}
