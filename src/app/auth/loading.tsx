export default function Loading() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="mx-auto h-8 w-28 animate-pulse rounded-lg bg-[var(--huza-mint)]" />
      <div className="mt-8 space-y-4 rounded-2xl border border-[var(--huza-line)] bg-white p-6">
        <div className="h-11 animate-pulse rounded-xl bg-[var(--huza-mint)]" />
        <div className="h-11 animate-pulse rounded-xl bg-[var(--huza-mint)]" />
        <div className="h-11 animate-pulse rounded-xl bg-[var(--huza-green)]/25" />
      </div>
    </div>
  );
}
