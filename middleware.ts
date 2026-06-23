import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/utils/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes (no auth required)
  const publicRoutes = ["/", "/auth/login", "/auth/register", "/api/auth"];

  // Check if route is public
  const isPublic = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isPublic) {
    return NextResponse.next();
  }

  // Protected routes (require auth)
  const protectedRoutes = ["/dashboard", "/photos"];
  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  // Check if user is authenticated
  const user = await getUserFromRequest(request);

  if (!user) {
    // Redirect to login
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
