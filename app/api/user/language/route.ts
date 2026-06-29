import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/utils/auth";
import prisma from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { language: true },
  });
  return NextResponse.json({ language: dbUser?.language ?? "pt" });
}

export async function PATCH(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { language } = body;
  const supported = ["pt", "en", "es", "fr", "de"];
  if (!language || !supported.includes(language)) {
    return NextResponse.json({ error: "Invalid language" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { language },
  });
  return NextResponse.json({ language });
}
