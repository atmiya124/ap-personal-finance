import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Security headers for production
 */
export function addSecurityHeaders(response: NextResponse, request: NextRequest): NextResponse {
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // 'unsafe-eval' needed for Next.js
    "style-src 'self' 'unsafe-inline'", // 'unsafe-inline' needed for Tailwind
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.alphavantage.co https://query1.finance.yahoo.com https://financialmodelingprep.com https://finnhub.io https://logo.clearbit.com https://api.dicebear.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");

  // Security headers
  response.headers.set("X-DNS-Prefetch-Control", "on");
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("Permissions-Policy", "geolocation=(), microphone=(), camera=()");

  // Remove server information
  response.headers.delete("X-Powered-By");

  return response;
}

