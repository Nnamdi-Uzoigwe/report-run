import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Paths that do not require authentication
const PUBLIC_PATHS = new Set([
  "/",
  "/features",
  "/pricing",
  "/about",
  "/contact",
  "/login",
  "/register",
  "/setup",
  "/forgot-password",
  "/reset-password",
  "/accept-invite",
  "/email-verified",
  "/pay",
  "/pay/success",
  "/privacy-policy",
  "/terms-of-service",
  "/cookie-policy",
  "/data-processing-agreement",
]);

// Paths that authenticated users should be bounced away from
const AUTH_REDIRECT_PATHS = new Set(["/login", "/register", "/setup"]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow Next.js internals, static assets, and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api")   ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check if path is public (exact match or prefix)
  const isPublic = Array.from(PUBLIC_PATHS).some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  // We use the refresh token as the auth signal — it lives in an httpOnly cookie
  // so it's reliable even after page refresh. The access token is shorter-lived
  // and may already be expired, but the refresh flow handles that.
  const hasSession = !!request.cookies.get("rr_refresh")?.value;

  // Unauthenticated user trying to access a protected route
  if (!isPublic && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    // Preserve the original destination so we can redirect back after login
    if (pathname !== "/") {
      loginUrl.searchParams.set("from", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user trying to access login/register — send them home
  if (hasSession && AUTH_REDIRECT_PATHS.has(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};