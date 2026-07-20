export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="h-8 w-40 animate-pulse rounded-lg bg-[var(--huza-mint)]" />
      <div className="mt-3 h-4 w-64 max-w-full animate-pulse rounded bg-[var(--huza-line)]/70" />
      <div className="mt-8 h-36 animate-pulse rounded-2xl border border-[var(--huza-line)] bg-white/80" />
      <div className="mt-6 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-11 animate-pulse rounded-xl bg-[var(--huza-mint)]" />
        ))}
      </div>
    </div>
  );
}
