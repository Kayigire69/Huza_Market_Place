export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-[var(--huza-mint)]" />
      <div className="mt-3 h-4 w-72 max-w-full animate-pulse rounded bg-[var(--huza-line)]/70" />
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[4/5] animate-pulse rounded-[22px] bg-[var(--huza-mint)] sm:aspect-[5/4]"
          />
        ))}
      </div>
    </div>
  );
}
