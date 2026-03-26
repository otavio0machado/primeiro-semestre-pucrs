"use client";

import { Badge } from "@/components/ui/badge";
import type { ErrorOccurrence } from "@/data/error-taxonomy";
import { getPattern, getSeverityColor, getSeverityLabel, categoryLabels, getSubcategoryLabel } from "@/lib/error-diagnosis";

interface Props {
  occurrences: ErrorOccurrence[];
  onSelect: (occurrence: ErrorOccurrence) => void;
  selectedId?: string;
}

export function ErrorFeed({ occurrences, onSelect, selectedId }: Props) {
  const sorted = [...occurrences].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="rounded-md border border-border-default bg-bg-surface">
      <div className="border-b border-border-default px-4 py-2">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-fg-muted">
          Histórico de Erros
        </h3>
      </div>
      <div className="divide-y divide-border-subtle">
        {sorted.map((occ) => {
          const pattern = getPattern(occ.patternId);
          if (!pattern) return null;

          return (
            <button
              key={occ.id}
              onClick={() => onSelect(occ)}
              className={`w-full px-4 py-3 text-left transition-colors hover:bg-bg-secondary ${
                selectedId === occ.id ? "bg-bg-secondary" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={pattern.severity === "critical" ? "danger" : pattern.severity === "high" ? "warning" : "default"}
                  >
                    {categoryLabels[pattern.category]}
                  </Badge>
                  <span className="text-xs text-fg-tertiary">{getSubcategoryLabel(pattern.subcategory)}</span>
                </div>
                <div className="flex items-center gap-2">
                  {occ.resolved && (
                    <span className="text-[10px] text-accent-success">✓ Resolvido</span>
                  )}
                  {occ.reviewed && !occ.resolved && (
                    <span className="text-[10px] text-fg-muted">Revisado</span>
                  )}
                  <span className="font-mono text-[10px] text-fg-muted">{occ.date}</span>
                </div>
              </div>
              <p className="mt-1 text-sm font-medium text-fg-primary">{pattern.name}</p>
              <p className="mt-0.5 text-xs text-fg-tertiary truncate">{occ.topicName}</p>
              {occ.confidence > 0 && (
                <span className="mt-1 inline-block text-[10px] text-fg-muted">
                  {occ.classifiedBy === "ai" ? "IA" : "Manual"} · {Math.round(occ.confidence * 100)}% confiança
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
