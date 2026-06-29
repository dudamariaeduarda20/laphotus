import { NextRequest, NextResponse } from "next/server";
import { loginUser } from "@/lib/services/authService";
import { signToken } from "@/lib/utils/auth";
import { rateLimits } from "@/lib/middleware/rateLimit";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: NextRequest) {
  const limited = rateLimits.login(request);
  if (limited) return limited;

  try {
    const body = await request.json();

    // Validate
    const validated = loginSchema.parse(body);

    // Login
    const user = await loginUser(validated.email, validated.password);

    // Create response with user data
    const response = NextResponse.json(
      {
        user,
        message: "Login successful",
      },
      { status: 200 }
    );

    // Set session cookie
    response.cookies.set({
      name: "auth-token",
      value: signToken(user),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Login failed";

    return NextResponse.json(
      { error: message },
      { status: 401 }
    );
  }
}
