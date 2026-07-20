export default function Loading() {
  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
      <div className="h-8 w-44 animate-pulse rounded-lg bg-[var(--huza-mint)]" />
      <div className="mt-3 h-4 w-56 max-w-full animate-pulse rounded bg-[var(--huza-line)]/70" />
      <div className="mt-8 space-y-3 rounded-2xl border border-[var(--huza-line)] bg-white p-6">
        <div className="h-11 animate-pulse rounded-xl bg-[var(--huza-mint)]" />
        <div className="h-11 animate-pulse rounded-xl bg-[var(--huza-mint)]" />
        <div className="h-11 animate-pulse rounded-xl bg-[var(--huza-green)]/30" />
      </div>
    </div>
  );
}
