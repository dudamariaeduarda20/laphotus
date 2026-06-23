import { NextRequest } from "next/server";
import { getUserWithProfile } from "@/lib/services/authService";

/**
 * Extract user from auth token cookie
 */
export async function getUserFromRequest(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value;

    if (!token) {
      return null;
    }

    // Decode mock token
    const decoded = JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Get user ID from request
 */
export function getUserIdFromRequest(request: NextRequest): string | null {
  try {
    const token = request.cookies.get("auth-token")?.value;
    if (!token) return null;

    const decoded = JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
    return decoded.id || null;
  } catch {
    return null;
  }
}

/**
 * Require authentication middleware
 */
export async function requireAuth(request: NextRequest) {
  const user = await getUserFromRequest(request);

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}

/**
 * Require specific role
 */
export async function requireRole(request: NextRequest, roles: string[]) {
  const user = await requireAuth(request);

  if (!roles.includes(user.role)) {
    throw new Error("Forbidden");
  }

  return user;
}
