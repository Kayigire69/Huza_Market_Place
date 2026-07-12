export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="h-8 w-40 animate-pulse rounded-lg bg-[var(--huza-mint)]" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
        <div className="h-80 animate-pulse rounded-2xl border border-[var(--huza-line)] bg-white/80" />
        <div className="grid grid-cols-2 gap-5 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-56 animate-pulse rounded-2xl border border-[var(--huza-line)] bg-white/80"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
