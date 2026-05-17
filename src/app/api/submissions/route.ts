import { NextResponse } from "next/server";
import { mockDb } from "@/lib/db/mockDb";
import { getCurrentUser } from "@/lib/auth-mock";

// GET: Check weekly submission records
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Admins can see all submission records, staff only their own
    const submissions = mockDb.getWeekSubmissions(user.role === "admin" ? undefined : user.id);
    return NextResponse.json(submissions);
  } catch (err) {
    console.error("GET submissions failed:", err);
    return NextResponse.json({ error: "Failed to fetch submission logs" }, { status: 500 });
  }
}

// POST: Submit a timesheet week or Approve a submission (admin only)
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { weekCommencing, approve, userId: targetUserId } = body;
    
    if (!weekCommencing) {
      return NextResponse.json({ error: "weekCommencing is required" }, { status: 400 });
    }

    if (approve) {
      // Admin Approval Action
      if (user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden: Only administrators can approve timesheets" }, { status: 403 });
      }
      if (!targetUserId) {
        return NextResponse.json({ error: "targetUserId is required for approval" }, { status: 400 });
      }
      
      const result = mockDb.approveWeek(targetUserId, weekCommencing);
      return NextResponse.json(result);
    } else {
      // Staff Submission Action
      const result = mockDb.submitWeek(user.id, weekCommencing);
      return NextResponse.json(result);
    }
  } catch (err) {
    console.error("POST submissions failed:", err);
    return NextResponse.json({ error: "Failed to execute submission action" }, { status: 500 });
  }
}
