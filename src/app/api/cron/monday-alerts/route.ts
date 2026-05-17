import { NextResponse } from "next/server";
import { mockDb } from "@/lib/db/mockDb";

export async function GET(request: Request) {
  // 1. Security Check: Protect cron endpoint using Vercel CRON_SECRET token
  const authHeader = request.headers.get("Authorization");
  const isLocalDev = process.env.NODE_ENV === "development";
  const cronSecret = process.env.CRON_SECRET;
  
  if (!isLocalDev && cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("⏰ Starting Monday Morning Timesheet Compliance check...");

  try {
    const activeUsers = mockDb.getUsers().filter((u) => u.role === "staff" && u.isActive);
    const submissions = mockDb.getWeekSubmissions();

    // 2. Calculate preceding Monday (Week Commencing)
    const today = new Date();
    const day = today.getDay();
    // Monday of last week
    const diff = today.getDate() - day - 6; 
    const prevMonday = new Date(today.setDate(diff));
    const prevMondayStr = prevMonday.toISOString().split("T")[0];

    const remindersSent = [];

    // 3. Scan for incomplete timesheets
    for (const staff of activeUsers) {
      const userSub = submissions.find(
        (s) => s.userId === staff.id && s.weekCommencing === prevMondayStr
      );

      const isComplete = userSub?.status === "submitted" || userSub?.status === "approved";

      if (!isComplete) {
        // Trigger Email Reminder via Resend (Simulated in local logs)
        const emailBody = {
          from: process.env.RESEND_FROM_EMAIL || "alerts@fieldtime.com",
          to: staff.email,
          subject: `FieldTime Reminder: Timesheet for ${prevMondayStr} is due today!`,
          text: `Hi ${staff.name},\n\nThis is a friendly reminder that your timesheet for the week commencing ${prevMondayStr} has not been submitted yet.\n\nPlease log in to FieldTime on your mobile or desktop and submit your entries before the 09:00 AM deadline today.\n\nThank you,\nFieldTime Management`,
        };

        console.log(`✉️ Sending reminder to ${staff.name} (${staff.email}):`, emailBody.text);
        remindersSent.push(staff.email);
      }
    }

    return NextResponse.json({
      success: true,
      weekCommencingToCheck: prevMondayStr,
      remindersSentCount: remindersSent.length,
      recipients: remindersSent,
    });
  } catch (err) {
    console.error("Cron compliance run failed:", err);
    return NextResponse.json(
      { error: "Timesheet compliance run failed" },
      { status: 500 }
    );
  }
}
