export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="h-8 w-36 animate-pulse rounded-lg bg-[var(--huza-mint)]" />
      <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-56 animate-pulse rounded-2xl border border-[var(--huza-line)] bg-white/80"
          />
        ))}
      </div>
    </div>
  );
}
