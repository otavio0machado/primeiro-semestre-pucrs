"use client";

import { useState } from "react";

interface CourseGrade {
  courseId: string;
  courseName: string;
}

function GradeInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <label className="text-[10px] font-medium uppercase tracking-wider text-fg-muted">
        {label}
      </label>
      <input
        type="number"
        min="0"
        max="10"
        step="0.1"
        placeholder="—"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-14 rounded-sm border border-border-default bg-bg-primary px-2 py-1 font-mono text-sm text-fg-primary placeholder:text-fg-muted focus:border-border-focus focus:outline-none"
      />
    </div>
  );
}

function CourseSimulator({ courseName }: CourseGrade) {
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [p3, setP3] = useState("");
  const [mt, setMt] = useState("");

  const vals = [p1, p2, p3, mt].map((v) => (v ? parseFloat(v) : null));
  const allFilled = vals.every((v) => v !== null && !isNaN(v!));
  const g1 = allFilled
    ? ((vals[0]! + vals[1]! + vals[2]! + vals[3]!) / 4).toFixed(1)
    : "—";
  const g1Num = allFilled ? parseFloat(g1) : null;

  return (
    <div className="flex-1">
      <p className="mb-2 text-xs font-medium text-fg-secondary">{courseName}</p>
      <div className="flex items-end gap-2">
        <GradeInput label="P1" value={p1} onChange={setP1} />
        <GradeInput label="P2" value={p2} onChange={setP2} />
        <GradeInput label="P3" value={p3} onChange={setP3} />
        <GradeInput label="MT" value={mt} onChange={setMt} />
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-medium uppercase tracking-wider text-fg-muted">
            G1
          </label>
          <span className="flex h-[30px] w-14 items-center font-mono text-sm font-semibold text-fg-primary">
            {g1}
          </span>
        </div>
      </div>
      {/* Threshold bar */}
      <div className="relative mt-2 h-1.5 w-full rounded-none bg-bg-tertiary">
        {g1Num !== null && (
          <div
            className={`absolute left-0 top-0 h-full rounded-none ${g1Num >= 6 ? "bg-accent-success" : "bg-accent-danger"}`}
            style={{ width: `${Math.min(100, (g1Num / 10) * 100)}%` }}
          />
        )}
        {/* 6.0 threshold marker */}
        <div
          className="absolute top-0 h-full w-px bg-fg-muted"
          style={{ left: "60%" }}
        />
        <span
          className="absolute -bottom-4 text-[10px] font-mono text-fg-muted"
          style={{ left: "60%", transform: "translateX(-50%)" }}
        >
          6.0
        </span>
      </div>
    </div>
  );
}

export function GradeSimulator() {
  return (
    <div className="rounded-md border border-border-default bg-bg-surface p-4">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-fg-muted">
        Simulação de Notas
      </h3>
      <div className="flex gap-8">
        <CourseSimulator courseId="calculo-1" courseName="Cálculo I" />
        <CourseSimulator courseId="mat-discreta" courseName="Mat. Discreta" />
      </div>
    </div>
  );
}
