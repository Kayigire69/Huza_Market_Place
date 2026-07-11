import Link from "next/link";

export default function MissionPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--huza-green)]">
        Youth Huza
      </p>
      <h1 className="section-title mt-2">Our Mission</h1>
      <p className="mt-6 text-lg leading-relaxed text-[var(--huza-muted)]">
        Youth Huza connects Rwanda&apos;s farmers to households through HUZA FRESH — buying quality
        produce fairly, checking it carefully, and delivering it under one trusted brand.
      </p>
      <p className="mt-4 leading-relaxed text-[var(--huza-muted)]">
        We exist so farmers earn reliably, customers get farm-fresh food, and young people build
        livelihoods in agriculture and logistics.
      </p>
      <Link href="/about" className="mt-8 inline-block font-semibold text-[var(--huza-green)]">
        About Youth Huza →
      </Link>
    </div>
  );
}
