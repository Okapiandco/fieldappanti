import { z } from "zod";

// Zod schema for validating raw Time Entry form inputs
export const timeEntryFormSchema = z.object({
  id: z.string().optional(),
  entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Date must be in YYYY-MM-DD format",
  }),
  customerId: z.string().nullable().optional(),
  machineId: z.string().nullable().optional(),
  customMachine: z.string().nullable().optional(),
  jobNumber: z.string().nullable().optional(),
  jobType: z.enum(["field_service", "workshop", "sales_visit", "retail", "on_call"]),
  hours: z.coerce.number().positive({ message: "Hours must be greater than 0" }).max(24, {
    message: "Hours cannot exceed 24 per day",
  }),
  miles: z.coerce.number().nonnegative({ message: "Mileage cannot be negative" }).default(0),
  isOnCall: z.boolean().default(false),
  notes: z.string().nullable().optional(),
});

export type TimeEntryFormData = z.infer<typeof timeEntryFormSchema>;

// Business validation rules runner
export interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  flags: string[];
}

export function runBusinessRules(
  entry: TimeEntryFormData,
  otherEntriesLoggedOnDay: { id?: string; hours: number }[] = [],
  dailyLunchMinutes = 60,
  dailyOnCallActive = false
): ValidationResult {
  const warnings: string[] = [];
  const flags: string[] = [];

  const hours = entry.hours || 0;
  const jobType = entry.jobType;
  const jobNo = entry.jobNumber || "";

  // Rule 1: Total hours logged on the same day > 16 (Flagged)
  const totalDayHours =
    otherEntriesLoggedOnDay
      .filter((e) => e.id !== entry.id)
      .reduce((sum, e) => sum + Number(e.hours), 0) + hours;
  if (totalDayHours > 16) {
    flags.push(`Possible error: 16+ hours logged on this date (${totalDayHours}h total)`);
  }

  // Rule 2: Job number required for Field Service and Workshop (Flagged)
  if ((jobType === "field_service" || jobType === "workshop") && !jobNo.trim()) {
    flags.push("Job number is required for field service and workshop duties");
  }

  // Rule 3: Working more than 12 hours with 0 minutes lunch (Warning)
  if (totalDayHours > 12 && dailyLunchMinutes === 0) {
    warnings.push("Long shift logged (> 12 hours) — did you forget to log your lunch break?");
  }

  // Rule 4: Weekend logging when not on-call (Warning)
  const dateObj = new Date(entry.entryDate);
  const day = dateObj.getDay(); // 0 = Sunday, 6 = Saturday
  const isWeekend = day === 0 || day === 6;
  if (isWeekend && !dailyOnCallActive && jobType !== "on_call") {
    warnings.push("Weekend entry logged — are you currently on-call?");
  }

  return {
    isValid: flags.length === 0,
    warnings,
    flags,
  };
}
