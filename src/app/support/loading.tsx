export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="h-3 w-24 animate-pulse rounded bg-[var(--huza-mint)]" />
      <div className="mt-3 h-8 w-64 animate-pulse rounded-lg bg-[var(--huza-mint)]" />
      <div className="mt-3 h-4 w-full max-w-md animate-pulse rounded bg-[var(--huza-line)]/70" />
      <div className="mt-8 h-72 animate-pulse rounded-2xl border border-[var(--huza-line)] bg-white/80" />
    </div>
  );
}
