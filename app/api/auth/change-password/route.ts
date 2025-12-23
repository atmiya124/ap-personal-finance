import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from "@/lib/rate-limit";

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

    const cookieStore = await cookies();
    const session = cookieStore.get("auth-session");

    if (!session || session.value !== "authenticated") {
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

    // Get the authenticated user - try by email first, then by default ID
    let user = await prisma.user.findUnique({
      where: { email: "atmiyapatel024@gmail.com" },
    });

    // If not found by email, try by default ID
    if (!user) {
      user = await prisma.user.findUnique({
        where: { id: "default-user" },
      });
    }

    // If user doesn't exist, this shouldn't happen if logged in
    // But if it does, we need to create the user first
    if (!user) {
      // Create user with the new password (since we can't verify current password for new user)
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await prisma.user.create({
        data: {
          id: "default-user",
          name: "Atmiya",
          email: "atmiyapatel024@gmail.com",
          password: hashedPassword,
        },
      });
      return NextResponse.json({ success: true, message: "Password set successfully" });
    }

    // If user exists but has no password, set it directly (first time setup)
    if (!user.password) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });
      return NextResponse.json({ success: true, message: "Password set successfully" });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
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
      where: { id: user.id },
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

