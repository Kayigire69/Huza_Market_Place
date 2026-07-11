/** Client-safe redirect helper (no server-only imports). */
export function portalPathForRole(role?: string | null, opts?: { mustChangePassword?: boolean }) {
  if (opts?.mustChangePassword) return "/auth/change-password";

  switch (role) {
    case "SUPER_ADMIN":
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
