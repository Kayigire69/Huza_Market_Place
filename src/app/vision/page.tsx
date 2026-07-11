import Link from "next/link";

export default function VisionPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--huza-green)]">
        Youth Huza
      </p>
      <h1 className="section-title mt-2">Our Vision</h1>
      <p className="mt-6 text-lg leading-relaxed text-[var(--huza-muted)]">
        A Rwanda where every household can order trusted farm-fresh food, and every verified farmer
        has a fair path to market — starting in Kigali and growing across East Africa.
      </p>
      <p className="mt-4 leading-relaxed text-[var(--huza-muted)]">
        We are building the systems (warehouses, delivery teams, and digital tools) so HUZA FRESH
        can scale without losing quality or the farmer relationships behind it.
      </p>
      <Link href="/farmer" className="mt-8 inline-block font-semibold text-[var(--huza-green)]">
        Farmers Portal →
      </Link>
    </div>
  );
}
