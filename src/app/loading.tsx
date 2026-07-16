function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--huza-line)] bg-white/80">
      <div className="aspect-square animate-pulse bg-[var(--huza-mint)]" />
      <div className="space-y-2 p-3">
        <div className="h-3 w-3/4 animate-pulse rounded bg-[var(--huza-line)]/70" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-[var(--huza-line)]/50" />
        <div className="h-4 w-20 animate-pulse rounded bg-[var(--huza-mint)]" />
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="home-surface" aria-busy="true" aria-label="Loading">
      {/* Promo strip */}
      <div className="border-b border-[var(--huza-line)] bg-[#f3f6f4]">
        <div className="mx-auto flex max-w-7xl justify-center px-3 py-2">
          <div className="h-3 w-56 animate-pulse rounded bg-[var(--huza-line)]/60" />
        </div>
      </div>

      {/* Hero */}
      <section className="border-b border-[var(--huza-line)] bg-white">
        <div className="mx-auto grid max-w-7xl items-center gap-4 px-4 py-3 sm:gap-6 sm:px-6 sm:py-4 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] md:gap-8 md:py-5">
          <div className="space-y-3">
            <div className="h-8 w-64 max-w-full animate-pulse rounded-lg bg-[var(--huza-mint)] sm:h-10 sm:w-80" />
            <div className="h-4 w-full max-w-md animate-pulse rounded bg-[var(--huza-line)]/70" />
            <div className="h-4 w-3/4 max-w-sm animate-pulse rounded bg-[var(--huza-line)]/50" />
            <div className="mt-2 h-12 w-40 animate-pulse rounded-xl bg-[var(--huza-green)]/30" />
            <div className="flex gap-4 pt-1">
              <div className="h-3 w-20 animate-pulse rounded bg-[var(--huza-line)]/60" />
              <div className="h-3 w-24 animate-pulse rounded bg-[var(--huza-line)]/60" />
              <div className="h-3 w-16 animate-pulse rounded bg-[var(--huza-line)]/60" />
            </div>
          </div>
          <div className="h-[170px] animate-pulse rounded-3xl bg-[var(--huza-mint)] sm:h-[210px] md:h-[290px] lg:h-[315px] md:w-[92%] md:justify-self-end" />
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto mt-8 max-w-7xl px-4 sm:mt-12 sm:px-6">
        <div className="mb-4 flex items-end justify-between">
          <div className="space-y-2">
            <div className="h-7 w-48 animate-pulse rounded-lg bg-[var(--huza-mint)]" />
            <div className="h-3 w-40 animate-pulse rounded bg-[var(--huza-line)]/60" />
          </div>
          <div className="h-4 w-16 animate-pulse rounded bg-[var(--huza-line)]/50" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[4/5] animate-pulse rounded-[22px] bg-[var(--huza-mint)] sm:aspect-[5/4]"
            />
          ))}
        </div>
      </section>

      {/* Product rail */}
      <section className="mx-auto mt-10 max-w-7xl px-4 sm:mt-14 sm:px-6">
        <div className="mb-4 h-7 w-40 animate-pulse rounded-lg bg-[var(--huza-mint)]" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </section>
    </div>
  );
}
