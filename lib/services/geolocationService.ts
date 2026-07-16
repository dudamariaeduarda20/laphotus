import { NextRequest } from "next/server";

/**
 * Detect country from request IP/headers
 * Returns country code (e.g., "BR", "PT", "US")
 */
export function detectCountry(request: NextRequest): string {
  // Check CloudFlare header first (most reliable)
  const cfCountry = request.headers.get("cf-country");
  if (cfCountry) return cfCountry.toUpperCase();

  // Check Vercel geolocation header
  const vercelCountry = request.headers.get("x-vercel-ip-country");
  if (vercelCountry) return vercelCountry.toUpperCase();

  // Default to US if not detected
  return "US";
}

/**
 * Check if user is in Brazil
 */
export function isBrazil(request: NextRequest): boolean {
  return detectCountry(request) === "BR";
}

/**
 * Check if user is in Portugal
 */
export function isPortugal(request: NextRequest): boolean {
  return detectCountry(request) === "PT";
}
