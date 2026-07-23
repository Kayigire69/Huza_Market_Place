import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";
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
 * Super Admin exclusive: /admin/staff, /admin/cleanup, /admin/audit, /admin/settings, /admin/security
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
    pathname === "/farmer/login" ||
    pathname.startsWith("/farmer/login/") ||
    pathname === "/farmer/register" ||
    pathname.startsWith("/farmer/register/")
  );
}

function needsPortalAuth(pathname: string) {
  if (pathname === "/auth/change-password") return true;
  if (pathname === "/supplier" || pathname.startsWith("/supplier/")) return true;
  if (isStaffPath(pathname)) return true;
  if (isFarmerPath(pathname)) return true;
  return false;
}

/**
 * Bots probe React2Shell / Server Actions with garbage IDs like "x" or "test".
 * Real Next.js action IDs are long hashes; reject short probes before they hit the runtime.
 */
function blockMalformedServerAction(req: NextRequest): NextResponse | null {
  if (req.method !== "POST") return null;
  const action = req.headers.get("next-action");
  if (action == null) return null;
  if (action.length < 16) {
    return new NextResponse(null, { status: 400 });
  }
  return null;
}

const portalAuth = withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;
    const role = token?.role as string | undefined;
    const allowedModules = Array.isArray(token?.allowedModules)
      ? (token.allowedModules as string[])
      : [];

    // Temp passwords must be changed before staff portal access (not Farmers Portal NID auth).
    if (
      token?.mustChangePassword &&
      role !== "SUPPLIER" &&
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
      if (pathname.startsWith("/admin") && !canAccessAdminPath(role, pathname, allowedModules)) {
        return NextResponse.redirect(new URL(firstAllowedAdminPath(role, allowedModules), req.url));
      }

      // Extra belt: Staff / Audit / Settings. Super Admin only
      if (pathname.startsWith("/admin") && isSuperAdminOnlyPath(pathname) && !isSuperAdmin(role)) {
        return NextResponse.redirect(new URL(firstAllowedAdminPath(role, allowedModules), req.url));
      }

      return NextResponse.next();
    }

    if (isFarmerPath(pathname) && !isPublicFarmerEntry(pathname)) {
      if (role !== "SUPPLIER" && !isAdminPortalRole(role)) {
        if (role) {
          return NextResponse.redirect(new URL(portalPathForRole(role), req.url));
        }
        const login = new URL("/farmer/login", req.url);
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

export default function middleware(req: NextRequest, event: NextFetchEvent) {
  const blocked = blockMalformedServerAction(req);
  if (blocked) return blocked;

  if (!needsPortalAuth(req.nextUrl.pathname)) {
    return NextResponse.next();
  }

  // withAuth widens the request type; portalAuth only runs for matched portal paths.
  return (portalAuth as unknown as (
    request: NextRequest,
    event: NextFetchEvent
  ) => ReturnType<typeof portalAuth>)(req, event);
}

export const config = {
  matcher: [
    /*
     * Run on app routes (not static assets) so malformed next-action probes
     * on "/" are rejected before Next.js tries to resolve them.
     */
    "/((?!_next/static|_next/image|favicon.ico|uploads/|qr/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|json)$).*)",
  ],
};
