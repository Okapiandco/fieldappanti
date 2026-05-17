"use client";

import React, { useState, useEffect } from "react";
import { 
  Calendar, Clock, AlertTriangle, FileSpreadsheet, PlusCircle, 
  Trash2, Edit, ChevronLeft, ChevronRight, BarChart3, CheckSquare, 
  ListFilter, Users, RefreshCw, LogOut, Sun, Moon, Loader2, HelpCircle, BookOpen
} from "lucide-react";
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  PieChart, Pie, Cell, Legend 
} from "recharts";

import WeekGrid from "@/components/WeekGrid";
import EntryForm from "@/components/EntryForm";

// HSL color palette constants for Recharts
const COLORS = ["#16a34a", "#f59e0b", "#ef4444", "#0ea5e9", "#7c3aed"];

export default function Dashboard() {
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [dbUser, setDbUser] = useState<any>(null);
  
  // Navigation & Date States
  const [weekCommencing, setWeekCommencing] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  
  // Data States
  const [entries, setEntries] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [dailyLunches, setDailyLunches] = useState<any[]>([]);
  const [dailyOnCalls, setDailyOnCalls] = useState<any[]>([]);
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editEntry, setEditEntry] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"timesheet" | "admin-team" | "admin-export" | "admin-reports" | "user-guide">("timesheet");
  const [adminSelectedUserId, setAdminSelectedUserId] = useState<string>("");
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  // 1. Initialize active Monday, selected today, and current active prototype profile
  useEffect(() => {
    const today = new Date();
    setSelectedDate(today.toISOString().split("T")[0]);

    // Calculate current Monday
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    setWeekCommencing(monday.toISOString().split("T")[0]);
    
    // Set default export dates (start and end of current month)
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    setExportStartDate(firstDay.toISOString().split("T")[0]);
    setExportEndDate(lastDay.toISOString().split("T")[0]);

    // Load active profile from local storage or default to user-1001 (Dave)
    const saved = localStorage.getItem("fieldtime_prototype_user_id");
    setCurrentUserId(saved || "user-1001");
  }, []);

  // 2. Helper: Set headers for API requests containing active profile ID
  const getAuthHeaders = (userIdToUse?: string) => {
    return {
      "Content-Type": "application/json",
      "x-user-id": userIdToUse || currentUserId,
    };
  };

  // 3. Fetch User & System Data from API
  const fetchData = async (userIdToFetch?: string) => {
    const activeId = userIdToFetch || currentUserId;
    if (!activeId) return;
    
    setLoading(true);
    try {
      const getHeaders = () => getAuthHeaders(activeId);

      // Fetch users list first so we have profiles
      const usersRes = await fetch("/api/public/mock-users");
      if (usersRes.ok) {
        const data = await usersRes.json();
        setAllUsers(data);
        
        const matched = data.find((u: any) => u.id === activeId);
        if (matched) {
          setDbUser(matched);
          if (matched.role === "admin") {
            setAdminSelectedUserId((prev) => prev || data.find((u: any) => u.role !== "admin")?.id || "");
          }
        }
      }

      // Fetch time entries
      const entriesRes = await fetch("/api/entries", { headers: getHeaders() });
      if (entriesRes.ok) {
        const data = await entriesRes.json();
        setEntries(data);
      }

      // Fetch daily on-calls list
      const onCallRes = await fetch("/api/on-call", { headers: getHeaders() });
      if (onCallRes.ok) {
        const data = await onCallRes.json();
        setDailyOnCalls(data);
      }

      // Fetch week submissions tracking
      const subRes = await fetch("/api/submissions", { headers: getHeaders() });
      if (subRes.ok) {
        const data = await subRes.json();
        setSubmissions(data);
      }

      // Populate machines list
      const machinesRes = await fetch("/api/public/mock-machines");
      if (machinesRes.ok) {
        const data = await machinesRes.json();
        setMachines(data);
      }

      // Fetch daily lunches list
      const lunchRes = await fetch("/api/lunch", { headers: getHeaders() });
      if (lunchRes.ok) {
        const data = await lunchRes.json();
        setDailyLunches(data);
      }

    } catch (e) {
      console.error("Failed to load dashboard data", e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDailyLunch = async (date: string, minutes: number) => {
    const res = await fetch("/api/lunch", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ entryDate: date, lunchMinutes: minutes }),
    });
    if (res.ok) {
      fetchData();
    }
  };

  useEffect(() => {
    if (currentUserId && weekCommencing) {
      fetchData();
    }
  }, [currentUserId, weekCommencing]);

  // Dark Mode toggler
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [darkMode]);

  // Adjust current week commencing (navigation)
  const adjustWeek = (weeksAmount: number) => {
    const d = new Date(weekCommencing);
    d.setDate(d.getDate() + weeksAmount * 7);
    const newMon = d.toISOString().split("T")[0];
    setWeekCommencing(newMon);
    setSelectedDate(newMon); // reset selected date to Monday of that week
  };

  // --- ACTIONS ---

  const handleUpdateDailyOnCall = async (date: string, isOnCall: boolean) => {
    const res = await fetch("/api/on-call", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ entryDate: date, isOnCall }),
    });
    if (res.ok) {
      fetchData();
    }
  };

  const handleTimeEntrySubmit = async (payload: any) => {
    const url = editEntry ? `/api/entries?id=${editEntry.id}` : "/api/entries";
    const method = editEntry ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Failed to save record");
    }

    setEditEntry(null);
    fetchData();
  };

  const handleTimeEntryDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this time entry?")) return;

    const res = await fetch(`/api/entries?id=${id}`, { method: "DELETE", headers: getAuthHeaders() });
    if (res.ok) {
      fetchData();
    }
  };

  const handleSubmitWeek = async () => {
    if (!confirm(`Submit your timesheet for week commencing ${weekCommencing}? This will lock your entries for editing.`)) return;

    const res = await fetch("/api/submissions", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ weekCommencing }),
    });

    if (res.ok) {
      fetchData();
    }
  };

  const handleApproveWeek = async (targetUserId: string) => {
    const res = await fetch("/api/submissions", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ weekCommencing, userId: targetUserId, approve: true }),
    });

    if (res.ok) {
      alert("Timesheet approved successfully!");
      fetchData();
    }
  };

  // CSV Generator & Stream Downloader (Client-side, offline tolerant)
  const handleExportCSV = () => {
    // Filter entries by date range and selected user
    const start = new Date(exportStartDate);
    const end = new Date(exportEndDate);

    // Get all entries matching criteria
    const filteredEntries = entries.filter((e) => {
      const d = new Date(e.entryDate);
      const matchesDate = d >= start && d <= end;
      return matchesDate;
    });

    if (filteredEntries.length === 0) {
      alert("No time entries found in the selected date range!");
      return;
    }

    // Build headers
    const headers = [
      "Date", "Staff Name", "Department", "Customer Code", "Customer Name", 
      "Machine Logged", "Job Number", "Task Hours", "Daily Lunch Deduction (mins)", "Daily Lunch Deduction (hours)", "Miles", "Job Type", "On Call"
    ];

    // Build rows
    const rows = filteredEntries.map((e) => {
      const staffUser = allUsers.find((u) => u.id === e.userId);
      const cust = e.customerId ? e.customerId : null; // matches mockDb customer id lookup
      
      // Let's resolve customer details
      // In the mockDb seeder, customers have ids like "cust-1000"
      // We will look them up locally from allUsers or mock list
      // For CSV simplicity, we'll output details if loaded
      const customerCode = e.customerId ? `CUST-${e.customerId.split("-")[1] || ""}` : "INTERNAL";
      const customerName = e.customerId ? `Customer ${e.customerId.split("-")[1] || ""}` : "Internal duty / Till";
      const machineName = e.customMachine || (e.machineId ? `Machine ${e.machineId.split("-")[1] || ""}` : "None");

      // Resolve daily lunch break deduction
      const dailyLunchMinutes = dailyLunches.find(
        (l) => l.userId === e.userId && l.entryDate === e.entryDate
      )?.lunchMinutes ?? 60; // default 60 mins (1 hour)

      // Resolve daily on-call status
      const isDailyOnCall = dailyOnCalls.some(
        (o) => o.userId === e.userId && o.entryDate === e.entryDate && o.isOnCall
      );

      return [
        e.entryDate,
        staffUser?.name || "Field Worker",
        staffUser?.department || "Field",
        customerCode,
        customerName,
        machineName,
        e.jobNumber || "N/A",
        e.hours,
        dailyLunchMinutes,
        (dailyLunchMinutes / 60).toFixed(2),
        e.miles || 0,
        e.jobType.replace("_", " ").toUpperCase(),
        isDailyOnCall ? "Y" : "N",
      ];
    });

    // Assemble CSV content
    const csvContent = 
      "data:text/csv;charset=utf-8," + 
      [headers.join(","), ...rows.map(r => r.map(val => `"${val}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `FieldTime_HR_Export_${exportStartDate}_to_${exportEndDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- DERIVED SELECTORS ---

  // Standard user role matching
  const role = dbUser?.role || "staff";
  const isAdmin = role === "admin";

  // Filter entries logged for the active week view
  const activeWeekEntries = weekCommencing
    ? entries.filter((e) => {
        if (isAdmin && activeTab === "admin-team" && adminSelectedUserId) {
          if (e.userId !== adminSelectedUserId) return false;
        } else if (dbUser && e.userId !== dbUser.id) {
          return false;
        }
        const d = new Date(e.entryDate);
        const start = new Date(weekCommencing);
        const end = new Date(start);
        end.setDate(start.getDate() + 7);
        return d >= start && d < end;
      })
    : [];

  // Entries for the currently selected day
  const selectedDayEntries = selectedDate ? activeWeekEntries.filter((e) => e.entryDate === selectedDate) : [];
  const selectedDayHours = selectedDayEntries.reduce((sum, e) => sum + Number(e.hours), 0);

  // Check if current week is submitted
  const activeStaffId = isAdmin && activeTab === "admin-team" ? adminSelectedUserId : (dbUser?.id || "");
  const currentWeekSubmission = weekCommencing
    ? submissions.find(
        (s) => s.userId === activeStaffId && s.weekCommencing === weekCommencing
      )
    : null;
  const isWeekSubmitted = currentWeekSubmission?.status === "submitted" || currentWeekSubmission?.status === "approved";
  const isWeekApproved = currentWeekSubmission?.status === "approved";

  // Check if active week has any red/empty weekdays to disable submission
  const weekdayDates: string[] = [];
  if (weekCommencing) {
    const baseD = new Date(weekCommencing);
    for (let i = 0; i < 5; i++) {
      const d = new Date(baseD);
      d.setDate(baseD.getDate() + i);
      weekdayDates.push(d.toISOString().split("T")[0]);
    }
  }
  const hasEmptyWeekdays = weekCommencing
    ? weekdayDates.some((dateStr) => {
        const dayHours = entries.filter((e) => e.userId === activeStaffId && e.entryDate === dateStr)
          .reduce((sum, e) => sum + Number(e.hours), 0);
        return dayHours === 0;
      })
    : true;

  // --- REPORT GENERATION DATA (Admins Only) ---
  
  // Total hours by client (Recharts data)
  const getHoursByClientData = () => {
    const clientMap: Record<string, number> = {};
    entries.forEach((e) => {
      if (e.customerId) {
        // Resolve a simple mock client label
        const code = `CUST-${e.customerId.split("-")[1] || "1000"}`;
        clientMap[code] = (clientMap[code] || 0) + Number(e.hours);
      }
    });
    return Object.entries(clientMap)
      .map(([name, hours]) => ({ name, Hours: Number(hours.toFixed(1)) }))
      .sort((a, b) => b.Hours - a.Hours)
      .slice(0, 7); // top 7 clients
  };

  // Total hours by Job Type (Pie chart data)
  const getHoursByJobTypeData = () => {
    const typeMap: Record<string, number> = {};
    entries.forEach((e) => {
      const typeLabel = e.jobType.replace("_", " ").toUpperCase();
      typeMap[typeLabel] = (typeMap[typeLabel] || 0) + Number(e.hours);
    });
    return Object.entries(typeMap).map(([name, value]) => ({
      name,
      value: Number(value.toFixed(1)),
    }));
  };

  // Calculate total paid hours for a staff user in the selected week view
  const getUserWeekPaidHours = (userId: string, weekCommencingStr: string) => {
    if (!weekCommencingStr) return 0;
    const start = new Date(weekCommencingStr);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);

    const userWeekEntries = entries.filter(
      (e) => e.userId === userId && new Date(e.entryDate) >= start && new Date(e.entryDate) < end
    );
    const totalTaskHours = userWeekEntries.reduce((sum, e) => sum + Number(e.hours), 0);

    // Get unique worked dates in this week
    const workedDates = Array.from(new Set(userWeekEntries.map((e) => e.entryDate)));
    
    // Sum lunch deductions for each worked date
    let totalLunchDeductions = 0;
    workedDates.forEach((date) => {
      const dailyLunchMinutes = dailyLunches.find(
        (l) => l.userId === userId && l.entryDate === date
      )?.lunchMinutes ?? 60; // default to 60 mins (1h)
      totalLunchDeductions += dailyLunchMinutes / 60;
    });

    return Math.max(0, totalTaskHours - totalLunchDeductions);
  };

  // Team submissions logs
  const getTeamCompliance = () => {
    if (!weekCommencing) return [];
    
    return allUsers.filter(u => u.role !== "admin").map((u) => {
      const sub = submissions.find(s => s.userId === u.id && s.weekCommencing === weekCommencing);
      const netPaid = getUserWeekPaidHours(u.id, weekCommencing);
      return {
        user: u,
        status: sub?.status || "incomplete",
        hours: netPaid,
      };
    });
  };

  // Aggregate anomalies across all staff
  const getAnomalies = () => {
    return entries
      .filter((e) => e.status === "flagged" || e.flagReason)
      .map((e) => {
        const staffUser = allUsers.find((u) => u.id === e.userId);
        return {
          ...e,
          staffName: staffUser?.name || "Staff",
        };
      });
  };

  // Loading Screen
  if (!currentUserId || (loading && !dbUser)) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-bold text-muted-foreground mt-4">
          Securing prototype sandbox & loading agricultural logs...
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* Dynamic Navigation Bar */}
      <header className="sticky top-0 z-30 w-full glass border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary text-primary-foreground shadow-md">
              <Clock className="h-5.5 w-5.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black tracking-wider uppercase leading-none">
                FieldTime
              </span>
              <span className="text-[10px] text-muted-foreground font-semibold mt-0.5 leading-none">
                Okapi & Co — Farm Time logs
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Dark Mode toggle button */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 tap-target rounded-xl border border-border bg-card hover:bg-secondary/40 text-foreground cursor-pointer"
            >
              {darkMode ? <Sun className="h-4.5 w-4.5 text-primary" /> : <Moon className="h-4.5 w-4.5" />}
            </button>

            {/* Role indicator */}
            <span className={`hidden sm:inline-flex px-3 py-1 text-xs font-bold rounded-full border uppercase tracking-wide ${
              isAdmin 
                ? "bg-primary/10 border-primary/20 text-primary" 
                : "bg-secondary text-secondary-foreground border-border"
            }`}>
              {isAdmin ? "Admin Portal" : "Staff Timesheet"}
            </span>

            {/* Prototype Account Switcher */}
            <div className="relative flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground uppercase font-black tracking-wide hidden md:inline">
                Operator:
              </span>
              <select
                value={currentUserId}
                onChange={(e) => {
                  const newId = e.target.value;
                  setCurrentUserId(newId);
                  localStorage.setItem("fieldtime_prototype_user_id", newId);
                  fetchData(newId);
                }}
                className="tap-target px-3 py-2 text-xs font-black uppercase tracking-wider rounded-xl border border-border bg-card hover:bg-secondary/40 text-foreground cursor-pointer outline-none focus:border-primary shadow-sm"
              >
                {allUsers.map((u) => (
                  <option key={u.id} value={u.id} className="text-foreground bg-card">
                    {u.name} ({u.role.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:py-6 space-y-6">
        
        {/* Navigation Tabs */}
        <div className="flex flex-wrap border border-border/60 gap-1 bg-secondary/10 p-1 rounded-xl">
          {[
            { id: "timesheet", label: "My Timesheet", icon: Calendar, visible: true },
            { id: "admin-team", label: "Team Timesheets", icon: Users, visible: isAdmin },
            { id: "admin-export", label: "HR Payroll Export", icon: FileSpreadsheet, visible: isAdmin },
            { id: "admin-reports", label: "Dynamic Reports", icon: BarChart3, visible: isAdmin },
            { id: "user-guide", label: "User Guide", icon: HelpCircle, visible: true },
          ].filter(tab => tab.visible).map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider cursor-pointer transition-all ${
                  activeTab === tab.id
                    ? "bg-card text-primary shadow-sm scale-102 border border-border/60"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* --- TAB 1: TIMESHEET VIEW (Staff & Admin Personal) --- */}
        {activeTab === "timesheet" && (
          <div className="space-y-6">
            
            {/* On-Call removed at weekly level */}

            {/* Week navigation & Traffic Light WeekGrid */}
            <div className="bg-card rounded-2xl border border-border shadow-sm p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
                    Timesheet Week
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Week Commencing: <span className="font-semibold text-primary">{weekCommencing}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => adjustWeek(-1)}
                    className="p-2 tap-target rounded-lg border border-border hover:bg-secondary/40 text-foreground cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      const today = new Date();
                      const day = today.getDay();
                      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
                      setWeekCommencing(new Date(today.setDate(diff)).toISOString().split("T")[0]);
                    }}
                    className="px-3 py-2 tap-target rounded-lg border border-border text-xs font-extrabold uppercase hover:bg-secondary/40 text-foreground cursor-pointer"
                  >
                    Current
                  </button>
                  <button
                    onClick={() => adjustWeek(1)}
                    className="p-2 tap-target rounded-lg border border-border hover:bg-secondary/40 text-foreground cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Traffic Light Grid */}
              <WeekGrid
                weekCommencing={weekCommencing}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                entries={activeWeekEntries}
              />
            </div>

            {/* Selected day entries list */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-foreground">
                    Logs for {selectedDate}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Total Day Hours: <span className="font-bold text-primary">{selectedDayHours} Hours</span>
                  </p>
                </div>

                {!isWeekSubmitted && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditEntry(null);
                      setShowForm(true);
                    }}
                    className="tap-target px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md hover:opacity-90 cursor-pointer active:scale-95"
                  >
                    <PlusCircle className="h-4.5 w-4.5" />
                    <span>Log Daily Hours</span>
                  </button>
                )}
              </div>

              {/* Daily Lunch & On-Call Summary Panel (Visible if entries exist) */}
              {selectedDayEntries.length > 0 && (() => {
                const selectedDayLunchMinutes = dailyLunches.find(
                  (l) => l.userId === activeStaffId && l.entryDate === selectedDate
                )?.lunchMinutes ?? 60;
                const netPaidHours = Math.max(0, selectedDayHours - Number((selectedDayLunchMinutes / 60).toFixed(2)));

                const selectedDayOnCall = dailyOnCalls.some(
                  (o) => o.userId === activeStaffId && o.entryDate === selectedDate && o.isOnCall
                );

                return (
                  <div className="p-4 bg-card rounded-2xl border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                        Daily Hours Summary
                      </span>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <p className="text-xs text-muted-foreground">
                          Logged Task: <span className="font-bold text-foreground">{selectedDayHours.toFixed(2)}h</span>
                        </p>
                        <span className="text-muted-foreground/30">•</span>
                        <p className="text-xs text-muted-foreground">
                          Lunch Deduction: <span className="font-bold text-foreground">{(selectedDayLunchMinutes / 60).toFixed(1)}h</span>
                        </p>
                        <span className="text-muted-foreground/30">•</span>
                        <p className="text-xs font-black uppercase text-primary">
                          Net Paid: <span className="text-sm font-extrabold">{netPaidHours.toFixed(2)}h</span>
                        </p>
                        {selectedDayOnCall && (
                          <>
                            <span className="text-muted-foreground/30">•</span>
                            <span className="text-[10px] font-black uppercase bg-amber-600/10 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 px-2 py-0.5 rounded-full border border-amber-500/20">
                              On-Call Active
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      {/* Lunch Selector Button Set */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                          Daily Lunch Break
                        </span>
                        {isWeekSubmitted ? (
                          <span className="inline-flex px-3 py-1 text-xs font-bold rounded-lg bg-secondary text-secondary-foreground border border-border">
                            {selectedDayLunchMinutes === 60 ? "1 Hour Lunch (Default)" : selectedDayLunchMinutes === 30 ? "30 Mins Lunch" : "No Lunch Break"}
                          </span>
                        ) : (
                          <div className="flex items-center bg-secondary/20 p-0.5 rounded-lg border border-border">
                            {[
                              { value: 60, label: "1h Default" },
                              { value: 30, label: "30m" },
                              { value: 0, label: "None" },
                            ].map((item) => (
                              <button
                                key={item.value}
                                type="button"
                                onClick={() => handleUpdateDailyLunch(selectedDate, item.value)}
                                className={`px-3 py-1.5 text-[11px] font-extrabold uppercase rounded-md cursor-pointer transition-all ${
                                  selectedDayLunchMinutes === item.value
                                    ? "bg-primary text-primary-foreground shadow-sm font-black"
                                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                                }`}
                              >
                                {item.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* On-Call Selector Button Set */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                          Daily On-Call Duty
                        </span>
                        {isWeekSubmitted ? (
                          <span className="inline-flex px-3 py-1 text-xs font-bold rounded-lg bg-secondary text-secondary-foreground border border-border">
                            {selectedDayOnCall ? "On-Call Active" : "No On-Call"}
                          </span>
                        ) : (
                          <div className="flex items-center bg-secondary/20 p-0.5 rounded-lg border border-border">
                            {[
                              { value: true, label: "Active" },
                              { value: false, label: "None" },
                            ].map((item) => (
                              <button
                                key={item.label}
                                type="button"
                                onClick={() => handleUpdateDailyOnCall(selectedDate, item.value)}
                                className={`px-4 py-1.5 text-[11px] font-extrabold uppercase rounded-md cursor-pointer transition-all ${
                                  selectedDayOnCall === item.value
                                    ? item.value
                                      ? "bg-amber-600 dark:bg-amber-500 text-white shadow-sm font-black"
                                      : "bg-muted text-muted-foreground shadow-sm font-black"
                                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                                }`}
                              >
                                {item.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {selectedDayEntries.length === 0 ? (
                <div className="p-8 text-center bg-card rounded-2xl border border-dashed border-border">
                  <Calendar className="h-8 w-8 text-muted-foreground mx-auto opacity-40 mb-2" />
                  <p className="text-sm font-semibold text-muted-foreground">
                    No time entries logged for this date.
                  </p>
                  {!isWeekSubmitted && (
                    <button
                      onClick={() => setShowForm(true)}
                      className="text-xs font-bold text-primary hover:underline mt-1 cursor-pointer"
                    >
                      Tap here to log your hours.
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {selectedDayEntries.map((e) => {
                    const isFlagged = e.status === "flagged" || e.flagReason;
                    return (
                      <div
                        key={e.id}
                        className={`p-4 bg-card rounded-2xl border transition-all shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                          isFlagged ? "border-status-amber/40 bg-status-amber-bg/25" : "border-border"
                        }`}
                      >
                        {/* Left side details */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                              {e.jobType.replace("_", " ")}
                            </span>
                            {(e.isOnCall || dailyOnCalls.some(o => o.userId === e.userId && o.entryDate === e.entryDate && o.isOnCall)) && (
                              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-600/10 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 border border-amber-500/20">
                                On-Call Duty
                              </span>
                            )}
                            <span className="text-sm font-extrabold text-foreground">
                              {e.hours} Hours
                            </span>
                          </div>

                          <div className="text-xs space-y-0.5 text-muted-foreground">
                            {e.customerId && (
                              <p>
                                <span className="font-semibold text-foreground">Customer:</span> Customer {e.customerId.split("-")[1] || ""} (Code: CUST-{e.customerId.split("-")[1] || ""})
                              </p>
                            )}
                            {(e.machineId || e.customMachine) && (
                              <p>
                                <span className="font-semibold text-foreground">Equipment:</span> {e.customMachine || machines.find(m => m.id === e.machineId)?.name || "Standard Equipment"}
                              </p>
                            )}
                            {e.jobNumber && (
                              <p>
                                <span className="font-semibold text-foreground">Job #:</span> {e.jobNumber}
                              </p>
                            )}
                            {e.miles > 0 && (
                              <p>
                                <span className="font-semibold text-foreground">Mileage:</span> {e.miles} Miles
                              </p>
                            )}
                            {e.notes && (
                              <p className="italic text-foreground mt-1">
                                "{e.notes}"
                              </p>
                            )}
                          </div>

                          {/* Anomaly list */}
                          {isFlagged && (
                            <div className="flex items-start gap-1.5 p-2 bg-status-amber-bg border border-status-amber/25 rounded-lg mt-2 text-[11px] text-secondary-foreground leading-tight">
                              <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-status-amber" />
                              <div className="flex-1">
                                <span className="font-extrabold uppercase text-[9px] tracking-wider block text-status-amber">Timesheet Alert</span>
                                <span>{e.flagReason}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Right side controls */}
                        {!isWeekSubmitted && (
                          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                            <button
                              type="button"
                              onClick={() => {
                                setEditEntry(e);
                                setShowForm(true);
                              }}
                              className="p-2.5 rounded-lg border border-border bg-card text-foreground hover:bg-secondary/40 cursor-pointer active:scale-95"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleTimeEntryDelete(e.id)}
                              className="p-2.5 rounded-lg border border-border bg-card text-destructive hover:bg-destructive/10 cursor-pointer active:scale-95"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Locking Timesheet Submit Banner */}
            <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-sm font-black uppercase tracking-wider text-foreground">
                  Timesheet Submission Checklist
                </h4>
                <div className="text-xs space-y-1 text-muted-foreground">
                  <p className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${activeWeekEntries.length > 0 ? "bg-status-green" : "bg-status-red"}`} />
                    <span>Logged timesheet entries for this week ({activeWeekEntries.length} logged)</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${!hasEmptyWeekdays ? "bg-status-green" : "bg-status-amber animate-pulse"}`} />
                    <span>Gap check: No missing Mon-Fri workdays</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isWeekSubmitted ? (
                  <div className={`px-4 py-2.5 rounded-xl border text-xs font-extrabold uppercase tracking-wide flex items-center gap-1.5 ${
                    isWeekApproved 
                      ? "bg-status-green-bg border-status-green/30 text-status-green" 
                      : "bg-status-amber-bg border-status-amber/30 text-status-amber"
                  }`}>
                    <CheckSquare className="h-4 w-4" />
                    <span>{isWeekApproved ? "Timesheet Approved" : "Pending Review"}</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmitWeek}
                    disabled={activeWeekEntries.length === 0 || hasEmptyWeekdays}
                    className="tap-target px-6 py-3 rounded-xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-wider shadow-md hover:opacity-90 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Submit Timesheet Week
                  </button>
                )}
              </div>
            </div>

          </div>
        )}

        {/* --- TAB 2: TEAM TIMESHEETS (Admins Only) --- */}
        {activeTab === "admin-team" && isAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left: User Select List */}
            <div className="space-y-3 md:col-span-1">
              <h3 className="text-sm font-black uppercase tracking-wider text-muted-foreground">
                Active Staff Members
              </h3>
              <div className="bg-card rounded-2xl border border-border shadow-sm divide-y divide-border overflow-hidden">
                {getTeamCompliance().map((item) => {
                  const isSelected = adminSelectedUserId === item.user.id;
                  const statusColors: Record<string, string> = {
                    approved: "bg-status-green-bg text-status-green border-status-green/20",
                    submitted: "bg-status-amber-bg text-status-amber border-status-amber/20",
                    incomplete: "bg-status-red-bg text-status-red border-status-red/20",
                  };
                  return (
                    <button
                      key={item.user.id}
                      type="button"
                      onClick={() => setAdminSelectedUserId(item.user.id)}
                      className={`w-full text-left p-3.5 flex items-center justify-between cursor-pointer transition-colors ${
                        isSelected ? "bg-primary/10 text-primary" : "hover:bg-secondary/25"
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-extrabold">{item.user.name}</span>
                        <span className="text-xs text-muted-foreground capitalize mt-0.5">
                          Dept: {item.user.department} | Hours: {item.hours}h
                        </span>
                      </div>
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusColors[item.status]}`}>
                        {item.status}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Selected Staff timesheet grid */}
            <div className="md:col-span-2 space-y-6 animate-in fade-in duration-200">
              <div className="bg-card rounded-2xl border border-border p-4 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-extrabold text-foreground">
                      Timesheet review: {allUsers.find(u => u.id === adminSelectedUserId)?.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Reviewing Week Commencing <span className="font-semibold text-primary">{weekCommencing}</span>
                    </p>
                  </div>
                  
                  {isWeekSubmitted && !isWeekApproved && (
                    <button
                      type="button"
                      onClick={() => handleApproveWeek(adminSelectedUserId)}
                      className="tap-target px-4 py-2.5 rounded-xl bg-status-green text-primary-foreground font-black text-xs uppercase tracking-wider shadow-md hover:opacity-90 cursor-pointer"
                    >
                      Approve Timesheet Week
                    </button>
                  )}
                </div>

                <WeekGrid
                  weekCommencing={weekCommencing}
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                  entries={activeWeekEntries}
                />
              </div>

              {/* Logged details summary */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-muted-foreground">
                  Logged Entries for {selectedDate}
                </h4>

                {selectedDayEntries.length === 0 ? (
                  <div className="p-8 text-center bg-card rounded-2xl border border-dashed border-border">
                    <p className="text-sm text-muted-foreground font-semibold">
                      No hours logged by staff on this day.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedDayEntries.map((e) => {
                      const isFlagged = e.status === "flagged" || e.flagReason;
                      return (
                        <div
                          key={e.id}
                          className={`p-4 bg-card rounded-2xl border ${
                            isFlagged ? "border-status-amber/40 bg-status-amber-bg/15" : "border-border"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black uppercase px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                              {e.jobType}
                            </span>
                            <span className="text-sm font-extrabold">{e.hours} Hours</span>
                          </div>

                          <div className="text-xs text-muted-foreground space-y-0.5 mt-2">
                            {e.customerId && <p><span className="font-semibold text-foreground">Customer:</span> Customer {e.customerId.split("-")[1]}</p>}
                            {e.jobNumber && <p><span className="font-semibold text-foreground">Job No:</span> {e.jobNumber}</p>}
                            {e.notes && <p className="italic text-foreground mt-1">"{e.notes}"</p>}
                          </div>

                          {isFlagged && (
                            <div className="flex items-center gap-1.5 p-2 bg-status-amber-bg border border-status-amber/20 rounded-lg mt-2 text-[11px] text-secondary-foreground">
                              <AlertTriangle className="h-3.5 w-3.5 text-status-amber" />
                              <span>{e.flagReason}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 3: HR PAYROLL EXPORT (Admins Only) --- */}
        {activeTab === "admin-export" && isAdmin && (
          <div className="max-w-xl mx-auto bg-card rounded-2xl border border-border p-6 shadow-sm space-y-6 animate-in slide-in-from-bottom-4 duration-300">
            <div>
              <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                <FileSpreadsheet className="h-5.5 w-5.5 text-primary" />
                <span>HR System Payroll CSV Builder</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Generate the exact formatted timesheet CSV import file for direct payroll system load.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Start Date
                </label>
                <input
                  type="date"
                  value={exportStartDate}
                  onChange={(e) => setExportStartDate(e.target.value)}
                  className="w-full px-3 py-3 tap-target rounded-lg border border-border bg-card text-foreground focus:ring-2 focus:ring-primary text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  End Date
                </label>
                <input
                  type="date"
                  value={exportEndDate}
                  onChange={(e) => setExportEndDate(e.target.value)}
                  className="w-full px-3 py-3 tap-target rounded-lg border border-border bg-card text-foreground focus:ring-2 focus:ring-primary text-sm"
                />
              </div>
            </div>

            {/* Export options */}
            <div className="p-4 bg-secondary/15 rounded-xl border border-border space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                Standard Export Mappings Configured
              </span>
              <p className="text-xs text-muted-foreground pl-4 relative before:absolute before:left-1 before:top-1.5 before:w-1.5 before:h-1.5 before:rounded-full before:bg-primary">
                Gross hours and net paid hours (lunch time automatically deducted).
              </p>
              <p className="text-xs text-muted-foreground pl-4 relative before:absolute before:left-1 before:top-1.5 before:w-1.5 before:h-1.5 before:rounded-full before:bg-primary">
                On-call premium shifts flagged with separate on-call duration columns.
              </p>
            </div>

            <button
              type="button"
              onClick={handleExportCSV}
              className="w-full tap-target py-3.5 rounded-xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md hover:opacity-90 cursor-pointer"
            >
              <FileSpreadsheet className="h-4.5 w-4.5" />
              <span>Export Payroll CSV</span>
            </button>
          </div>
        )}

        {/* --- TAB 4: DYNAMIC REPORTS & ANOMALIES (Admins Only) --- */}
        {activeTab === "admin-reports" && isAdmin && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* Upper: Anomaly Log & Compliance summaries */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Anomaly Log list */}
              <div className="md:col-span-2 space-y-3">
                <h3 className="text-sm font-black uppercase tracking-wider text-muted-foreground">
                  Active Anomaly & Compliance Log
                </h3>
                <div className="bg-card rounded-2xl border border-border shadow-sm divide-y divide-border overflow-hidden">
                  {getAnomalies().length === 0 ? (
                    <div className="p-8 text-center text-sm text-muted-foreground font-semibold">
                      ✓ No flagged timesheet anomalies detected!
                    </div>
                  ) : (
                    getAnomalies().map((anomaly) => (
                      <div key={anomaly.id} className="p-4 flex items-start gap-3 bg-status-amber-bg/15 hover:bg-status-amber-bg/35 transition-colors">
                        <AlertTriangle className="h-5 w-5 text-status-amber shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-foreground">{anomaly.staffName}</span>
                            <span className="text-[10px] font-bold bg-secondary px-2 py-0.5 rounded text-muted-foreground uppercase">{anomaly.entryDate}</span>
                          </div>
                          <p className="text-xs text-secondary-foreground font-bold">{anomaly.flagReason}</p>
                          <p className="text-[11px] text-muted-foreground">
                            Logged {anomaly.hours} hours under {anomaly.jobType.replace("_", " ")}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Submission compliance */}
              <div className="space-y-3">
                <h3 className="text-sm font-black uppercase tracking-wider text-muted-foreground">
                  Weekly Submission Status
                </h3>
                <div className="bg-card rounded-2xl border border-border shadow-sm p-4 space-y-3.5">
                  <div className="flex justify-between items-center pb-2 border-b border-border">
                    <span className="text-xs font-bold text-muted-foreground">Weekly Deadline</span>
                    <span className="text-xs font-black text-destructive uppercase">Monday 09:00</span>
                  </div>

                  <div className="space-y-2">
                    {getTeamCompliance().map((item) => {
                      const statusColors: Record<string, string> = {
                        approved: "bg-status-green",
                        submitted: "bg-status-amber animate-pulse-subtle",
                        incomplete: "bg-status-red",
                      };
                      return (
                        <div key={item.user.id} className="flex items-center justify-between text-xs">
                          <span className="font-extrabold text-foreground">{item.user.name}</span>
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${statusColors[item.status]}`} />
                            <span className="capitalize text-muted-foreground font-semibold">{item.status}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>

            {/* Lower: Recharts Graphical Reports */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Bar Chart: Hours per Client */}
              <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
                <div>
                  <h4 className="text-sm font-black uppercase tracking-wider text-foreground">
                    Hours Logged by Customer
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Breakdown of total labor logged across top customer accounts.
                  </p>
                </div>
                
                <div className="h-64">
                  {getHoursByClientData().length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-muted-foreground font-bold">
                      No customer time entries found to chart.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getHoursByClientData()}>
                        <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip />
                        <Bar dataKey="Hours" fill="#16a34a" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Pie Chart: Hours by Job Type */}
              <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
                <div>
                  <h4 className="text-sm font-black uppercase tracking-wider text-foreground">
                    Hours Logged by Duty Type
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Breakdown of field service vs till duty and workshops.
                  </p>
                </div>

                <div className="h-64">
                  {getHoursByJobTypeData().length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-muted-foreground font-bold">
                      No time entries logged to chart.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getHoursByJobTypeData()}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {getHoursByJobTypeData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36} iconSize={10} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* --- TAB 5: USER GUIDE VIEW --- */}
        {activeTab === "user-guide" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* Header Hero Card */}
            <div className="bg-card rounded-2xl border border-border shadow-sm p-6 flex flex-col md:flex-row items-start md:items-center gap-4 bg-gradient-to-r from-primary/5 via-transparent to-transparent">
              <div className="p-3.5 bg-primary/10 rounded-2xl text-primary border border-primary/20 shrink-0">
                <BookOpen className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-black uppercase tracking-wider text-foreground flex items-center gap-2">
                  FieldTime User Operations Guide
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Welcome to the FieldTime system guide! This dashboard helps farm staff and operators easily log daily task hours, record equipment usage, toggle on-call duty, and submit accurate weekly sheets to HR without manual spreadsheet headaches.
                </p>
              </div>
            </div>

            {/* Guide Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Visual Indicators & Lunch (Span 7) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Visual Indicators & Color Codes */}
                <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-1.5 h-4.5 bg-primary rounded-full" />
                    <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
                      Timesheet Calendar Color Codes
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    The Mon-Sun calendar blocks dynamically update color states to guide you in completing your weekly entries without gaps:
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                    
                    {/* Green block */}
                    <div className="p-3 bg-secondary/15 rounded-xl border border-border flex items-start gap-3">
                      <span className="w-8 h-8 rounded-lg bg-status-green-bg border border-status-green/30 text-status-green flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                        🟢
                      </span>
                      <div className="space-y-0.5">
                        <span className="text-xs font-black uppercase text-foreground block">Complete (Green)</span>
                        <span className="text-[11px] text-muted-foreground block leading-tight">
                          Daily hours are logged correctly, meet compliance rules, and are ready for submission.
                        </span>
                      </div>
                    </div>

                    {/* Amber block */}
                    <div className="p-3 bg-secondary/15 rounded-xl border border-border flex items-start gap-3">
                      <span className="w-8 h-8 rounded-lg bg-status-amber-bg border border-status-amber/30 text-status-amber flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                        🟡
                      </span>
                      <div className="space-y-0.5">
                        <span className="text-xs font-black uppercase text-foreground block">Warning Alert (Amber)</span>
                        <span className="text-[11px] text-muted-foreground block leading-tight">
                          Shifts containing minor warnings (e.g. working 12+ hours with no lunch break, or weekend work without active on-call status).
                        </span>
                      </div>
                    </div>

                    {/* Red block */}
                    <div className="p-3 bg-secondary/15 rounded-xl border border-border flex items-start gap-3">
                      <span className="w-8 h-8 rounded-lg bg-status-red-bg border border-status-red/30 text-status-red flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                        🔴
                      </span>
                      <div className="space-y-0.5">
                        <span className="text-xs font-black uppercase text-foreground block">Gap Detected (Red)</span>
                        <span className="text-[11px] text-muted-foreground block leading-tight">
                          Active week weekdays (Mon-Fri) that currently have **0 hours logged** but other days contain logs. Gaps must be filled to submit.
                        </span>
                      </div>
                    </div>

                    {/* Grey block */}
                    <div className="p-3 bg-secondary/15 rounded-xl border border-border flex items-start gap-3">
                      <span className="w-8 h-8 rounded-lg bg-secondary text-muted-foreground flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                        ⚪
                      </span>
                      <div className="space-y-0.5">
                        <span className="text-xs font-black uppercase text-foreground block">Inactive (Grey)</span>
                        <span className="text-[11px] text-muted-foreground block leading-tight">
                          Rest days, unworked weekend dates, or upcoming future calendar dates.
                        </span>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Lunch Break Deductions */}
                <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-1.5 h-4.5 bg-primary rounded-full" />
                    <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
                      Daily Lunch Break Deduction Guide
                    </h3>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-3 leading-relaxed">
                    <p>
                      Lunch breaks are now **decoupled from individual task entries** and managed globally at the day level. You no longer need to type in lunch durations for every single customer job logged.
                    </p>
                    <div className="p-4 bg-secondary/10 border border-border rounded-xl space-y-3">
                      <span className="text-xs font-black text-foreground uppercase tracking-wide block">How it works:</span>
                      <ul className="space-y-2 text-[11px] list-disc list-inside">
                        <li>Once you log task hours on a day, a **Daily Calculations Panel** will automatically slide in above your logs.</li>
                        <li>By default, every worked workday automatically applies a **1 Hour Lunch (1h Default)** unpaid deduction.</li>
                        <li>If you took a shorter lunch break, click **30m** to apply a 30-minute deduction.</li>
                        <li>If you did not take a lunch break (e.g. half-day duty), click **None** to subtract zero minutes.</li>
                        <li>The system instantly calculates your **Net Paid Hours** (`Total Task Hours - Lunch Deduction`), which is what you get paid for!</li>
                      </ul>
                    </div>
                    <div className="flex items-start gap-2 text-[11px] text-primary bg-primary/5 p-3 rounded-lg border border-primary/10">
                      <Clock className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>
                        **Note:** Daily lunches can be modified at any time prior to submitting your timesheet. Once a timesheet is submitted, your lunch deduction is locked in to guarantee payroll data integrity.
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column: Submission & Troubleshooting (Span 5) */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Submission Checklist */}
                <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-1.5 h-4.5 bg-primary rounded-full" />
                    <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
                      Weekly Submission & Deadlines
                    </h3>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-3 leading-relaxed">
                    <p>
                      At the end of each workweek, operators must lock and submit their timesheets for payroll review.
                    </p>
                    <div className="flex items-center justify-between p-3.5 bg-secondary/15 border border-border rounded-xl text-xs font-extrabold uppercase">
                      <span>Weekly Submit Deadline</span>
                      <span className="text-destructive font-black">Every Monday @ 09:00 AM</span>
                    </div>
                    <p>
                      The **Timesheet Submission Checklist** at the bottom of your sheet displays your active status. You can only click the submit button if:
                    </p>
                    <ol className="list-decimal list-inside text-[11px] space-y-1.5">
                      <li>You have logged at least one timesheet entry for the active week.</li>
                      <li>There are **no Red calendar blocks** (meaning no missing weekday logs).</li>
                    </ol>
                  </div>
                </div>

                {/* Troubleshooting & Error Guide */}
                <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-1.5 h-4.5 bg-primary rounded-full" />
                    <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
                      What to do if you get an Error or can't Submit?
                    </h3>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-4 leading-relaxed">
                    
                    {/* Error 1 */}
                    <div className="space-y-1">
                      <span className="text-xs font-black text-foreground block">
                        ❌ "Submit Timesheet" button is disabled/greyed out
                      </span>
                      <p className="text-[11px] text-muted-foreground leading-tight">
                        Check your calendar grid! If you see any **Red blocks**, you have a gap. Farm workers must account for all weekdays. If you had a rest day, sick leave, or holiday, log it under "Internal Duty / Till" or standard duty for that day so there are no empty gaps.
                      </p>
                    </div>

                    {/* Error 2 */}
                    <div className="space-y-1">
                      <span className="text-xs font-black text-foreground block">
                        ⚠️ Timesheet Warning Alerts (Amber Alerts)
                      </span>
                      <p className="text-[11px] text-muted-foreground leading-tight">
                        If you see a yellow card warning you of a compliance issue (e.g. working a long shift without lunch), **don't panic!** The system lets you save and submit entries even with alerts. The alert is just to notify you, and management will see your notes explaining the reason.
                      </p>
                    </div>

                    {/* Error 3 */}
                    <div className="space-y-1">
                      <span className="text-xs font-black text-foreground block">
                        📶 No Cellular Signal / Offline in Remote Fields
                      </span>
                      <p className="text-[11px] text-muted-foreground leading-tight">
                        FieldTime features a robust **Autosave Draft Engine**. As you fill out the daily form, your drafts are instantly cached locally in your browser. You can safely reload the page or close your browser, and your work will be waiting. Submit when you return to a stable connection!
                      </p>
                    </div>

                    {/* Info Alert */}
                    <div className="flex items-start gap-2 text-[11px] text-status-amber bg-status-amber-bg/15 p-3 rounded-lg border border-status-amber/20">
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-status-amber" />
                      <span>
                        **Need technical assistance?** Contact the Okapi & Co support desk, or notify your administrator Alice who can manually override, adjust, or unlock timesheets if needed.
                      </span>
                    </div>

                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

      </main>

      {/* Slide-out Time Entry Form Overlay */}
      {showForm && (
        <EntryForm
          selectedDate={selectedDate}
          machines={machines}
          editEntry={editEntry}
          onSubmit={handleTimeEntrySubmit}
          onClose={() => {
            setShowForm(false);
            setEditEntry(null);
          }}
          dailyLunchMinutes={dailyLunches.find(
            (l) => l.userId === activeStaffId && l.entryDate === selectedDate
          )?.lunchMinutes ?? 60}
          dailyOnCallActive={dailyOnCalls.some(
            (o) => o.userId === activeStaffId && o.entryDate === selectedDate && o.isOnCall
          )}
        />
      )}
    </div>
  );
}
