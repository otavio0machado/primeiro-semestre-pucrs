"use client";

import { useState } from "react";
import { MasteryDot } from "@/components/ui/mastery-dot";
import { ScoreDisplay } from "@/components/ui/score-display";
import { Badge } from "@/components/ui/badge";
import { mockTopicsCalc, mockTopicsMD } from "@/data/mock";
import type { MasteryLevel } from "@/data/mock";

const allTopics = [...mockTopicsCalc, ...mockTopicsMD];

type FilterMode = "all" | "calculo-1" | "mat-discreta";
type SortMode = "score-asc" | "score-desc" | "mastery" | "name";

const masteryOrder: Record<MasteryLevel, number> = {
  none: 0,
  exposed: 1,
  developing: 2,
  proficient: 3,
  mastered: 4,
};

export default function ExerciciosPage() {
  const [filter, setFilter] = useState<FilterMode>("all");
  const [sort, setSort] = useState<SortMode>("score-asc");

  const filtered = filter === "all" ? allTopics : allTopics.filter((t) => t.courseId === filter);

  const sorted = [...filtered].sort((a, b) => {
    switch (sort) {
      case "score-asc":
        return a.score - b.score;
      case "score-desc":
        return b.score - a.score;
      case "mastery":
        return masteryOrder[a.mastery] - masteryOrder[b.mastery];
      case "name":
        return a.name.localeCompare(b.name, "pt-BR");
      default:
        return 0;
    }
  });

  const totalAttempted = filtered.reduce((s, t) => s + t.exercisesAttempted, 0);
  const totalAvailable = filtered.reduce((s, t) => s + t.exercisesAvailable, 0);
  const avgScore = filtered.length > 0 ? filtered.reduce((s, t) => s + t.score, 0) / filtered.length : 0;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight text-fg-primary">Exercícios</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-md border border-border-default bg-bg-surface p-4">
          <span className="text-[10px] font-medium uppercase tracking-wider text-fg-muted">Total resolvidos</span>
          <p className="mt-1 font-mono text-lg font-semibold text-fg-primary">
            {totalAttempted}<span className="text-fg-tertiary">/{totalAvailable}</span>
          </p>
        </div>
        <div className="rounded-md border border-border-default bg-bg-surface p-4">
          <span className="text-[10px] font-medium uppercase tracking-wider text-fg-muted">Score médio</span>
          <p className="mt-1 font-mono text-lg font-semibold text-fg-primary">{avgScore.toFixed(2)}</p>
        </div>
        <div className="rounded-md border border-border-default bg-bg-surface p-4">
          <span className="text-[10px] font-medium uppercase tracking-wider text-fg-muted">Tópicos cobertos</span>
          <p className="mt-1 font-mono text-lg font-semibold text-fg-primary">
            {filtered.filter((t) => t.exercisesAttempted > 0).length}<span className="text-fg-tertiary">/{filtered.length}</span>
          </p>
        </div>
      </div>

      {/* Filters + Sort */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-fg-tertiary">Disciplina:</span>
          {([
            { value: "all", label: "Todas" },
            { value: "calculo-1", label: "Cálculo I" },
            { value: "mat-discreta", label: "Discreta" },
          ] as const).map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded-sm border px-2 py-0.5 text-xs transition-colors ${
                filter === f.value
                  ? "border-accent-primary bg-accent-primary/10 text-accent-primary"
                  : "border-border-default text-fg-tertiary hover:text-fg-secondary"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-fg-tertiary">Ordenar:</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
            className="rounded-sm border border-border-default bg-bg-surface px-2 py-0.5 text-xs text-fg-secondary outline-none"
          >
            <option value="score-asc">Score ↑</option>
            <option value="score-desc">Score ↓</option>
            <option value="mastery">Mastery</option>
            <option value="name">Nome</option>
          </select>
        </div>
      </div>

      {/* Topic list */}
      <div className="rounded-md border border-border-default bg-bg-surface">
        <div className="grid grid-cols-[1fr_100px_80px_60px_80px] gap-2 border-b border-border-default px-4 py-2 text-[10px] font-medium uppercase tracking-wider text-fg-muted">
          <span>Tópico</span>
          <span>Disciplina</span>
          <span>Mastery</span>
          <span className="text-right">Score</span>
          <span className="text-right">Exerc.</span>
        </div>
        {sorted.map((topic) => (
          <div
            key={topic.id}
            className="grid grid-cols-[1fr_100px_80px_60px_80px] gap-2 items-center border-b border-border-subtle px-4 py-2.5 last:border-b-0 hover:bg-bg-secondary transition-colors"
          >
            <div className="flex items-center gap-2">
              <MasteryDot level={topic.mastery} size="sm" />
              <span className="text-sm text-fg-secondary truncate">{topic.name}</span>
            </div>
            <span className="text-xs text-fg-tertiary truncate">{topic.courseName}</span>
            <Badge variant="outline">{topic.mastery}</Badge>
            <ScoreDisplay score={topic.score} className="text-right text-xs" />
            <span className="text-right font-mono text-xs text-fg-tertiary">
              {topic.exercisesAttempted}/{topic.exercisesAvailable}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
