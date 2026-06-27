import { NextRequest } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";

const SECRET =
  process.env.AUTH_SECRET || "laphotus-dev-insecure-secret-change-in-production";

export interface TokenPayload {
  id: string;
  email: string;
  name: string;
  role: string;
  [key: string]: unknown;
}

// ──────────────────────────────────────────────────────────────────
// Token signing (HMAC-SHA256, Node.js built-in crypto — no new deps)
// Format: base64url(JSON.stringify(payload)).hmacHex
// ──────────────────────────────────────────────────────────────────

export function signToken(payload: object): string {
  const base64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", SECRET).update(base64).digest("hex");
  return `${base64}.${sig}`;
}

function verifyToken(token: string): TokenPayload | null {
  try {
    const lastDot = token.lastIndexOf(".");
    if (lastDot === -1) return null; // unsigned legacy token — reject

    const base64 = token.slice(0, lastDot);
    const sig = token.slice(lastDot + 1);

    const expected = createHmac("sha256", SECRET).update(base64).digest("hex");

    const sigBuf = Buffer.from(sig, "hex");
    const expBuf = Buffer.from(expected, "hex");
    if (sigBuf.length !== expBuf.length) return null;
    if (!timingSafeEqual(sigBuf, expBuf)) return null;

    return JSON.parse(Buffer.from(base64, "base64url").toString("utf-8")) as TokenPayload;
  } catch {
    return null;
  }
}

// ──────────────────────────────────────────────────────────────────
// Request helpers
// ──────────────────────────────────────────────────────────────────

export async function getUserFromRequest(request: NextRequest) {
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
