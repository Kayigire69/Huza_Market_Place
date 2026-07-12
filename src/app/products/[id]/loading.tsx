export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="aspect-square animate-pulse rounded-2xl bg-[var(--huza-mint)]" />
        <div className="space-y-4">
          <div className="h-8 w-64 max-w-full animate-pulse rounded-lg bg-[var(--huza-mint)]" />
          <div className="h-4 w-40 animate-pulse rounded bg-[var(--huza-line)]/70" />
          <div className="h-10 w-48 animate-pulse rounded-lg bg-[var(--huza-mint)]" />
          <div className="h-24 w-full animate-pulse rounded-2xl border border-[var(--huza-line)] bg-white/80" />
          <div className="h-11 w-40 animate-pulse rounded-xl bg-[var(--huza-green)]/30" />
        </div>
      </div>
    </div>
  );
}
