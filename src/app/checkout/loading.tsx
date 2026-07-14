export default function CheckoutLoading() {
  return (
    <div className="min-h-screen bg-[var(--huza-cream,#F7FBF8)]">
      <div className="h-[88px] border-b border-[var(--huza-line)] bg-white" />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-2xl border border-[var(--huza-line)] bg-white"
            />
          ))}
        </div>
        <div className="hidden h-64 animate-pulse rounded-2xl border border-[var(--huza-line)] bg-white lg:block" />
      </div>
    </div>
  );
}
