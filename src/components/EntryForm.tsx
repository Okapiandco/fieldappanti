"use client";

import React, { useState, useEffect } from "react";
import { Plus, Minus, Check, AlertTriangle, Save, Loader2, RefreshCw } from "lucide-react";
import CustomerSearch from "./CustomerSearch";
import { timeEntryFormSchema, runBusinessRules, TimeEntryFormData } from "@/lib/validation";

interface Machine {
  id: string;
  name: string;
  type: string;
}

interface EntryFormProps {
  selectedDate: string; // YYYY-MM-DD
  machines: Machine[];
  editEntry: any | null; // Existing entry if editing
  onSubmit: (data: any) => Promise<void>;
  onClose: () => void;
  dailyLunchMinutes?: number;
  dailyOnCallActive?: boolean;
}

export default function EntryForm({
  selectedDate,
  machines,
  editEntry,
  onSubmit,
  onClose,
  dailyLunchMinutes = 60,
  dailyOnCallActive = false,
}: EntryFormProps) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [draftStatus, setDraftStatus] = useState<"saved" | "saving" | "idle">("idle");

  // Form State
  const [jobType, setJobType] = useState<"field_service" | "workshop" | "sales_visit" | "retail" | "on_call">("field_service");
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [machineId, setMachineId] = useState<string | null>("");
  const [customMachine, setCustomMachine] = useState("");
  const [showCustomMachine, setShowCustomMachine] = useState(false);
  const [jobNumber, setJobNumber] = useState("");
  const [hours, setHours] = useState<number>(0);
  const [miles, setMiles] = useState<number>(0);
  const [isOnCall, setIsOnCall] = useState<boolean>(false);
  const [notes, setNotes] = useState("");

  const DRAFT_KEY = `draft-entry-${selectedDate}`;

  // 1. Initial State Load (Edit vs New Draft)
  useEffect(() => {
    if (editEntry) {
      // Editing Mode
      setJobType(editEntry.jobType);
      setCustomerId(editEntry.customerId);
      setMachineId(editEntry.machineId || "");
      setCustomMachine(editEntry.customMachine || "");
      setShowCustomMachine(!!editEntry.customMachine);
      setJobNumber(editEntry.jobNumber || "");
      setHours(Number(editEntry.hours));
      setMiles(Number(editEntry.miles || 0));
      setIsOnCall(!!editEntry.isOnCall);
      setNotes(editEntry.notes || "");
    } else {
      // Create Mode: Check if there's a locally saved draft first!
      const savedDraft = localStorage.getItem(DRAFT_KEY);
      if (savedDraft) {
        try {
          const draft: TimeEntryFormData = JSON.parse(savedDraft);
          setJobType(draft.jobType);
          setCustomerId(draft.customerId || null);
          setMachineId(draft.machineId || "");
          setCustomMachine(draft.customMachine || "");
          setShowCustomMachine(!!draft.customMachine);
          setJobNumber(draft.jobNumber || "");
          setHours(Number(draft.hours));
          setMiles(Number(draft.miles || 0));
          setIsOnCall(!!draft.isOnCall);
          setNotes(draft.notes || "");
          setDraftStatus("saved");
        } catch (e) {
          console.error("Failed to parse draft from localStorage", e);
        }
      } else {
        // Defaults for brand new entry
        setJobType("field_service");
        setCustomerId(null);
        setMachineId("");
        setCustomMachine("");
        setShowCustomMachine(false);
        setJobNumber("");
        setHours(0);
        setMiles(0);
        setIsOnCall(false);
        setNotes("");
      }
    }
  }, [editEntry, selectedDate]);

  // 2. Offline Draft Autosave (Triggered on state changes in Create Mode)
  useEffect(() => {
    if (editEntry) return; // Don't autosave draft when editing an existing published entry

    setDraftStatus("saving");
    const timer = setTimeout(() => {
      const draftData: TimeEntryFormData = {
        entryDate: selectedDate,
        jobType,
        customerId,
        machineId: machineId || null,
        customMachine: customMachine || null,
        jobNumber: jobNumber || null,
        hours,
        miles,
        isOnCall,
        notes: notes || null,
      };
      
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
      setDraftStatus("saved");
    }, 400); // Debounce writing to disk

    return () => clearTimeout(timer);
  }, [jobType, customerId, machineId, customMachine, jobNumber, hours, miles, isOnCall, notes, selectedDate, editEntry]);

  // 3. Easy Hours click increments (Mobile friendly)
  const adjustHours = (amount: number) => {
    setHours((prev) => {
      const val = Math.max(0, Math.min(24, prev + amount));
      return Number(val.toFixed(2));
    });
  };

  // 4. Job Type specific rules (auto-fill / auto-reset variables)
  const handleJobTypeChange = (type: any) => {
    setJobType(type);
    if (type === "retail") {
      setCustomerId(null);
      setJobNumber("");
      setMachineId("");
      setIsOnCall(false);
    } else if (type === "on_call") {
      setIsOnCall(true);
      setCustomerId(null);
      setJobNumber("");
      setMachineId("");
    }
  };

  const handleMachineChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setMachineId(val);
    if (val === "other") {
      setShowCustomMachine(true);
    } else {
      setShowCustomMachine(false);
      setCustomMachine("");
    }
  };

  // 5. Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const payload = {
      entryDate: selectedDate,
      jobType,
      customerId,
      machineId: machineId && machineId !== "other" ? machineId : null,
      customMachine: showCustomMachine ? customMachine : null,
      jobNumber: jobNumber || null,
      hours,
      miles,
      isOnCall,
      notes: notes || null,
    };

    // Client-side Zod validation
    const parsed = timeEntryFormSchema.safeParse(payload);
    if (!parsed.success) {
      const errorMap = parsed.error.flatten().fieldErrors;
      const firstError = Object.values(errorMap)[0]?.[0];
      setErrorMsg(firstError || "Invalid form values");
      setLoading(false);
      return;
    }

    try {
      await onSubmit(payload);
      // Clean up localStorage draft on successful database sync
      localStorage.removeItem(DRAFT_KEY);
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to save entry. Check network connection.");
    } finally {
      setLoading(false);
    }
  };

  // Run business rules locally for interactive Warning / Flag alerts
  const localValidation = runBusinessRules({
    entryDate: selectedDate,
    jobType,
    customerId,
    machineId: machineId || null,
    customMachine: customMachine || null,
    jobNumber: jobNumber || null,
    hours,
    miles,
    isOnCall,
    notes,
  }, [], dailyLunchMinutes, dailyOnCallActive);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg glass rounded-2xl shadow-2xl border border-border flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-secondary/20">
          <div>
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              {editEntry ? "Edit Time Entry" : "Log Daily Hours"}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Logging for <span className="font-semibold text-primary">{selectedDate}</span>
            </p>
          </div>
          
          {/* Offline Draft Autosave badge */}
          {!editEntry && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
              {draftStatus === "saving" ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Saving draft...</span>
                </>
              ) : (
                <>
                  <Check className="h-3 w-3" />
                  <span>Autosaved offline</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Job Type Selector (Huge finger targets) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Job / Shift Type
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 sm:gap-1.5">
              {[
                { type: "field_service", label: "Field Service" },
                { type: "workshop", label: "Workshop" },
                { type: "sales_visit", label: "Sales Visit" },
                { type: "retail", label: "Till / Retail" },
                { type: "on_call", label: "On Call" },
              ].map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => handleJobTypeChange(item.type as any)}
                  className={`tap-target px-2.5 py-2 text-xs font-bold rounded-lg border text-center flex flex-col justify-center leading-tight transition-all cursor-pointer ${
                    jobType === item.type
                      ? "bg-primary border-transparent text-primary-foreground shadow-md scale-102"
                      : "bg-card border-border text-foreground hover:bg-secondary/35"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Customer Search & Job Number (Conditional) */}
          {jobType !== "retail" && jobType !== "on_call" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Customer search */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Customer Lookup
                </label>
                <CustomerSearch
                  selectedCustomerId={customerId}
                  onSelect={(c) => {
                    setCustomerId(c?.id || null);
                    setCustomerName(c?.name || "");
                  }}
                />
              </div>

              {/* Job number input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex justify-between">
                  <span>Job Number</span>
                  {(jobType === "field_service" || jobType === "workshop") && (
                    <span className="text-[10px] text-destructive lowercase font-semibold">Required</span>
                  )}
                </label>
                <input
                  type="text"
                  value={jobNumber}
                  onChange={(e) => setJobNumber(e.target.value)}
                  placeholder="e.g. JB-2026-041"
                  className="w-full px-3 py-3 tap-target rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm placeholder:text-muted-foreground"
                />
              </div>
            </div>
          )}

          {/* Machine Selection (Conditional) */}
          {jobType !== "retail" && jobType !== "on_call" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Machine / Equipment
                </label>
                <select
                  value={machineId || ""}
                  onChange={handleMachineChange}
                  className="w-full px-3 py-3 tap-target rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm cursor-pointer"
                >
                  <option value="">-- No machine used --</option>
                  {machines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                  <option value="other">⚠️ Other / Custom Equipment</option>
                </select>
              </div>

              {showCustomMachine && (
                <div className="space-y-1.5 animate-in slide-in-from-top-3 duration-200">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Custom Machine Name
                  </label>
                  <input
                    type="text"
                    value={customMachine}
                    onChange={(e) => setCustomMachine(e.target.value)}
                    placeholder="Enter brand & model..."
                    className="w-full px-3 py-3 tap-target rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm placeholder:text-muted-foreground"
                  />
                </div>
              )}
            </div>
          )}

          {/* Stepper Hours Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex justify-between">
              <span>Hours Logged</span>
              <span className="font-extrabold text-primary text-sm">{hours} Hours</span>
            </label>
            <div className="flex items-center gap-2 max-w-[280px] mx-auto w-full">
              <button
                type="button"
                onClick={() => adjustHours(-0.5)}
                className="tap-target h-12 w-12 rounded-xl border border-border bg-card text-foreground font-black hover:bg-secondary/40 flex items-center justify-center cursor-pointer active:scale-95 transition-all text-base"
              >
                ▼
              </button>
              
              <div className="flex-1 relative">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  value={hours}
                  onChange={(e) => setHours(Math.max(0, Math.min(24, Number(e.target.value) || 0)))}
                  className="w-full text-center font-extrabold text-lg py-3 rounded-xl border border-border bg-card text-foreground focus:ring-2 focus:ring-primary outline-none"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">
                  hrs
                </span>
              </div>

              <button
                type="button"
                onClick={() => adjustHours(0.5)}
                className="tap-target h-12 w-12 rounded-xl border border-border bg-card text-foreground font-black hover:bg-secondary/40 flex items-center justify-center cursor-pointer active:scale-95 transition-all text-base"
              >
                ▲
              </button>
            </div>
          </div>

          {/* Mileage & Lunch selection */}
          {/* Mileage */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Miles Traveled
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                value={miles}
                onChange={(e) => setMiles(Math.max(0, Number(e.target.value) || 0))}
                className="w-full px-3 py-3 tap-target rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                Miles
              </span>
            </div>
          </div>

          {/* Notes Section */}
          <div className="grid grid-cols-1 gap-4">
            {/* Notes textarea */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Job Notes / Details
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="List fields worked, crop types, repairs made..."
                className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* Validation warnings and flags logs */}
          {(!localValidation.isValid || localValidation.warnings.length > 0) && (
            <div className="p-4 bg-status-amber-bg/50 border border-status-amber/20 rounded-xl space-y-2 animate-in slide-in-from-bottom-3 duration-200">
              <span className="text-xs font-bold uppercase tracking-wider text-status-amber flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" /> Anomaly & Validation Log
              </span>
              
              {/* Warnings (Non-blocking) */}
              {localValidation.warnings.map((w, idx) => (
                <p key={`w-${idx}`} className="text-xs text-secondary-foreground pl-5 relative before:absolute before:left-1.5 before:top-1.5 before:w-1.5 before:h-1.5 before:rounded-full before:bg-status-amber">
                  {w}
                </p>
              ))}

              {/* Flags (Requires acknowledgment/blocking) */}
              {localValidation.flags.map((f, idx) => (
                <p key={`f-${idx}`} className="text-xs text-destructive pl-5 relative before:absolute before:left-1.5 before:top-1.5 before:w-1.5 before:h-1.5 before:rounded-full before:bg-status-red font-semibold">
                  {f}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-border flex gap-3 bg-secondary/10">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 tap-target rounded-lg border border-border text-foreground hover:bg-secondary/40 font-bold text-sm cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 tap-target rounded-lg bg-primary text-primary-foreground hover:opacity-90 font-bold text-sm cursor-pointer flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{editEntry ? "Update Entry" : "Save Entry"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
