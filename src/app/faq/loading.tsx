export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="h-8 w-24 animate-pulse rounded-lg bg-[var(--huza-mint)]" />
      <div className="mt-8 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-2xl border border-[var(--huza-line)] bg-white/80"
          />
        ))}
      </div>
    </div>
  );
}
