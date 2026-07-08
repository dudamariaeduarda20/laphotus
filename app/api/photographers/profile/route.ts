import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // TODO: Get authenticated user from session/token
    // For now, return mock data
    return NextResponse.json({
      isComplete: false,
      data: {
        country: "Portugal",
        postalCode: "",
        address: "",
        addressNumber: "",
        complement: "",
        city: "",
        state: "",
        taxPayerId: "",
        vat: "",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    // TODO: Save to database
    // - Validate data
    // - Update photographer profile
    // - Mark as complete if all required fields filled

    console.log("Saving photographer profile:", body);

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
