/**
 * Public Entry Page destinations.
 * QR imageSrc assets encode the matching href URLs.
 */
export const ENTRY_LINKS = {
  customerWebsite: "/shop",
  farmersPortal: "/farmer",
  about: "/about",
  contact: "/contact",
} as const;

export const ENTRY_QR = {
  customer: {
    href: "https://www.youthhuza.rw/shop",
    imageSrc: "/qr/youthhuza-site-qr-branded.png",
  },
  farmers: {
    href: "https://www.youthhuza.rw/farmer",
    imageSrc: "/qr/youthhuza-farmer-qr-branded.png",
  },
} as const;
