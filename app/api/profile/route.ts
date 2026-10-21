import { NextResponse } from "next/server";

import { ensureUserProfile } from "../../../server/services/user.service";

export async function GET() {
  try {
    const profile = await ensureUserProfile();
    return NextResponse.json({
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    throw error;
  }
}
