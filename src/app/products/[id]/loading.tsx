function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--huza-line)] bg-white/80">
      <div className="aspect-square animate-pulse bg-[var(--huza-mint)]" />
      <div className="space-y-2 p-3">
        <div className="h-3 w-3/4 animate-pulse rounded bg-[var(--huza-line)]/70" />
        <div className="h-4 w-20 animate-pulse rounded bg-[var(--huza-mint)]" />
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6" aria-busy="true" aria-label="Loading product">
      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <div className="aspect-square animate-pulse rounded-3xl bg-[var(--huza-mint)]" />
          <div className="mt-3 flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 w-16 animate-pulse rounded-xl bg-[var(--huza-mint)]/70" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-4 w-28 animate-pulse rounded bg-[var(--huza-line)]/60" />
          <div className="h-9 w-72 max-w-full animate-pulse rounded-lg bg-[var(--huza-mint)]" />
          <div className="h-4 w-36 animate-pulse rounded bg-[var(--huza-line)]/50" />
          <div className="h-10 w-40 animate-pulse rounded-lg bg-[var(--huza-mint)]" />
          <div className="h-28 w-full animate-pulse rounded-2xl border border-[var(--huza-line)] bg-white/80" />
          <div className="flex gap-3 pt-2">
            <div className="h-11 w-28 animate-pulse rounded-xl bg-[var(--huza-line)]/40" />
            <div className="h-11 flex-1 max-w-xs animate-pulse rounded-xl bg-[var(--huza-green)]/30" />
          </div>
        </div>
      </div>

      <section className="mt-14">
        <div className="mb-6 h-7 w-56 animate-pulse rounded-lg bg-[var(--huza-mint)]" />
        <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </section>

      <section className="mt-14">
        <div className="mb-6 h-7 w-48 animate-pulse rounded-lg bg-[var(--huza-mint)]" />
        <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </section>
    </div>
  );
}
