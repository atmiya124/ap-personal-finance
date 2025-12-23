import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from "@/lib/rate-limit";
import { verifySession } from "@/lib/session";
import { getCurrentUser } from "@/lib/get-user-id";

// Mark route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    // Apply rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimitResult = checkRateLimit(
      `${clientId}:password-change`,
      RATE_LIMITS.passwordChange
    );

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: "Too many password change attempts",
          message: "Please wait before trying again.",
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": String(RATE_LIMITS.passwordChange.maxRequests),
            "X-RateLimit-Remaining": String(rateLimitResult.remaining),
            "X-RateLimit-Reset": String(Math.ceil(rateLimitResult.resetTime / 1000)),
          },
        }
      );
    }

    // Verify authentication using JWT session
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get("auth-session");

    if (!sessionCookie?.value) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify JWT session
    const session = await verifySession(sessionCookie.value);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the authenticated user
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // If user exists but has no password, set it directly (first time setup)
    if (!currentUser.password) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: currentUser.id },
        data: { password: hashedPassword },
      });
      return NextResponse.json({ success: true, message: "Password set successfully" });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, currentUser.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 401 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: currentUser.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ success: true, message: "Password changed successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to change password" },
      { status: 500 }
    );
  }
}

