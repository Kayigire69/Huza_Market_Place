import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--huza-green)]">
        HUZA FRESH
      </p>
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--huza-green-dark)]">
        Page not found
      </h1>
      <p className="mt-4 text-[var(--huza-muted)]">
        That page doesn&apos;t exist or was moved. Head back to the shop to keep browsing.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex rounded-full bg-[var(--huza-green)] px-5 py-2.5 text-sm font-semibold text-white"
      >
        Back to home
      </Link>
    </div>
  );
}
