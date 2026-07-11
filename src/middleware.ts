import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

/**
 * Staff & partner portals are never advertised on the customer storefront.
 * Middleware enforces role checks so guessing a URL is not enough.
 *
 * Public exceptions on the farmer portal:
 * - /farmer (login wall for partners)
 * - /farmer/register (unlisted dual registration — not linked from customer nav)
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
    const role = req.nextauth.token?.role as string | undefined;

    if (isStaffPath(pathname)) {
      const allowed: Record<string, string[]> = {
        "/admin": ["ADMIN"],
        "/warehouse": ["WAREHOUSE", "ADMIN"],
        "/procurement": ["PROCUREMENT", "ADMIN"],
        "/delivery-portal": ["DELIVERY", "ADMIN"],
      };
      const match = STAFF_PREFIXES.find((p) => pathname === p || pathname.startsWith(`${p}/`));
      const roles = match ? allowed[match] : ["ADMIN"];
      if (!role || !roles.includes(role)) {
        const login = new URL("/auth/login", req.url);
        login.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(login);
      }
      return NextResponse.next();
    }

    if (isFarmerPath(pathname) && !isPublicFarmerEntry(pathname)) {
      // Nested farmer routes (future) require SUPPLIER or ADMIN
      if (role !== "SUPPLIER" && role !== "ADMIN") {
        const login = new URL("/auth/login", req.url);
        login.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(login);
      }
    }

    // Logged-in customer who hits /farmer → keep them out of the partner dashboard area
    // (landing/register stay reachable so partners can switch accounts)
    if (pathname === "/farmer" && role && role !== "SUPPLIER" && role !== "ADMIN") {
      // Page-level guard also redirects; middleware soft-blocks authenticated customers
      // from treating /farmer as their home. Allow through so page can redirect cleanly.
      return NextResponse.next();
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Unlisted partner entry points — login wall / register without session
        if (isPublicFarmerEntry(pathname)) return true;

        // Legacy /supplier → page redirects to /farmer
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
  ],
};
