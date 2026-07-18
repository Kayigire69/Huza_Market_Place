/**
 * HUZA FRESH — UI design lock
 *
 * LOCKED at commit: fb8090c (and successors that do not touch presentation)
 *
 * Do NOT change unless the owner explicitly asks to redesign:
 * - Layouts, page structure, component placement
 * - CSS / Tailwind classes / globals / theme tokens
 * - Visual copy that affects chrome (headers, nav labels, footers)
 * - Card / hero / portal shell markup
 *
 * Allowed without redesign approval:
 * - Bug fixes that preserve identical UI
 * - API / DB / auth / performance behind the same screens
 * - New routes only when explicitly requested
 */
export const UI_DESIGN_LOCK = {
  status: "locked" as const,
  lockedAtCommit: "fb8090c",
  rule: "No layout, styling, or visual redesign without explicit owner approval.",
} as const;

export function isUiDesignLocked(): boolean {
  return UI_DESIGN_LOCK.status === "locked";
}
