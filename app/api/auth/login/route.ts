import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/session";
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from "@/lib/rate-limit";

// Get credentials from environment variables
const DEFAULT_EMAIL = process.env.DEFAULT_EMAIL || "atmiyapatel024@gmail.com";
const DEFAULT_PASSWORD = process.env.DEFAULT_PASSWORD || "123456";

export async function POST(request: Request) {
  try {
    // Apply rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimitResult = checkRateLimit(
      `${clientId}:login`,
      RATE_LIMITS.login
    );

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: "Too many login attempts",
          message: "Please wait before trying again.",
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": String(RATE_LIMITS.login.maxRequests),
            "X-RateLimit-Remaining": String(rateLimitResult.remaining),
            "X-RateLimit-Reset": String(Math.ceil(rateLimitResult.resetTime / 1000)),
          },
        }
      );
    }

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find user by email
    let user = await prisma.user.findUnique({
      where: { email },
    });

    // If user doesn't exist and it's the default email, create it
    if (!user && email === DEFAULT_EMAIL) {
      const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
      user = await prisma.user.create({
        data: {
          id: "default-user",
          name: "Atmiya",
          email: DEFAULT_EMAIL,
          password: hashedPassword,
        },
      });
    }

    if (!user || !user.password) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Create session and generate JWT token
    const sessionToken = await createSession(user.id, user.email);

    // Update last login time
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        lastLoginAt: new Date(),
        failedLoginAttempts: 0, // Reset failed attempts on successful login
      },
    });

    // Set session cookie with JWT token
    const cookieStore = await cookies();
    cookieStore.set("auth-session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to login" },
      { status: 500 }
    );
  }
}

