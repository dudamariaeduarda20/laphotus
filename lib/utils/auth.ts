import { NextRequest } from "next/server";
import { cookies } from "next/headers";

const SECRET =
  process.env.AUTH_SECRET || "laphotus-dev-insecure-secret-change-in-production";

export interface TokenPayload {
  id: string;
  email: string;
  name: string;
  role: string;
  [key: string]: unknown;
}

// Simple token format: base64(payload).base64(payload+SECRET hash)
// Edge-safe: no Node crypto imports
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

export function signToken(payload: object): string {
  const base64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = simpleHash(base64 + SECRET);
  return `${base64}.${sig}`;
}

function verifyToken(token: string): TokenPayload | null {
  try {
    const lastDot = token.lastIndexOf(".");
    if (lastDot === -1) return null;

    const base64 = token.slice(0, lastDot);
    const sig = token.slice(lastDot + 1);

    const expected = simpleHash(base64 + SECRET);
    if (sig !== expected) return null;

    return JSON.parse(Buffer.from(base64, "base64url").toString("utf-8")) as TokenPayload;
  } catch {
    return null;
  }
}

// ──────────────────────────────────────────────────────────────────
// Request helpers
// ──────────────────────────────────────────────────────────────────

export function getUserFromRequest(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function getUserIdFromRequest(request: NextRequest): string | null {
  const token = request.cookies.get("auth-token")?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  return (payload?.id as string) || null;
}

// For Server Components (no NextRequest available) — reads via next/headers instead
export async function getUserIdFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  return (payload?.id as string) || null;
}

export async function requireAuth(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function requireRole(request: NextRequest, roles: string[]) {
  const user = await requireAuth(request);
  if (!roles.includes(user.role as string)) throw new Error("Forbidden");
  return user;
}
