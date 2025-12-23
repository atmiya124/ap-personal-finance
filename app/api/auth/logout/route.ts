import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession, deleteSession } from "@/lib/session";

// Mark route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST() {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get("auth-session");

    // Delete session from database if token is valid
    if (sessionCookie?.value) {
      const session = await verifySession(sessionCookie.value);
      if (session?.sessionId) {
        await deleteSession(session.sessionId);
      }
    }

    // Clear session cookie
    cookieStore.delete("auth-session");

    return NextResponse.json({ success: true });
  } catch (error) {
    // Even if there's an error, clear the cookie
    const cookieStore = cookies();
    cookieStore.delete("auth-session");
    
    return NextResponse.json({ success: true });
  }
}

