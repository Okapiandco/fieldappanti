import { pgTable, uuid, text, boolean, timestamp, date, numeric, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// 1. Users Table
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  clerkId: text("clerk_id").unique().notNull(),
  name: text("name").notNull(),
  email: text("email").unique().notNull(),
  role: text("role").default("staff").notNull(), // 'staff' | 'admin'
  department: text("department").default("field"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// 2. Customers Table
export const customers = pgTable("customers", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  accountCode: text("account_code").unique(),
  isActive: boolean("is_active").default(true),
});

// 3. Machines Table
export const machines = pgTable("machines", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").unique().notNull(),
  type: text("type"), // 'excavator' | 'tractor' etc.
  isActive: boolean("is_active").default(true),
});

// 4. Time Entries Table
export const timeEntries = pgTable("time_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  entryDate: date("entry_date").notNull(),
  customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
  machineId: uuid("machine_id").references(() => machines.id, { onDelete: "set null" }),
  customMachine: text("custom_machine"), // for in-field entries where machine isn't in master yet
  jobNumber: text("job_number"),
  jobType: text("job_type").notNull(), // 'field_service' | 'workshop' | 'sales_visit' | 'retail' | 'on_call'
  hours: numeric("hours", { precision: 4, scale: 2 }).notNull(),
  miles: numeric("miles", { precision: 6, scale: 1 }).default("0"),
  lunchMinutes: integer("lunch_minutes").default(0),
  isOnCall: boolean("is_on_call").default(false),
  notes: text("notes"),
  status: text("status").default("draft"), // 'draft' | 'submitted' | 'approved' | 'flagged'
  flagReason: text("flag_reason"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// 5. On Call Periods Table
export const onCallPeriods = pgTable("on_call_periods", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  weekCommencing: date("week_commencing").notNull(),
});

// 6. Week Submissions Table
export const weekSubmissions = pgTable("week_submissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  weekCommencing: date("week_commencing").notNull(),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  status: text("status").default("incomplete"), // 'incomplete' | 'submitted' | 'approved'
});

// Relationships configuration
export const usersRelations = relations(users, ({ many }) => ({
  timeEntries: many(timeEntries),
  onCallPeriods: many(onCallPeriods),
  weekSubmissions: many(weekSubmissions),
}));

export const timeEntriesRelations = relations(timeEntries, ({ one }) => ({
  user: one(users, {
    fields: [timeEntries.userId],
    references: [users.id],
  }),
  customer: one(customers, {
    fields: [timeEntries.customerId],
    references: [customers.id],
  }),
  machine: one(machines, {
    fields: [timeEntries.machineId],
    references: [machines.id],
  }),
}));

export const onCallPeriodsRelations = relations(onCallPeriods, ({ one }) => ({
  user: one(users, {
    fields: [onCallPeriods.userId],
    references: [users.id],
  }),
}));

export const weekSubmissionsRelations = relations(weekSubmissions, ({ one }) => ({
  user: one(users, {
    fields: [weekSubmissions.userId],
    references: [users.id],
  }),
}));

// 7. Daily On Call Table
export const dailyOnCall = pgTable("daily_on_call", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  entryDate: date("entry_date").notNull(),
  isOnCall: boolean("is_on_call").default(false).notNull(),
});

export const dailyOnCallRelations = relations(dailyOnCall, ({ one }) => ({
  user: one(users, {
    fields: [dailyOnCall.userId],
    references: [users.id],
  }),
}));
