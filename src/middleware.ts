import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
/** Edge-safe role helpers only — never import @/lib/auth (pulls Redis/ioredis). */
import { isAdminPortalRole, isSuperAdmin, isSuperAdminOnlyPath } from "@/lib/rbac";

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

function isAuthExempt(pathname: string) {
  return (
    pathname === "/auth/change-password" ||
    pathname.startsWith("/auth/change-password/") ||
    pathname === "/auth/forgot-password" ||
    pathname.startsWith("/auth/forgot-password/") ||
    pathname === "/auth/reset-password" ||
    pathname.startsWith("/auth/reset-password/") ||
    pathname === "/auth/login" ||
    pathname.startsWith("/api/auth/")
  );
}

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;
    const role = token?.role as string | undefined;

    // Force temporary-password holders to change before using the app
    if (token?.mustChangePassword && !isAuthExempt(pathname) && !pathname.startsWith("/api/auth")) {
      if (!pathname.startsWith("/api/")) {
        return NextResponse.redirect(new URL("/auth/change-password", req.url));
      }
    }

    if (isStaffPath(pathname)) {
      const allowed: Record<string, string[]> = {
        "/admin": ["ADMIN", "SUPER_ADMIN"],
        "/warehouse": ["WAREHOUSE", "ADMIN", "SUPER_ADMIN"],
        "/procurement": ["PROCUREMENT", "ADMIN", "SUPER_ADMIN"],
        "/delivery-portal": ["DELIVERY", "ADMIN", "SUPER_ADMIN"],
      };
      const match = STAFF_PREFIXES.find((p) => pathname === p || pathname.startsWith(`${p}/`));
      const roles = match ? allowed[match] : ["ADMIN", "SUPER_ADMIN"];

      if (!role || !roles.includes(role)) {
        const login = new URL("/auth/login", req.url);
        login.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(login);
      }

      // Employee Management / Audit / System Settings — Super Admin only
      if (pathname.startsWith("/admin") && isSuperAdminOnlyPath(pathname) && !isSuperAdmin(role)) {
        return NextResponse.redirect(new URL("/admin", req.url));
      }

      return NextResponse.next();
    }

    if (isFarmerPath(pathname) && !isPublicFarmerEntry(pathname)) {
      if (role !== "SUPPLIER" && !isAdminPortalRole(role)) {
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
