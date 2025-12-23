import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/session";

/**
 * Get the current authenticated user's ID from the session
 * Returns null if not authenticated
 */
export async function getUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("auth-session");

    if (!sessionCookie || !sessionCookie.value) {
      return null;
    }

    // Verify JWT token and get session data
    const session = await verifySession(sessionCookie.value);
    
    if (!session) {
      return null;
    }

    return session.userId;
  } catch (error) {
    // Don't log in production to avoid exposing errors
    if (process.env.NODE_ENV === "development") {
      console.error("Error getting user ID:", error);
    }
    return null;
  }
}

/**
 * Get the current authenticated user
 * Returns null if not authenticated
 */
export async function getCurrentUser() {
  try {
    const userId = await getUserId();
    if (!userId) return null;

    return await prisma.user.findUnique({
      where: { id: userId },
    });
  } catch (error) {
    // Don't log in production to avoid exposing errors
    if (process.env.NODE_ENV === "development") {
      console.error("Error getting current user:", error);
    }
    return null;
  }
}

