export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-56 animate-pulse rounded-lg bg-[var(--huza-mint)]" />
      <div className="h-4 w-80 animate-pulse rounded bg-[var(--huza-line)]/70" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="admin-kpi h-24 animate-pulse bg-[var(--huza-mint)]/50"
          />
        ))}
      </div>
      <div className="admin-panel h-64 animate-pulse" />
    </div>
  );
}
