import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/utils/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes — no auth required
  const publicRoutes = [
    "/",
    "/auth/login",
    "/auth/register",
    "/api/auth",
    "/api/photos",
    "/api/events",
    "/photos",
  ];

  const isPublic = publicRoutes.some((route) =>
    route === "/" ? pathname === "/" : pathname.startsWith(route)
  );
  if (isPublic) {
    return NextResponse.next();
  }

  // Protected UI routes — require auth, redirect to login if missing
  const protectedPrefixes = [
    "/dashboard",
    "/analytics",
    "/events",
    "/upload",
    "/earnings",
    "/downloads",
    "/cart",
    "/carrinho", // Portuguese cart route
    "/checkout",
    "/success",
    "/my-photos",
    "/photographer",
    "/profile",
    "/settings",
    "/admin",
    "/organizer",
    "/messages", // Chat messages
  ];

  const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p));
  if (!isProtected) {
    return NextResponse.next();
  }

  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
