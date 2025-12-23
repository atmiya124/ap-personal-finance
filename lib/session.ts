import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || crypto.randomBytes(64).toString("hex");
const SESSION_DURATION_DAYS = 7; // 7 days

export interface SessionPayload {
  userId: string;
  email: string;
  sessionId: string;
}

/**
 * Create a new session for a user
 */
export async function createSession(userId: string, email: string): Promise<string> {
  // Generate a unique session ID
  const sessionId = crypto.randomBytes(32).toString("hex");
  
  // Calculate expiration date
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  // Create session in database
  await prisma.session.create({
    data: {
      id: sessionId,
      token: sessionId, // Store session ID as token for verification
      userId,
      expiresAt,
    },
  });

  // Create JWT token with session information
  const payload: SessionPayload = {
    userId,
    email,
    sessionId,
  };

  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: `${SESSION_DURATION_DAYS}d`,
  });

  return token;
}

/**
 * Verify and validate a session token
 */
export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as SessionPayload;
    
    if (!decoded.sessionId || !decoded.userId) {
      return null;
    }

    // Verify session exists in database and is not expired
    const session = await prisma.session.findUnique({
      where: { token: decoded.sessionId },
      include: { user: { select: { id: true, email: true } } },
    });

    if (!session) {
      return null;
    }

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      // Clean up expired session
      await prisma.session.delete({ where: { id: session.id } });
      return null;
    }

    // Verify user still exists
    if (!session.user) {
      await prisma.session.delete({ where: { id: session.id } });
      return null;
    }

    return {
      userId: session.userId,
      email: session.user.email,
      sessionId: session.id,
    };
  } catch (error) {
    // Token is invalid or expired
    if (process.env.NODE_ENV === "development") {
      console.error("Session verification error:", error);
    }
    return null;
  }
}

/**
 * Delete a session (logout)
 */
export async function deleteSession(sessionId: string): Promise<void> {
  try {
    await prisma.session.delete({
      where: { token: sessionId },
    });
  } catch (error) {
    // Session might not exist, ignore error
    if (process.env.NODE_ENV === "development") {
      console.error("Error deleting session:", error);
    }
  }
}

/**
 * Clean up expired sessions (should be run periodically)
 */
export async function cleanupExpiredSessions(): Promise<number> {
  try {
    const result = await prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
    return result.count;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error cleaning up sessions:", error);
    }
    return 0;
  }
}

/**
 * Delete all sessions for a user (force logout from all devices)
 */
export async function deleteAllUserSessions(userId: string): Promise<void> {
  try {
    await prisma.session.deleteMany({
      where: { userId },
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error deleting user sessions:", error);
    }
  }
}

