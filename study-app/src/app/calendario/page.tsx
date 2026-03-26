"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { mockExams } from "@/data/mock";

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

interface CalendarEvent {
  date: string;
  label: string;
  type: "exam" | "deadline" | "class";
  course: string;
}

const events: CalendarEvent[] = [
  ...mockExams.map((e) => ({ date: e.date, label: e.name, type: "exam" as const, course: e.courseName })),
  { date: "2026-04-01", label: "Entrega T2 — Discreta", type: "deadline", course: "Mat. Discreta" },
  { date: "2026-04-10", label: "Entrega Lista 2", type: "deadline", course: "Cálculo I" },
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function formatMonth(year: number, month: number) {
  return new Date(year, month).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function daysBetween(a: string, b: string) {
  return Math.ceil((new Date(a).getTime() - new Date(b).getTime()) / 86400000);
}

const typeColors: Record<string, string> = {
  exam: "bg-accent-danger/20 text-accent-danger border-accent-danger/30",
  deadline: "bg-accent-warning/20 text-accent-warning border-accent-warning/30",
  class: "bg-accent-primary/20 text-accent-primary border-accent-primary/30",
};

export default function CalendarioPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const todayStr = today.toISOString().split("T")[0];

  const monthEvents = events.filter((e) => {
    const d = new Date(e.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const prev = () => {
    if (month === 0) { setYear(year - 1); setMonth(11); }
    else setMonth(month - 1);
  };
  const next = () => {
    if (month === 11) { setYear(year + 1); setMonth(0); }
    else setMonth(month + 1);
  };

  // Build grid cells
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight text-fg-primary">Calendário</h1>

      {/* Month nav */}
      <div className="flex items-center justify-between">
        <button onClick={prev} className="rounded-md border border-border-default px-3 py-1 text-xs text-fg-tertiary hover:text-fg-secondary transition-colors">
          ← Anterior
        </button>
        <span className="text-sm font-semibold capitalize text-fg-primary">{formatMonth(year, month)}</span>
        <button onClick={next} className="rounded-md border border-border-default px-3 py-1 text-xs text-fg-tertiary hover:text-fg-secondary transition-colors">
          Próximo →
        </button>
      </div>

      {/* Calendar grid */}
      <div className="rounded-md border border-border-default bg-bg-surface">
        <div className="grid grid-cols-7 border-b border-border-default">
          {DAYS.map((d) => (
            <div key={d} className="py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            const dateStr = day ? `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` : "";
            const dayEvents = day ? monthEvents.filter((e) => e.date === dateStr) : [];
            const isToday = dateStr === todayStr;

            return (
              <div
                key={i}
                className={`min-h-[80px] border-b border-r border-border-subtle p-1.5 ${
                  !day ? "bg-bg-primary" : "bg-bg-surface"
                } ${isToday ? "ring-1 ring-inset ring-accent-primary/40" : ""}`}
              >
                {day && (
                  <>
                    <span className={`font-mono text-xs ${isToday ? "font-bold text-accent-primary" : "text-fg-tertiary"}`}>
                      {day}
                    </span>
                    <div className="mt-0.5 space-y-0.5">
                      {dayEvents.map((ev, j) => (
                        <div
                          key={j}
                          className={`rounded-sm border px-1 py-0.5 text-[9px] leading-tight truncate ${typeColors[ev.type]}`}
                        >
                          {ev.label}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming events */}
      <div className="rounded-md border border-border-default bg-bg-surface p-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-fg-muted">Próximos eventos</h3>
        <div className="space-y-2">
          {events
            .filter((e) => daysBetween(e.date, todayStr) >= 0)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map((ev, i) => {
              const days = daysBetween(ev.date, todayStr);
              return (
                <div key={i} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-3">
                    <Badge variant={ev.type === "exam" ? "danger" : "warning"}>
                      {ev.type}
                    </Badge>
                    <span className="text-sm text-fg-secondary">{ev.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-fg-tertiary">{ev.course}</span>
                    <span className="font-mono text-xs text-fg-muted">
                      {days === 0 ? "HOJE" : days === 1 ? "amanhã" : `em ${days}d`}
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
