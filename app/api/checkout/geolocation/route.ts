import { NextRequest, NextResponse } from "next/server";
import { detectCountry } from "@/lib/services/geolocationService";

export async function GET(request: NextRequest) {
  return NextResponse.json({ country: detectCountry(request) });
}
