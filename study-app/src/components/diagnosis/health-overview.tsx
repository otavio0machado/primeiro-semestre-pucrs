"use client";

import { Badge } from "@/components/ui/badge";
import type { DiagnosticSummary } from "@/data/error-taxonomy";
import { getSeverityLabel, getSeverityColor } from "@/lib/error-diagnosis";

const trendLabels = { improving: "Melhorando", stable: "Estável", worsening: "Piorando" };
const trendColors = { improving: "text-accent-success", stable: "text-fg-tertiary", worsening: "text-accent-danger" };
const trendIcons = { improving: "↗", stable: "→", worsening: "↘" };

interface Props {
  summaries: DiagnosticSummary[];
}

export function HealthOverview({ summaries }: Props) {
  const totalErrors = summaries.reduce((s, d) => s + d.totalErrors, 0);
  const avgHealth = summaries.length > 0
    ? Math.round(summaries.reduce((s, d) => s + d.healthScore, 0) / summaries.length)
    : 100;

  return (
    <div className="grid grid-cols-[1fr_1fr] gap-4">
      {/* Global stats */}
      <div className="rounded-md border border-border-default bg-bg-surface p-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-fg-muted">Visão Geral</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-fg-muted">Saúde</span>
            <p className={`font-mono text-2xl font-bold ${avgHealth >= 70 ? "text-accent-success" : avgHealth >= 40 ? "text-accent-warning" : "text-accent-danger"}`}>
              {avgHealth}
            </p>
            <span className="text-[10px] text-fg-muted">de 100</span>
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-fg-muted">Erros registrados</span>
            <p className="font-mono text-2xl font-bold text-fg-primary">{totalErrors}</p>
          </div>
        </div>
      </div>

      {/* Per-discipline */}
      <div className="space-y-2">
        {summaries.map((summary) => (
          <div key={summary.disciplineId} className="rounded-md border border-border-default bg-bg-surface p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-fg-primary">{summary.disciplineName}</span>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold ${trendColors[summary.trend]}`}>
                  {trendIcons[summary.trend]} {trendLabels[summary.trend]}
                </span>
                <span className={`font-mono text-sm font-bold ${summary.healthScore >= 70 ? "text-accent-success" : summary.healthScore >= 40 ? "text-accent-warning" : "text-accent-danger"}`}>
                  {summary.healthScore}
                </span>
              </div>
            </div>
            <div className="mt-2 flex gap-2">
              {(["critical", "high", "medium", "low"] as const).map((sev) => (
                summary.bySeverity[sev] > 0 && (
                  <div key={sev} className="flex items-center gap-1">
                    <span className={`text-xs font-semibold ${getSeverityColor(sev)}`}>{summary.bySeverity[sev]}</span>
                    <span className="text-[10px] text-fg-muted">{getSeverityLabel(sev)}</span>
                  </div>
                )
              ))}
            </div>
            {/* Health bar */}
            <div className="mt-2 h-1.5 rounded-full bg-bg-tertiary">
              <div
                className={`h-full rounded-full transition-all ${summary.healthScore >= 70 ? "bg-accent-success" : summary.healthScore >= 40 ? "bg-accent-warning" : "bg-accent-danger"}`}
                style={{ width: `${summary.healthScore}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
