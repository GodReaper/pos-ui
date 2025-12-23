import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware for RBAC route protection
 * Protects /admin routes (admin only) and /biller routes (biller only)
 * Redirects to /login if no token
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("pos_auth_token")?.value;

  // Allow access to login page and public assets
  if (pathname === "/login" || pathname.startsWith("/_next") || pathname.startsWith("/api")) {
    // If already logged in and trying to access login, redirect based on role
    if (pathname === "/login" && token) {
      // We can't check role here without making an API call, so just allow it
      // The login page will handle redirecting if already logged in
      return NextResponse.next();
    }
    return NextResponse.next();
  }

  // Check for protected routes
  if (pathname.startsWith("/admin") || pathname.startsWith("/biller")) {
    // Check if token exists in cookie (set via cookie in addition to localStorage)
    // Since middleware runs on server, we check cookies
    // The client-side will also check localStorage for actual API calls
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Note: Role-based routing is handled client-side after fetching /auth/me
    // Middleware can't easily verify roles without API calls, so we rely on:
    // 1. Token presence check (above)
    // 2. Layout-level role checks in app/admin/layout.tsx and app/biller/layout.tsx
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|public).*)",
  ],
};
