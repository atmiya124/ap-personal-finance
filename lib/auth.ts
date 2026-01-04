
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";


export async function isAuthenticated() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("auth-session");
    if (!sessionCookie?.value) {
      return false;
    }
    const session = await verifySession(sessionCookie.value);
    return session !== null;
  } catch (error) {
    return false;
  }
}

// Returns user info if authenticated, otherwise null
export async function getAuthenticatedUser() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("auth-session");
    if (!sessionCookie?.value) {
      return null;
    }
    const session = await verifySession(sessionCookie.value);
    if (!session) {
      return null;
    }
    return {
      userId: session.userId,
      email: session.email,
      sessionId: session.sessionId,
    };
  } catch (error) {
    return null;
  }
}

