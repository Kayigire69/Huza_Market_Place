/** Client-safe redirect helper (no server-only imports). */
export function portalPathForRole(role?: string | null) {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "SUPPLIER":
      return "/farmer";
    case "WAREHOUSE":
      return "/warehouse";
    case "PROCUREMENT":
      return "/procurement";
    case "DELIVERY":
      return "/delivery-portal";
    case "SUPPORT":
      return "/support";
    default:
      return "/account";
  }
}
