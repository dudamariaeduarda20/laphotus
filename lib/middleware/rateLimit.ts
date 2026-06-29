import { NextRequest, NextResponse } from "next/server";

// In-memory sliding window counter.
// On Vercel serverless each instance has its own counter — effective for brute-force
// protection within a warm instance. Add Upstash Redis for cross-instance limits in prod.
const store = new Map<string, { count: number; resetAt: number }>();
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < 60_000) return;
  lastCleanup = now;
  for (const [k, v] of store) {
    if (v.resetAt <= now) store.delete(k);
  }
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetIn: number; // seconds
}

function check(key: string, limit: number, windowSec: number): RateLimitResult {
  cleanup();
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowSec * 1000 });
    return { success: true, remaining: limit - 1, resetIn: windowSec };
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0, resetIn: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count++;
  return { success: true, remaining: limit - entry.count, resetIn: Math.ceil((entry.resetAt - now) / 1000) };
}

function getIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

function getLocale(request: NextRequest): string {
  const cookie = request.cookies.get("NEXT_LOCALE")?.value;
  if (cookie) return cookie;
  const accept = request.headers.get("accept-language") ?? "";
  const lang = accept.split(",")[0]?.split("-")[0]?.toLowerCase() ?? "pt";
  return ["pt", "en", "es", "fr", "de"].includes(lang) ? lang : "pt";
}

const MESSAGES: Record<string, (n: number) => string> = {
  pt: (n) => `Muitas tentativas. Tente novamente em ${n} segundo${n !== 1 ? "s" : ""}.`,
  en: (n) => `Too many requests. Try again in ${n} second${n !== 1 ? "s" : ""}.`,
  es: (n) => `Demasiadas solicitudes. Inténtelo de nuevo en ${n} segundo${n !== 1 ? "s" : ""}.`,
  fr: (n) => `Trop de requêtes. Réessayez dans ${n} seconde${n !== 1 ? "s" : ""}.`,
  de: (n) => `Zu viele Anfragen. Versuchen Sie es in ${n} Sekunde${n !== 1 ? "n" : ""} erneut.`,
};

export function applyRateLimit(
  request: NextRequest,
  route: string,
  limit: number,
  windowSec: number
): NextResponse | null {
  const ip = getIp(request);
  const key = `rl:${route}:${ip}`;
  const result = check(key, limit, windowSec);

  if (result.success) return null;

  const locale = getLocale(request);
  const msgFn = MESSAGES[locale] ?? MESSAGES.en;
  const message = msgFn(result.resetIn);

  return NextResponse.json(
    { error: message, retryAfter: result.resetIn },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.resetIn),
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(Math.ceil((Date.now() + result.resetIn * 1000) / 1000)),
      },
    }
  );
}

// Pre-configured limiters for each route
export const rateLimits = {
  /** 5 req / 60 s — brute force on passwords */
  login: (r: NextRequest) => applyRateLimit(r, "auth:login", 5, 60),
  /** 3 req / 60 s — spam account creation */
  register: (r: NextRequest) => applyRateLimit(r, "auth:register", 3, 60),
  /** 30 req / 60 s — face recognition is expensive */
  searchFace: (r: NextRequest) => applyRateLimit(r, "photos:search-face", 30, 60),
  /** 10 req / 60 s — coupon brute force */
  couponValidate: (r: NextRequest) => applyRateLimit(r, "coupons:validate", 10, 60),
  /** 10 req / 60 s — checkout spam */
  checkoutSession: (r: NextRequest) => applyRateLimit(r, "checkout:session", 10, 60),
} as const;
