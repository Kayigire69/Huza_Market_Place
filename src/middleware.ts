import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import {
  canAccessAdminPath,
  firstAllowedAdminPath,
  isAdminPortalRole,
  isSuperAdmin,
  isSuperAdminOnlyPath,
} from "@/lib/rbac";
import { portalPathForRole } from "@/lib/auth-redirect";

/**
 * Staff & partner portals are never advertised on the customer storefront.
 * Middleware enforces role checks so guessing a URL is not enough.
 *
 * Super Admin exclusive: /admin/staff, /admin/audit, /admin/settings, /admin/security
 */
const STAFF_PREFIXES = [
  "/admin",
  "/warehouse",
  "/procurement",
  "/delivery-portal",
] as const;

function isStaffPath(pathname: string) {
  return STAFF_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isFarmerPath(pathname: string) {
  return pathname === "/farmer" || pathname.startsWith("/farmer/");
}

function isPublicFarmerEntry(pathname: string) {
  return (
    pathname === "/farmer" ||
    pathname === "/farmer/register" ||
    pathname.startsWith("/farmer/register/")
  );
}

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;
    const role = token?.role as string | undefined;

    // Temp passwords must be changed before any staff/farmer portal access.
    if (
      token?.mustChangePassword &&
      pathname !== "/auth/change-password"
    ) {
      return NextResponse.redirect(new URL("/auth/change-password", req.url));
    }

    if (isStaffPath(pathname)) {
      const allowed: Record<string, string[]> = {
        "/admin": [
          "ADMIN",
          "SUPER_ADMIN",
          "MANAGER",
          "INVENTORY",
          "WAREHOUSE",
          "SUPPORT",
          "PROCUREMENT",
          "FINANCE",
        ],
        "/warehouse": ["WAREHOUSE", "INVENTORY", "ADMIN", "SUPER_ADMIN", "MANAGER"],
        "/procurement": ["PROCUREMENT", "ADMIN", "SUPER_ADMIN", "MANAGER"],
        "/delivery-portal": ["DELIVERY", "ADMIN", "SUPER_ADMIN", "MANAGER"],
      };
      const match = STAFF_PREFIXES.find((p) => pathname === p || pathname.startsWith(`${p}/`));
      const roles = match ? allowed[match] : ["ADMIN", "SUPER_ADMIN"];

      if (!role || !roles.includes(role)) {
        // Logged-in wrong role → their portal; guests → login
        if (role) {
          return NextResponse.redirect(new URL(portalPathForRole(role), req.url));
        }
        const login = new URL("/auth/login", req.url);
        login.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(login);
      }

      // Role-aware admin modules (Inventory / Support / Finance / etc.)
      if (pathname.startsWith("/admin") && !canAccessAdminPath(role, pathname)) {
        return NextResponse.redirect(new URL(firstAllowedAdminPath(role), req.url));
      }

      // Extra belt: Staff / Audit / Settings — Super Admin only
      if (pathname.startsWith("/admin") && isSuperAdminOnlyPath(pathname) && !isSuperAdmin(role)) {
        return NextResponse.redirect(new URL(firstAllowedAdminPath(role), req.url));
      }

      return NextResponse.next();
    }

    if (isFarmerPath(pathname) && !isPublicFarmerEntry(pathname)) {
      if (role !== "SUPPLIER" && !isAdminPortalRole(role)) {
        if (role) {
          return NextResponse.redirect(new URL(portalPathForRole(role), req.url));
        }
        const login = new URL("/auth/login", req.url);
        login.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(login);
      }
    }

    if (pathname === "/farmer" && role && role !== "SUPPLIER" && !isAdminPortalRole(role)) {
      return NextResponse.next();
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        if (pathname === "/auth/change-password") return !!token;

        if (isPublicFarmerEntry(pathname)) return true;
        if (pathname === "/supplier" || pathname.startsWith("/supplier/")) return true;

        if (isStaffPath(pathname) || (isFarmerPath(pathname) && !isPublicFarmerEntry(pathname))) {
          return !!token;
        }

        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/warehouse/:path*",
    "/procurement/:path*",
    "/delivery-portal/:path*",
    "/farmer",
    "/farmer/:path*",
    "/supplier",
    "/supplier/:path*",
    "/auth/change-password",
  ],
};
