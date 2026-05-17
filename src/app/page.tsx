import React from "react";
import Link from "next/link";
import { Clock, Shield, CheckCircle, Smartphone, Database, MailCheck, FileSpreadsheet } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      {/* Dynamic Header */}
      <header className="sticky top-0 z-30 w-full glass border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary text-primary-foreground shadow-md">
              <Clock className="h-5 w-5" />
            </div>
            <span className="text-sm font-black tracking-wider uppercase">
              FieldTime
            </span>
          </div>

          <Link
            href="/dashboard"
            className="tap-target px-4 py-2 text-xs font-black uppercase tracking-wider bg-primary text-primary-foreground rounded-xl shadow-md hover:opacity-90 transition-opacity flex items-center justify-center"
          >
            Go To Portal
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative flex-1 flex flex-col items-center justify-center py-20 px-4 text-center max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
        
        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
          <Smartphone className="h-4 w-4" />
          <span>Agricultural Business Time Management</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
          Eliminate Timesheet Gymnastics. <br />
          <span className="bg-gradient-to-r from-primary to-green-600 bg-clip-text text-transparent">
            Log Hours Directly in the Field.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
          The purpose-built time, mileage, and equipment logging web application designed for agricultural staff. Works 100% offline in poor cellular coverage areas, flags entry errors automatically, and generates payroll spreadsheets with one click.
        </p>

        {/* Call to Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center w-full max-w-sm mx-auto">
          <Link
            href="/dashboard"
            className="flex-1 tap-target py-3.5 rounded-xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg hover:opacity-90 active:scale-95 transition-transform"
          >
            <span>Go to Staff Dashboard</span>
          </Link>
        </div>

        {/* Mockup Preview container */}
        <div className="w-full pt-10 animate-in fade-in zoom-in-95 duration-700 delay-200">
          <div className="relative mx-auto max-w-md p-2 bg-zinc-200 dark:bg-zinc-800 rounded-3xl shadow-2xl border border-border/80">
            <div className="bg-background rounded-2xl p-4 text-left border border-border space-y-4">
              
              {/* Fake dashboard headers */}
              <div className="flex justify-between items-center pb-3 border-b border-border">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Timesheet Overview</span>
                <span className="text-[10px] font-black uppercase bg-status-green-bg text-status-green border border-status-green/20 px-2 py-0.5 rounded-full">
                  Week Active
                </span>
              </div>

              {/* Fake week grid */}
              <div className="grid grid-cols-7 gap-1">
                {[
                  { d: "Mon", h: "8.5h", s: "bg-status-green-bg border-status-green/30 text-status-green" },
                  { d: "Tue", h: "9.0h", s: "bg-status-green-bg border-status-green/30 text-status-green" },
                  { d: "Wed", h: "7.5h", s: "bg-status-green-bg border-status-green/30 text-status-green" },
                  { d: "Thu", h: "⚠️", s: "bg-status-amber-bg border-status-amber/30 text-status-amber animate-pulse" },
                  { d: "Fri", h: "—", s: "bg-status-red-bg border-status-red/30 text-status-red" },
                  { d: "Sat", h: "—", s: "bg-status-grey-bg text-muted-foreground" },
                  { d: "Sun", h: "—", s: "bg-status-grey-bg text-muted-foreground" },
                ].map((item, idx) => (
                  <div key={idx} className={`p-1.5 rounded-lg border text-center text-[9px] flex flex-col ${item.s}`}>
                    <span className="font-bold uppercase opacity-80">{item.d}</span>
                    <span className="font-extrabold mt-1">{item.h}</span>
                  </div>
                ))}
              </div>

              {/* Fake Warning banner */}
              <div className="p-3 bg-status-amber-bg border border-status-amber/20 rounded-xl flex gap-2 text-[10px] text-secondary-foreground leading-tight">
                <span className="text-status-amber font-extrabold text-base leading-none">⚠️</span>
                <div>
                  <span className="font-bold text-foreground">Gap Detected & Validation Alert:</span>
                  <p className="mt-0.5 opacity-85">Friday has 0 hours logged (Weekday Gap). Thursday has missing Job Number.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Grid Highlights Section */}
      <section className="bg-secondary/15 py-16 px-4 border-t border-border">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-wide">
              Flagship Agricultural Features
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              Optimized for high-speed use on remote farms by operators who are not tech-savvy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Database,
                title: "Offline-First Draft Autosave",
                desc: "Never lose logged hours. The entry form automatically auto-saves draft progress to your device storage and syncs once signal is restored.",
              },
              {
                icon: Shield,
                title: "Automatic Anomaly Validation",
                desc: "Catches mistakes before payroll. Instantly flags 16+ hour days, missing job numbers for technical duties, weekend logs, and weekday gaps.",
              },
              {
                icon: FileSpreadsheet,
                title: "1-Click HR Payroll Export",
                desc: "No more copy-pasting entries line-by-line. Management can download an HR-compatible CSV containing formatted time, miles, and lunch hours.",
              },
            ].map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div key={idx} className="p-5 bg-card border border-border rounded-2xl shadow-sm space-y-3">
                  <div className="p-2.5 bg-primary/10 text-primary w-fit rounded-xl">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-wider">{feat.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-6 border-t border-border text-center text-xs text-muted-foreground bg-card">
        <p>© 2026 FieldTime Agricultural Management Services. All Rights Reserved. Built with pride by Okapi & Co.</p>
      </footer>
    </div>
  );
}
