import { NextResponse } from "next/server";
import { mockDb } from "@/lib/db/mockDb";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";

  try {
    // Search the database with a limit of 15 matches
    const results = mockDb.searchCustomers(query, 15);
    return NextResponse.json(results);
  } catch (err) {
    console.error("Failed to search customers:", err);
    return NextResponse.json(
      { error: "Failed to perform customer lookup" },
      { status: 500 }
    );
  }
}
