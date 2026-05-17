import { NextResponse } from "next/server";
import { mockDb } from "@/lib/db/mockDb";
import { timeEntryFormSchema } from "@/lib/validation";
import { getCurrentUser } from "@/lib/auth-mock";

// Helper: Get authenticated user in the database
async function getOrCreateDbUser() {
  return await getCurrentUser();
}

// GET: Fetch all time entries for the authenticated user
export async function GET() {
  try {
    const user = await getOrCreateDbUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const entries = mockDb.getTimeEntries(user.role === "admin" ? undefined : user.id);
    return NextResponse.json(entries);
  } catch (err) {
    console.error("GET entries failed:", err);
    return NextResponse.json({ error: "Failed to fetch entries" }, { status: 500 });
  }
}

// POST: Log a new time entry
export async function POST(request: Request) {
  try {
    const user = await getOrCreateDbUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    
    // Zod parsing
    const parsed = timeEntryFormSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }

    const validated = parsed.data;
    const entry = mockDb.addTimeEntry({
      userId: user.id,
      entryDate: validated.entryDate,
      customerId: validated.customerId || null,
      machineId: validated.machineId || null,
      customMachine: validated.customMachine || null,
      jobNumber: validated.jobNumber || null,
      jobType: validated.jobType,
      hours: validated.hours,
      miles: validated.miles,
      lunchMinutes: 0,
      isOnCall: validated.isOnCall,
      notes: validated.notes || null,
    });

    return NextResponse.json(entry);
  } catch (err) {
    console.error("POST entry failed:", err);
    return NextResponse.json({ error: "Failed to save time entry" }, { status: 500 });
  }
}

// PUT: Update an existing time entry
export async function PUT(request: Request) {
  try {
    const user = await getOrCreateDbUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Time entry ID is required" }, { status: 400 });
    }

    const existing = mockDb.getTimeEntryById(id);
    if (!existing) {
      return NextResponse.json({ error: "Time entry not found" }, { status: 444 });
    }

    // Security check: only allow own edits unless admin
    if (existing.userId !== user.id && user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Cannot edit another staff member's timesheet" }, { status: 403 });
    }

    // Safety check: locked if submitted/approved and user is staff
    if ((existing.status === "submitted" || existing.status === "approved") && user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Timesheet is locked because the week is already submitted" }, { status: 403 });
    }

    const body = await request.json();
    
    // Zod parsing
    const parsed = timeEntryFormSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }

    const validated = parsed.data;
    const updated = mockDb.updateTimeEntry(id, {
      entryDate: validated.entryDate,
      customerId: validated.customerId || null,
      machineId: validated.machineId || null,
      customMachine: validated.customMachine || null,
      jobNumber: validated.jobNumber || null,
      jobType: validated.jobType,
      hours: validated.hours,
      miles: validated.miles,
      lunchMinutes: 0,
      isOnCall: validated.isOnCall,
      notes: validated.notes || null,
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("PUT entry failed:", err);
    return NextResponse.json({ error: "Failed to update time entry" }, { status: 500 });
  }
}

// DELETE: Remove a time entry
export async function DELETE(request: Request) {
  try {
    const user = await getOrCreateDbUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Time entry ID is required" }, { status: 400 });
    }

    const existing = mockDb.getTimeEntryById(id);
    if (!existing) {
      return NextResponse.json({ error: "Time entry not found" }, { status: 444 });
    }

    // Security check: only own entries unless admin
    if (existing.userId !== user.id && user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Cannot delete another staff member's timesheet" }, { status: 403 });
    }

    // Safety check: locked if submitted/approved and user is staff
    if ((existing.status === "submitted" || existing.status === "approved") && user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Cannot delete from a submitted week" }, { status: 403 });
    }

    mockDb.deleteTimeEntry(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE entry failed:", err);
    return NextResponse.json({ error: "Failed to delete time entry" }, { status: 500 });
  }
}
