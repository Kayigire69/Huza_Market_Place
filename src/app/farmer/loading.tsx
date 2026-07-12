export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="h-24 animate-pulse rounded-2xl border border-[var(--huza-line)] bg-white/85" />
      <div className="mt-6 h-12 animate-pulse rounded-xl bg-[var(--huza-mint)]/60" />
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="h-72 animate-pulse rounded-2xl border border-[var(--huza-line)] bg-white/85" />
        <div className="h-72 animate-pulse rounded-2xl border border-[var(--huza-line)] bg-white/85" />
      </div>
    </div>
  );
}
