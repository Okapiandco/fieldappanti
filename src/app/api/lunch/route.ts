import { NextResponse } from "next/server";
import { mockDb } from "@/lib/db/mockDb";
import { getCurrentUser } from "@/lib/auth-mock";

// GET: Fetch all daily lunch deductions logged by the authenticated user
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const lunches = mockDb.getDailyLunches(user.id);
    return NextResponse.json(lunches);
  } catch (err) {
    console.error("GET daily lunches failed:", err);
    return NextResponse.json({ error: "Failed to fetch daily lunches" }, { status: 500 });
  }
}

// POST: Save or update a daily lunch break deduction
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { entryDate, lunchMinutes } = body;

    if (!entryDate || lunchMinutes === undefined) {
      return NextResponse.json({ error: "entryDate and lunchMinutes are required" }, { status: 400 });
    }

    const minutes = Number(lunchMinutes);
    if (![0, 30, 60].includes(minutes)) {
      return NextResponse.json({ error: "lunchMinutes must be 0, 30, or 60" }, { status: 400 });
    }

    const record = mockDb.setDailyLunch(user.id, entryDate, minutes);
    return NextResponse.json(record);
  } catch (err) {
    console.error("POST daily lunch failed:", err);
    return NextResponse.json({ error: "Failed to update daily lunch deduction" }, { status: 500 });
  }
}
