import { NextResponse } from "next/server";
import { mockDb } from "@/lib/db/mockDb";

export async function GET() {
  try {
    const users = mockDb.getUsers();
    return NextResponse.json(users);
  } catch (err) {
    console.error("Failed to fetch mock users list:", err);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
