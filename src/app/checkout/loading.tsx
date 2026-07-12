export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="h-8 w-40 animate-pulse rounded-lg bg-[var(--huza-mint)]" />
      <div className="mt-3 h-4 w-72 animate-pulse rounded bg-[var(--huza-line)]/70" />
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="h-72 animate-pulse rounded-2xl border border-[var(--huza-line)] bg-white/80" />
        <div className="h-72 animate-pulse rounded-2xl border border-[var(--huza-line)] bg-white/80" />
      </div>
    </div>
  );
}
