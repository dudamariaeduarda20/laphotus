import { NextRequest, NextResponse } from "next/server";
import { registerUser } from "@/lib/services/authService";
import { signToken } from "@/lib/utils/auth";
import { UserRole } from "@/lib/types";
import { rateLimits } from "@/lib/middleware/rateLimit";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  // ADMIN nunca é aceite no registo público — só CLIENT/PHOTOGRAPHER/ORGANIZER
  // fazem sentido como autoatendimento. Contas admin exigem rota protegida à parte.
  role: z.enum([
    UserRole.CLIENT,
    UserRole.PHOTOGRAPHER,
    UserRole.ORGANIZER,
  ]).optional(),
});

export async function POST(request: NextRequest) {
  const limited = rateLimits.register(request);
  if (limited) return limited;

  try {
    const body = await request.json();

    // Validate
    const validated = registerSchema.parse(body);

    // Register
    const user = await registerUser(
      validated.email,
      validated.password,
      validated.name,
      (validated.role as UserRole) || UserRole.CLIENT
    );

    // Create session token (mock - Phase 2: use Supabase JWT)
    const response = NextResponse.json(
      {
        user,
        message: "Registration successful",
      },
      { status: 201 }
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

    const message = error instanceof Error ? error.message : "Registration failed";

    return NextResponse.json(
      { error: message },
      { status: error instanceof Error && message.includes("already") ? 409 : 500 }
    );
  }
}
