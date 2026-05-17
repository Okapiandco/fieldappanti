import { NextResponse } from "next/server";
import { mockDb } from "@/lib/db/mockDb";
import { getCurrentUser } from "@/lib/auth-mock";

// GET: Fetch all daily on-call records logged by the authenticated user
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const onCalls = mockDb.getDailyOnCalls(user.id);
    return NextResponse.json(onCalls);
  } catch (err) {
    console.error("GET daily on-calls failed:", err);
    return NextResponse.json({ error: "Failed to fetch daily on-calls" }, { status: 500 });
  }
}

// POST: Save or update a daily on-call status
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { entryDate, isOnCall } = body;

    if (!entryDate || isOnCall === undefined) {
      return NextResponse.json({ error: "entryDate and isOnCall are required" }, { status: 400 });
    }

    const record = mockDb.setDailyOnCall(user.id, entryDate, Boolean(isOnCall));
    return NextResponse.json(record);
  } catch (err) {
    console.error("POST daily on-call failed:", err);
    return NextResponse.json({ error: "Failed to update daily on-call status" }, { status: 500 });
  }
}
