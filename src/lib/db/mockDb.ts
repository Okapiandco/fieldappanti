import fs from "fs";
import path from "path";

// Define TypeScript interfaces for our database records
export interface User {
  id: string;
  clerkId: string;
  name: string;
  email: string;
  role: "staff" | "admin";
  department: string;
  isActive: boolean;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  accountCode: string;
  isActive: boolean;
}

export interface Machine {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
}

export interface TimeEntry {
  id: string;
  userId: string;
  entryDate: string; // YYYY-MM-DD
  customerId: string | null;
  machineId: string | null;
  customMachine: string | null;
  jobNumber: string | null;
  jobType: "field_service" | "workshop" | "sales_visit" | "retail" | "on_call";
  hours: number;
  miles: number;
  lunchMinutes: number;
  isOnCall: boolean;
  notes: string | null;
  status: "draft" | "submitted" | "approved" | "flagged";
  flagReason: string | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OnCallPeriod {
  id: string;
  userId: string;
  startedAt: string; // ISO String
  endedAt: string | null; // ISO String or null
  weekCommencing: string; // YYYY-MM-DD
}

export interface WeekSubmission {
  id: string;
  userId: string;
  weekCommencing: string; // YYYY-MM-DD
  submittedAt: string | null;
  status: "incomplete" | "submitted" | "approved";
}

export interface DailyLunch {
  id: string;
  userId: string;
  entryDate: string; // YYYY-MM-DD
  lunchMinutes: number; // 0, 30, 60
}

export interface DailyOnCall {
  id: string;
  userId: string;
  entryDate: string; // YYYY-MM-DD
  isOnCall: boolean;
}

interface DatabaseSchema {
  users: User[];
  customers: Customer[];
  machines: Machine[];
  timeEntries: TimeEntry[];
  onCallPeriods: OnCallPeriod[];
  weekSubmissions: WeekSubmission[];
  dailyLunches: DailyLunch[];
  dailyOnCalls: DailyOnCall[];
}

const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "db.json");

// Default initial state
const defaultDb: DatabaseSchema = {
  users: [],
  customers: [],
  machines: [],
  timeEntries: [],
  onCallPeriods: [],
  weekSubmissions: [],
  dailyLunches: [],
  dailyOnCalls: [],
};

// Helper: Ensure the data directory and file exist, then read it
function readDb(): DatabaseSchema {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultDb, null, 2), "utf-8");
    return defaultDb;
  }
  
  try {
    const content = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(content);
  } catch (err) {
    console.error("Error reading database file, resetting to default:", err);
    return defaultDb;
  }
}

// Helper: Write the database to disk
function writeDb(data: DatabaseSchema) {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export const mockDb = {
  // --- SEED / RESET METHODS ---
  seed: (force = false) => {
    const dbData = readDb();
    
    // Seed only if empty or forced
    if (dbData.users.length > 0 && !force) {
      console.log("Database already seeded. Skipping.");
      return;
    }

    console.log("🌱 Mock DB: Seeding standard records...");

    // 1. Seed Users
    const seededUsers: User[] = [
      {
        id: "usr-admin-1",
        clerkId: "user_mock_admin1",
        name: "Becky Phillips",
        email: "admin@fieldtime.com",
        role: "admin",
        department: "management",
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: "usr-staff-1",
        clerkId: "user_mock_staff1",
        name: "John Miller",
        email: "john@fieldtime.com",
        role: "staff",
        department: "field",
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: "usr-staff-2",
        clerkId: "user_mock_staff2",
        name: "Sarah Cooper",
        email: "sarah@fieldtime.com",
        role: "staff",
        department: "sales",
        isActive: true,
        createdAt: new Date().toISOString(),
      },
    ];

    // 2. Seed Machines
    const seededMachines: Machine[] = [
      { id: "mac-1", name: "John Deere 6155R Tractor", type: "tractor", isActive: true },
      { id: "mac-2", name: "New Holland T7 Tractor", type: "tractor", isActive: true },
      { id: "mac-3", name: "Excavator Cat 320", type: "excavator", isActive: true },
      { id: "mac-4", name: "Kubota KX080 Mini Excavator", type: "excavator", isActive: true },
      { id: "mac-5", name: "JCB 3CX Backhoe Loader", type: "backhoe", isActive: true },
      { id: "mac-6", name: "Claas Lexion Combine Harvester", type: "harvester", isActive: true },
      { id: "mac-7", name: "Massey Ferguson 5710 Tractor", type: "tractor", isActive: true },
      { id: "mac-8", name: "Bobcat S530 Skid Steer", type: "loader", isActive: true },
    ];

    // 3. Seed 4,000 Customers
    console.log("Mock DB: Generating 4,000 mock customers...");
    const prefixes = [
      "Green", "Blue", "Red", "White", "Black", "Golden", "Silver", "Oak", "Pine", "Cedar",
      "Maple", "River", "Valley", "Hill", "Ridge", "Meadow", "Highland", "Lowland", "Summit", "Stone",
      "Clay", "Windy", "Sunny", "Stormy", "Spring", "Summer", "Autumn", "Winter", "Broadview", "Riverside"
    ];
    const roots = [
      "Creek", "Farms", "Fields", "Acres", "Grove", "Ridge", "Pastures", "Valley", "Wood", "Orchards",
      "Hollow", "Brook", "Landing", "Harvest", "Agri", "Soil", "Landscaping", "Contracting", "Equine", "Livestock",
      "Grain", "Dairy", "Produce", "Horticulture", "Till", "Plow", "Bale", "Meadows", "Moor", "Forest"
    ];
    const suffixes = [
      "Ltd", "Inc", "Co", "& Sons", "Partners", "Group", "Holdings", "Association", "Services", "Farming"
    ];

    const seededCustomers: Customer[] = [];
    const uniqueNames = new Set<string>();

    let idx = 1000;
    while (uniqueNames.size < 4000) {
      const pref = prefixes[Math.floor(Math.random() * prefixes.length)];
      const root = roots[Math.floor(Math.random() * roots.length)];
      const suff = suffixes[Math.floor(Math.random() * suffixes.length)];
      
      let name = `${pref} ${root} ${suff}`;
      if (uniqueNames.has(name)) {
        name = `${pref} ${root} ${suff} #${uniqueNames.size + 1}`;
      }
      
      uniqueNames.add(name);
      seededCustomers.push({
        id: `cust-${idx}`,
        name,
        accountCode: `CUST-${idx}`,
        isActive: true,
      });
      idx++;
    }

    // 4. Seed some initial time entries to make reporting look immediately awesome
    console.log("Mock DB: Generating initial sample time entries...");
    const seededTimeEntries: TimeEntry[] = [];
    
    // Generate dates for current week
    const getDatesOfCurrentWeek = () => {
      const dates = [];
      const today = new Date();
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
      const monday = new Date(today.setDate(diff));
      
      for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        dates.push(d.toISOString().split("T")[0]);
      }
      return dates;
    };
    
    const weekDates = getDatesOfCurrentWeek();

    // John logs some standard entries
    seededTimeEntries.push(
      {
        id: "ent-1",
        userId: "usr-staff-1", // John
        entryDate: weekDates[0], // Monday
        customerId: "cust-1000",
        machineId: "mac-1",
        customMachine: null,
        jobNumber: "JB-2026-001",
        jobType: "field_service",
        hours: 8.5,
        miles: 25,
        lunchMinutes: 30,
        isOnCall: false,
        notes: "Mowed northern alfalfa fields.",
        status: "draft",
        flagReason: null,
        submittedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "ent-2",
        userId: "usr-staff-1",
        entryDate: weekDates[1], // Tuesday
        customerId: "cust-1001",
        machineId: "mac-3",
        customMachine: null,
        jobNumber: "JB-2026-002",
        jobType: "workshop",
        hours: 9.0,
        miles: 5,
        lunchMinutes: 30,
        isOnCall: false,
        notes: "Hydraulic hose repair on Cat Excavator.",
        status: "draft",
        flagReason: null,
        submittedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "ent-3",
        userId: "usr-staff-1",
        entryDate: weekDates[2], // Wednesday
        customerId: "cust-1002",
        machineId: "mac-1",
        customMachine: null,
        jobNumber: "", // Missing Job Number! (Should trigger Amber Warning)
        jobType: "field_service",
        hours: 10.0,
        miles: 45,
        lunchMinutes: 0, // Long day + no lunch (Should trigger Amber warning)
        isOnCall: false,
        notes: "Seeding oats. Forgot job number sheet.",
        status: "draft",
        flagReason: "Job number required for this job type; Long day — did you forget to log lunch?",
        submittedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "ent-4",
        userId: "usr-staff-1",
        entryDate: weekDates[3], // Thursday
        customerId: null,
        machineId: null,
        customMachine: null,
        jobNumber: null,
        jobType: "retail",
        hours: 17.5, // Extreme hours! (Should trigger Flagged Amber Warning)
        miles: 0,
        lunchMinutes: 60,
        isOnCall: false,
        notes: "Helping out at the till and showroom inventory.",
        status: "draft",
        flagReason: "Possible error: 16+ hours logged on this date",
        submittedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    );

    // Save everything to mock db
    writeDb({
      users: seededUsers,
      customers: seededCustomers,
      machines: seededMachines,
      timeEntries: seededTimeEntries,
      onCallPeriods: [],
      weekSubmissions: [],
      dailyLunches: [],
      dailyOnCalls: [],
    });

    console.log("🎉 Mock DB seeded successfully!");
  },

  // --- USERS ---
  getUsers: () => {
    return readDb().users;
  },
  getUserByClerkId: (clerkId: string) => {
    return readDb().users.find((u) => u.clerkId === clerkId) || null;
  },
  getUserById: (id: string) => {
    return readDb().users.find((u) => u.id === id) || null;
  },
  createUser: (user: Omit<User, "id" | "isActive" | "createdAt">) => {
    const dbData = readDb();
    const newUser: User = {
      ...user,
      id: `usr-${Math.random().toString(36).substr(2, 9)}`,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    dbData.users.push(newUser);
    writeDb(dbData);
    return newUser;
  },

  // --- CUSTOMERS ---
  getCustomers: () => {
    return readDb().customers;
  },
  searchCustomers: (query: string, limit = 10) => {
    const customers = readDb().customers;
    if (!query || query.length < 2) return customers.slice(0, limit);
    
    const normalizedQuery = query.toLowerCase();
    
    // Fuzzy Trigram simulation: score matches based on contiguous substrings
    const scored = customers
      .map((c) => {
        let score = 0;
        const name = c.name.toLowerCase();
        const code = c.accountCode.toLowerCase();
        
        if (name === normalizedQuery) score += 100;
        else if (name.startsWith(normalizedQuery)) score += 50;
        else if (name.includes(normalizedQuery)) score += 20;
        else {
          // Simple fuzzy overlap
          let matches = 0;
          for (let i = 0; i < normalizedQuery.length - 2; i++) {
            const trigram = normalizedQuery.substr(i, 3);
            if (name.includes(trigram)) matches++;
          }
          score += matches * 2;
        }

        if (code.includes(normalizedQuery)) score += 30;
        
        return { customer: c, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);

    return scored.slice(0, limit).map((item) => item.customer);
  },

  // --- MACHINES ---
  getMachines: () => {
    return readDb().machines.filter((m) => m.isActive);
  },
  addMachine: (name: string, type: string) => {
    const dbData = readDb();
    const newMachine: Machine = {
      id: `mac-${Math.random().toString(36).substr(2, 9)}`,
      name,
      type,
      isActive: true,
    };
    dbData.machines.push(newMachine);
    writeDb(dbData);
    return newMachine;
  },

  // --- TIME ENTRIES ---
  getTimeEntries: (userId?: string) => {
    const entries = readDb().timeEntries;
    if (userId) {
      return entries.filter((e) => e.userId === userId);
    }
    return entries;
  },
  getTimeEntryById: (id: string) => {
    return readDb().timeEntries.find((e) => e.id === id) || null;
  },

  // --- DAILY LUNCHES ---
  getDailyLunches: (userId: string) => {
    const lunches = readDb().dailyLunches;
    return lunches ? lunches.filter((l) => l.userId === userId) : [];
  },
  getDailyLunchByDate: (userId: string, date: string): number => {
    const dbData = readDb();
    if (!dbData.dailyLunches) return 60; // default to 60 mins (1 hour)
    const record = dbData.dailyLunches.find((l) => l.userId === userId && l.entryDate === date);
    return record ? record.lunchMinutes : 60; // default 60
  },
  setDailyLunch: (userId: string, date: string, minutes: number) => {
    const dbData = readDb();
    if (!dbData.dailyLunches) {
      dbData.dailyLunches = [];
    }

    const idx = dbData.dailyLunches.findIndex((l) => l.userId === userId && l.entryDate === date);
    if (idx !== -1) {
      dbData.dailyLunches[idx].lunchMinutes = minutes;
    } else {
      dbData.dailyLunches.push({
        id: `lunch-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        entryDate: date,
        lunchMinutes: minutes,
      });
    }
    writeDb(dbData);

    // Recalculate validation flags for any time entries logged on this day
    const entriesToUpdate = dbData.timeEntries.filter(
      (e) => e.userId === userId && e.entryDate === date
    );
    for (const entry of entriesToUpdate) {
      const dayEntries = dbData.timeEntries.filter(
        (e) => e.userId === userId && e.entryDate === date
      );
      const flagReason = mockDb.validateEntry(entry, dayEntries);
      entry.flagReason = flagReason;
      if (entry.status !== "submitted" && entry.status !== "approved") {
        entry.status = flagReason ? "flagged" : "draft";
      }
    }
    writeDb(dbData);

    return { userId, entryDate: date, lunchMinutes: minutes };
  },

  // --- DAILY ON-CALLS ---
  getDailyOnCalls: (userId: string) => {
    const dbData = readDb();
    const onCalls = dbData.dailyOnCalls;
    return onCalls ? onCalls.filter((o) => o.userId === userId) : [];
  },
  getDailyOnCallByDate: (userId: string, date: string): boolean => {
    const dbData = readDb();
    if (!dbData.dailyOnCalls) return false;
    const record = dbData.dailyOnCalls.find((o) => o.userId === userId && o.entryDate === date);
    return record ? record.isOnCall : false;
  },
  setDailyOnCall: (userId: string, date: string, isOnCall: boolean) => {
    const dbData = readDb();
    if (!dbData.dailyOnCalls) {
      dbData.dailyOnCalls = [];
    }

    const idx = dbData.dailyOnCalls.findIndex((o) => o.userId === userId && o.entryDate === date);
    if (idx !== -1) {
      dbData.dailyOnCalls[idx].isOnCall = isOnCall;
    } else {
      dbData.dailyOnCalls.push({
        id: `oncall-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        entryDate: date,
        isOnCall,
      });
    }
    writeDb(dbData);

    // Recalculate validation flags for any time entries logged on this day
    const entriesToUpdate = dbData.timeEntries.filter(
      (e) => e.userId === userId && e.entryDate === date
    );
    for (const entry of entriesToUpdate) {
      const dayEntries = dbData.timeEntries.filter(
        (e) => e.userId === userId && e.entryDate === date
      );
      const flagReason = mockDb.validateEntry(entry, dayEntries);
      entry.flagReason = flagReason;
      if (entry.status !== "submitted" && entry.status !== "approved") {
        entry.status = flagReason ? "flagged" : "draft";
      }
    }
    writeDb(dbData);

    return { userId, entryDate: date, isOnCall };
  },
  
  // Validation Engine Rule Processor
  validateEntry: (entry: Partial<TimeEntry>, allUserEntriesOfDay: TimeEntry[]): string | null => {
    const flags = [];
    const hours = Number(entry.hours || 0);
    const jobType = entry.jobType;
    const jobNo = entry.jobNumber || "";
    
    // Rule 1: Hours > 16 on same date
    const totalDayHours = allUserEntriesOfDay
      .filter((e) => e.id !== entry.id)
      .reduce((sum, e) => sum + Number(e.hours), 0) + hours;
    if (totalDayHours > 16) {
      flags.push(`Possible error: 16+ hours logged on this date (${totalDayHours}h)`);
    }

    // Rule 2: Job number required for Field Service and Workshop
    if ((jobType === "field_service" || jobType === "workshop") && !jobNo.trim()) {
      flags.push("Job number required for this job type");
    }

    // Rule 3: Long day (> 12 hours) and no lunch minutes
    if (entry.userId && entry.entryDate) {
      const dailyLunch = mockDb.getDailyLunchByDate(entry.userId, entry.entryDate);
      if (totalDayHours > 12 && dailyLunch === 0) {
        flags.push("Long day — did you forget to log lunch?");
      }
    }

    // Rule 4: Weekend entry and not on-call
    if (entry.entryDate && entry.userId) {
      const day = new Date(entry.entryDate).getDay(); // 0 = Sunday, 6 = Saturday
      const isWeekend = day === 0 || day === 6;
      const dailyOnCall = mockDb.getDailyOnCallByDate(entry.userId, entry.entryDate);
      if (isWeekend && !dailyOnCall && jobType !== "on_call") {
        flags.push("Weekend entry — are you on call?");
      }
    }

    return flags.length > 0 ? flags.join("; ") : null;
  },

  addTimeEntry: (entry: Omit<TimeEntry, "id" | "status" | "flagReason" | "submittedAt" | "createdAt" | "updatedAt">) => {
    const dbData = readDb();
    
    // Get all other entries logged by this user on the same day for validation
    const dayEntries = dbData.timeEntries.filter(
      (e) => e.userId === entry.userId && e.entryDate === entry.entryDate
    );

    const id = `ent-${Math.random().toString(36).substr(2, 9)}`;
    const flagReason = mockDb.validateEntry({ id, ...entry }, dayEntries);
    const status = flagReason ? "flagged" : "draft";

    const newEntry: TimeEntry = {
      ...entry,
      id,
      status,
      flagReason,
      submittedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dbData.timeEntries.push(newEntry);
    writeDb(dbData);
    return newEntry;
  },

  updateTimeEntry: (id: string, entryUpdates: Partial<TimeEntry>) => {
    const dbData = readDb();
    const entryIdx = dbData.timeEntries.findIndex((e) => e.id === id);
    if (entryIdx === -1) throw new Error("Time entry not found");

    const existingEntry = dbData.timeEntries[entryIdx];
    const merged = { ...existingEntry, ...entryUpdates };

    // Recalculate validation flags
    const dayEntries = dbData.timeEntries.filter(
      (e) => e.userId === merged.userId && e.entryDate === merged.entryDate
    );
    
    const flagReason = mockDb.validateEntry(merged, dayEntries);
    merged.flagReason = flagReason;
    if (merged.status !== "submitted" && merged.status !== "approved") {
      merged.status = flagReason ? "flagged" : "draft";
    }
    
    merged.updatedAt = new Date().toISOString();
    
    dbData.timeEntries[entryIdx] = merged;
    writeDb(dbData);
    return merged;
  },

  deleteTimeEntry: (id: string) => {
    const dbData = readDb();
    const filtered = dbData.timeEntries.filter((e) => e.id !== id);
    const deleted = dbData.timeEntries.length !== filtered.length;
    dbData.timeEntries = filtered;
    writeDb(dbData);
    return deleted;
  },

  // --- ON-CALL SERVICE ---
  getOnCallPeriods: (userId?: string) => {
    const periods = readDb().onCallPeriods;
    if (userId) {
      return periods.filter((p) => p.userId === userId);
    }
    return periods;
  },
  
  toggleOnCall: (userId: string) => {
    const dbData = readDb();
    const activePeriodIdx = dbData.onCallPeriods.findIndex(
      (p) => p.userId === userId && p.endedAt === null
    );

    const nowStr = new Date().toISOString();

    if (activePeriodIdx !== -1) {
      // End on-call period
      const period = dbData.onCallPeriods[activePeriodIdx];
      period.endedAt = nowStr;
      dbData.onCallPeriods[activePeriodIdx] = period;
      writeDb(dbData);
      return period;
    } else {
      // Start on-call period
      // Helper to calculate Monday week commencing
      const today = new Date();
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      const mondayStr = new Date(today.setDate(diff)).toISOString().split("T")[0];

      const newPeriod: OnCallPeriod = {
        id: `oncall-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        startedAt: nowStr,
        endedAt: null,
        weekCommencing: mondayStr,
      };

      dbData.onCallPeriods.push(newPeriod);
      writeDb(dbData);
      return newPeriod;
    }
  },

  // --- WEEK SUBMISSIONS ---
  getWeekSubmissions: (userId?: string) => {
    const submissions = readDb().weekSubmissions;
    if (userId) {
      return submissions.filter((s) => s.userId === userId);
    }
    return submissions;
  },

  submitWeek: (userId: string, weekCommencing: string) => {
    const dbData = readDb();
    
    // Set all draft or flagged entries for this week to "submitted"
    const weekStart = new Date(weekCommencing);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    
    dbData.timeEntries = dbData.timeEntries.map((e) => {
      if (e.userId === userId) {
        const entryDate = new Date(e.entryDate);
        if (entryDate >= weekStart && entryDate < weekEnd && (e.status === "draft" || e.status === "flagged")) {
          return {
            ...e,
            status: "submitted",
            submittedAt: new Date().toISOString(),
          };
        }
      }
      return e;
    });

    // Upsert week submission record
    const subIdx = dbData.weekSubmissions.findIndex(
      (s) => s.userId === userId && s.weekCommencing === weekCommencing
    );

    const nowStr = new Date().toISOString();

    if (subIdx !== -1) {
      dbData.weekSubmissions[subIdx].status = "submitted";
      dbData.weekSubmissions[subIdx].submittedAt = nowStr;
    } else {
      dbData.weekSubmissions.push({
        id: `sub-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        weekCommencing,
        submittedAt: nowStr,
        status: "submitted",
      });
    }

    writeDb(dbData);
    return { status: "submitted", weekCommencing };
  },

  approveWeek: (userId: string, weekCommencing: string) => {
    const dbData = readDb();
    
    // Set all submitted entries for this week to "approved"
    const weekStart = new Date(weekCommencing);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    
    dbData.timeEntries = dbData.timeEntries.map((e) => {
      if (e.userId === userId) {
        const entryDate = new Date(e.entryDate);
        if (entryDate >= weekStart && entryDate < weekEnd && e.status === "submitted") {
          return {
            ...e,
            status: "approved",
          };
        }
      }
      return e;
    });

    // Mark week submission as approved
    const subIdx = dbData.weekSubmissions.findIndex(
      (s) => s.userId === userId && s.weekCommencing === weekCommencing
    );

    if (subIdx !== -1) {
      dbData.weekSubmissions[subIdx].status = "approved";
    }

    writeDb(dbData);
    return { status: "approved", weekCommencing };
  }
};
