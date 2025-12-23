import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { addSecurityHeaders } from "@/lib/security-headers";
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from "@/lib/rate-limit";

export function middleware(request: NextRequest) {
  const session = request.cookies.get("auth-session");
  const userId = request.cookies.get("user-id");
  const pathname = request.nextUrl.pathname;

  // Apply rate limiting to API routes
  if (pathname.startsWith("/api/")) {
    const clientId = getClientIdentifier(request);
    const rateLimitResult = checkRateLimit(
      `${clientId}:${pathname}`,
      pathname.includes("/auth/login") ? RATE_LIMITS.login : RATE_LIMITS.api
    );

    if (!rateLimitResult.allowed) {
      const response = NextResponse.json(
        {
          error: "Too many requests",
          message: "Rate limit exceeded. Please try again later.",
        },
        { status: 429 }
      );
      response.headers.set("X-RateLimit-Limit", String(RATE_LIMITS.api.maxRequests));
      response.headers.set("X-RateLimit-Remaining", String(rateLimitResult.remaining));
      response.headers.set("X-RateLimit-Reset", String(Math.ceil(rateLimitResult.resetTime / 1000)));
      return addSecurityHeaders(response, request);
    }
  }

  // Allow access to login page
  if (pathname === "/login") {
    if (session?.value && userId?.value) {
      // If already logged in, redirect to dashboard
      const response = NextResponse.redirect(new URL("/dashboard", request.url));
      return addSecurityHeaders(response, request);
    }
    const response = NextResponse.next();
    return addSecurityHeaders(response, request);
  }

  // Protect all other routes
  if (!session?.value || !userId?.value) {
    const loginUrl = new URL("/login", request.url);
    const response = NextResponse.redirect(loginUrl);
    return addSecurityHeaders(response, request);
  }

  const response = NextResponse.next();
  return addSecurityHeaders(response, request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)",
  ],
};

