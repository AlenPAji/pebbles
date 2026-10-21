import { NextResponse } from "next/server";

import { requireUser } from "../../../server/auth/require-user";
import { getAuthenticatedExample } from "../../../server/services/example";

export async function GET() {
  try {
    const userId = await requireUser();
    return NextResponse.json(getAuthenticatedExample(userId));
  } catch (error) {
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    throw error;
  }
}
