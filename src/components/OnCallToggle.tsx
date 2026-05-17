"use client";

import React, { useState, useEffect } from "react";
import { Shield, ShieldAlert, Clock, Loader2 } from "lucide-react";

interface OnCallPeriod {
  id: string;
  startedAt: string;
  endedAt: string | null;
}

interface OnCallToggleProps {
  activePeriod: OnCallPeriod | null;
  onToggle: () => Promise<void>;
}

export default function OnCallToggle({ activePeriod, onToggle }: OnCallToggleProps) {
  const [loading, setLoading] = useState(false);
  const [elapsedTime, setElapsedTime] = useState("");

  const isActive = !!activePeriod;

  // Real-time active counter
  useEffect(() => {
    if (!isActive || !activePeriod) {
      setElapsedTime("");
      return;
    }

    const calculateElapsed = () => {
      const start = new Date(activePeriod.startedAt).getTime();
      const now = new Date().getTime();
      const diffMs = now - start;

      const diffSecs = Math.floor(diffMs / 1000);
      const hours = Math.floor(diffSecs / 3600);
      const minutes = Math.floor((diffSecs % 3600) / 60);
      const seconds = diffSecs % 60;

      const pad = (n: number) => n.toString().padStart(2, "0");
      setElapsedTime(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
    };

    calculateElapsed();
    const interval = setInterval(calculateElapsed, 1000);

    return () => clearInterval(interval);
  }, [isActive, activePeriod]);

  const handleToggle = async () => {
    setLoading(true);
    try {
      await onToggle();
    } catch (err) {
      console.error("Failed to toggle on-call duty status:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`p-4 rounded-2xl border transition-all duration-300 ${
        isActive
          ? "bg-status-green-bg border-status-green/35 text-status-green shadow-[0_0_15px_rgba(22,163,74,0.15)]"
          : "bg-card border-border text-foreground shadow-sm"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Left: Info & State details */}
        <div className="flex items-start gap-3">
          <div
            className={`p-2.5 rounded-xl shrink-0 ${
              isActive ? "bg-status-green/15" : "bg-secondary/40"
            }`}
          >
            {isActive ? (
              <Shield className="h-6 w-6 text-status-green animate-pulse" />
            ) : (
              <ShieldAlert className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <div className="space-y-0.5">
            <h4 className="text-sm font-black uppercase tracking-wider leading-none">
              {isActive ? "On-Call Premium Active" : "On-Call Logging"}
            </h4>
            <p className="text-xs text-muted-foreground">
              {isActive
                ? "Your standard hours logged during this window will be exported as on-call premium."
                : "Not currently on-call. Tap 'Go On Call' to begin premium tracking."}
            </p>
            {isActive && elapsedTime && (
              <div className="flex items-center gap-1 text-[11px] font-extrabold mt-1 text-status-green">
                <Clock className="h-3 w-3" />
                <span>Elapsed: {elapsedTime}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Large Action button */}
        <button
          type="button"
          onClick={handleToggle}
          disabled={loading}
          className={`tap-target min-w-[140px] px-6 py-3 font-extrabold rounded-xl border text-sm transition-all cursor-pointer shadow-md active:scale-95 disabled:opacity-50 ${
            isActive
              ? "bg-status-red text-destructive-foreground border-transparent hover:opacity-90"
              : "bg-primary text-primary-foreground border-transparent hover:opacity-90"
          }`}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isActive ? (
            "End On Call"
          ) : (
            "Go On Call"
          )}
        </button>
      </div>
    </div>
  );
}
