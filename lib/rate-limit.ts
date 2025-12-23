/**
 * Simple in-memory rate limiting implementation
 * For production, consider using Redis or a dedicated rate limiting service
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

/**
 * Clean up expired entries periodically
 * Only run in runtime environment, not during build
 */
if (typeof window !== "undefined" || (typeof process !== "undefined" && process.env.NODE_ENV !== "production" && typeof setInterval !== "undefined")) {
  // Only set up interval in development or browser environment
  // In production, we'll rely on request-based cleanup
}

export interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum number of requests per window
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

/**
 * Check if a request should be rate limited
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions
): RateLimitResult {
  const now = Date.now();
  const key = identifier;
  const entry = store[key];

  // If no entry or expired, create new entry
  if (!entry || entry.resetTime < now) {
    store[key] = {
      count: 1,
      resetTime: now + options.windowMs,
    };
    return {
      allowed: true,
      remaining: options.maxRequests - 1,
      resetTime: now + options.windowMs,
    };
  }

  // If limit exceeded
  if (entry.count >= options.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  // Increment count
  entry.count++;
  return {
    allowed: true,
    remaining: options.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Get client identifier from request (IP address or user ID)
 */
export function getClientIdentifier(request: Request): string {
  // Try to get IP from headers (works with most proxies)
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0]?.trim() || realIp || "unknown";

  return ip;
}

/**
 * Rate limit options for different endpoints
 */
export const RATE_LIMITS = {
  // Login attempts: 5 per 15 minutes
  login: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
  },
  // API requests: 100 per minute
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
  },
  // Password change: 3 per hour
  passwordChange: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
  },
  // General requests: 200 per minute
  general: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 200,
  },
} as const;
