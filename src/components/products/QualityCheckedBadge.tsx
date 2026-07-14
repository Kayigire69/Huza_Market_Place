/** Shared HUZA Quality Checked / Verified badge for storefront. */
export function QualityCheckedBadge({
  compact = false,
  className = "",
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md bg-[var(--huza-green-dark)] text-white font-semibold ${
        compact ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1"
      } ${className}`}
      title="Inspected and approved by Youth Huza before sale"
    >
      <span aria-hidden>✓</span>
      {compact ? "Quality Checked" : "HUZA Quality Checked"}
    </span>
  );
}
