/** Client-safe redirect helper (no server-only imports). */
export function portalPathForRole(role?: string | null) {
  switch (role) {
    case "SUPER_ADMIN":
    case "ADMIN":
    case "MANAGER":
    case "INVENTORY":
    case "WAREHOUSE":
    case "SUPPORT":
    case "PROCUREMENT":
    case "FINANCE":
      return "/admin";
    case "SUPPLIER":
      return "/farmer/dashboard";
    case "DELIVERY":
      return "/delivery-portal";
    default:
      return "/account";
  }
}
