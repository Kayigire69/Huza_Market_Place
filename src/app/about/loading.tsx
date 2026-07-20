export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="h-8 w-52 animate-pulse rounded-lg bg-[var(--huza-mint)]" />
      <div className="mt-8 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-2xl border border-[var(--huza-line)] bg-white/80"
          />
        ))}
      </div>
    </div>
  );
}
