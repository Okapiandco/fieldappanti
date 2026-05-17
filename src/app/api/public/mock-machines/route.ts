import { NextResponse } from "next/server";
import { mockDb } from "@/lib/db/mockDb";

export async function GET() {
  try {
    const machines = mockDb.getMachines();
    return NextResponse.json(machines);
  } catch (err) {
    console.error("Failed to fetch mock machines list:", err);
    return NextResponse.json({ error: "Failed to fetch machines" }, { status: 500 });
  }
}
