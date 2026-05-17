"use client";

import React from "react";
import { AlertCircle, CheckCircle, Info, HelpCircle } from "lucide-react";

interface TimeEntry {
  id: string;
  entryDate: string;
  hours: number | string;
  status: string;
  flagReason: string | null;
  jobType: string;
}

interface WeekGridProps {
  weekCommencing: string; // YYYY-MM-DD (Monday)
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  entries: TimeEntry[];
}

export default function WeekGrid({
  weekCommencing,
  selectedDate,
  onSelectDate,
  entries,
}: WeekGridProps) {
  if (!weekCommencing) return null;

  // Generate the 7 days of the week starting from Monday
  const getWeekDates = () => {
    const dates = [];
    const baseDate = new Date(weekCommencing);
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      dates.push({
        isoString: d.toISOString().split("T")[0],
        dayName: d.toLocaleDateString("en-US", { weekday: "short" }), // Mon, Tue...
        dayNumber: d.getDate(),
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
        isToday: d.toISOString().split("T")[0] === new Date().toISOString().split("T")[0],
        isFuture: d > new Date(),
      });
    }
    return dates;
  };

  const weekDays = getWeekDates();

  // Check if user has logged *any* hours this week to determine if empty days are actual "gaps"
  const hasLoggedThisWeek = entries.some((e) => Number(e.hours) > 0);

  return (
    <div className="grid grid-cols-7 gap-2 w-full">
      {weekDays.map((day) => {
        const dayEntries = entries.filter((e) => e.entryDate === day.isoString);
        const dayHours = dayEntries.reduce((sum, e) => sum + Number(e.hours), 0);
        
        const isSelected = selectedDate === day.isoString;
        
        // Determine day traffic light status
        let status: "green" | "amber" | "red" | "grey" = "grey";
        let statusIcon = null;

        if (dayHours > 0) {
          const hasFlags = dayEntries.some((e) => e.status === "flagged" || e.flagReason);
          if (hasFlags) {
            status = "amber";
            statusIcon = <AlertCircle className="h-3.5 w-3.5 text-status-amber fill-status-amber-bg" />;
          } else {
            status = "green";
            statusIcon = <CheckCircle className="h-3.5 w-3.5 text-status-green fill-status-green-bg" />;
          }
        } else if (!day.isFuture && !day.isWeekend && hasLoggedThisWeek) {
          // It's a past/present weekday, 0 hours logged, and the user is active this week -> Gap!
          status = "red";
          statusIcon = <HelpCircle className="h-3.5 w-3.5 text-status-red fill-status-red-bg" />;
        }

        // Status CSS mapping
        const statusClasses = {
          green: "bg-status-green-bg border-status-green/30 text-status-green hover:border-status-green",
          amber: "bg-status-amber-bg border-status-amber/30 text-status-amber hover:border-status-amber animate-pulse-subtle",
          red: "bg-status-red-bg border-status-red/30 text-status-red hover:border-status-red",
          grey: "bg-status-grey-bg border-status-grey/30 text-muted-foreground hover:border-border",
        };

        return (
          <button
            key={day.isoString}
            type="button"
            onClick={() => onSelectDate(day.isoString)}
            className={`tap-target flex flex-col items-center justify-between p-2 pb-2.5 rounded-xl border transition-all cursor-pointer ${
              statusClasses[status]
            } ${
              isSelected
                ? "ring-3 ring-primary ring-offset-2 border-transparent scale-102 shadow-md"
                : "shadow-sm hover:scale-[1.01]"
            }`}
          >
            {/* Day Name */}
            <span className="text-[10px] uppercase font-bold tracking-wider opacity-85">
              {day.dayName}
            </span>

            {/* Date Number */}
            <span className={`text-base font-extrabold my-0.5 ${isSelected ? "text-foreground" : ""}`}>
              {day.dayNumber}
            </span>

            {/* Status indicators */}
            <div className="flex items-center gap-0.5 mt-0.5 min-h-[16px]">
              {statusIcon ? (
                statusIcon
              ) : (
                <span className="text-[10px] font-black opacity-75">
                  {dayHours > 0 ? `${dayHours}h` : "—"}
                </span>
              )}
            </div>

            {/* Sub text showing hours inside tooltip or tiny print if selected */}
            {dayHours > 0 && statusIcon && (
              <span className="text-[9px] font-extrabold mt-0.5">
                {dayHours}h
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
