import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";

export async function isAuthenticated() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("auth-session");
    
    if (!sessionCookie?.value) {
      return false;
    }
    
    // Verify JWT token
    const session = await verifySession(sessionCookie.value);
    return session !== null;
  } catch (error) {
    return false;
  }
}

