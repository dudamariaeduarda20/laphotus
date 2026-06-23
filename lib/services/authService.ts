import bcryptjs from "bcryptjs";
import prisma from "@/lib/db/prisma";
import { UserRole } from "@/lib/types";

/**
 * Hash password with bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcryptjs.genSalt(10);
  return bcryptjs.hash(password, salt);
}

/**
 * Verify password against hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcryptjs.compare(password, hash);
}

/**
 * Register new user with role assignment
 */
export async function registerUser(
  email: string,
  password: string,
  name: string,
  role: UserRole = UserRole.CLIENT
) {
  // Check if user exists
  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    throw new Error("Email already registered");
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      role,
      emailVerified: new Date(), // Mock verification for MVP
    },
  });

  // If photographer, create photographer profile
  if (role === UserRole.PHOTOGRAPHER) {
    await prisma.photographer.create({
      data: {
        userId: user.id,
        bio: "",
        rating: 0,
        totalSales: 0,
        totalRevenue: 0,
      },
    });
  }

  // If organizer, create organizer profile
  if (role === UserRole.ORGANIZER) {
    await prisma.organizer.create({
      data: {
        userId: user.id,
        organizationName: name,
        commissionRate: 0.2,
      },
    });
  }

  return sanitizeUser(user);
}

/**
 * Login user by email/password
 */
export async function loginUser(email: string, password: string) {
  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  // Verify password
  const isValid = await verifyPassword(password, user.passwordHash || "");

  if (!isValid) {
    throw new Error("Invalid email or password");
  }

  // Log auth attempt
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "login",
      resource: "user",
      resourceId: user.id,
      ipAddress: "mock-ip", // Get from request in API route
    },
  });

  return sanitizeUser(user);
}

/**
 * Get user with role-specific profile
 */
export async function getUserWithProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      photographer: true,
      organizer: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return {
    ...sanitizeUser(user),
    photographer: user.photographer,
    organizer: user.organizer,
  };
}

/**
 * Remove sensitive fields from user object
 */
function sanitizeUser(user: any) {
  const { passwordHash, ...safe } = user;
  return safe;
}

/**
 * Verify user has required role
 */
export function hasRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole);
}
