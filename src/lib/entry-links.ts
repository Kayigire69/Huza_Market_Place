/**
 * Public Entry Page destinations.
 * Swap QR imageSrc later without changing UI components.
 */
export const ENTRY_LINKS = {
  customerWebsite: "/shop",
  farmersPortal: "/farmer",
  about: "/about",
  contact: "/contact",
} as const;

export const ENTRY_QR = {
  customer: {
    /** Target encoded by the official customer QR (replace later if needed). */
    href: "https://www.youthhuza.rw",
    caption: "Customer Website QR",
    /** Set to e.g. "/qr/youthhuza-site-qr-branded.png" when ready. */
    imageSrc: null as string | null,
  },
  farmers: {
    href: "https://farmers.youthhuza.rw",
    caption: "Farmers Portal QR",
    imageSrc: null as string | null,
  },
} as const;
