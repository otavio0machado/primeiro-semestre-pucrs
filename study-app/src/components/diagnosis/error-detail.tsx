"use client";

import { Badge } from "@/components/ui/badge";
import type { ErrorOccurrence, ErrorPattern } from "@/data/error-taxonomy";
import { getSeverityColor, getSeverityLabel, categoryLabels, getSubcategoryLabel } from "@/lib/error-diagnosis";

const recTypeIcons: Record<string, string> = {
  "review-topic": "📖",
  "practice": "✏️",
  "watch-video": "🎬",
  "read-material": "📄",
  "do-exercises": "🔢",
  "seek-tutor": "🧑‍🏫",
};

interface Props {
  occurrence: ErrorOccurrence;
  pattern: ErrorPattern;
  onClassifyWithAI: (occurrence: ErrorOccurrence) => void;
  aiLoading: boolean;
}

export function ErrorDetail({ occurrence, pattern, onClassifyWithAI, aiLoading }: Props) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-md border border-border-default bg-bg-surface p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={pattern.severity === "critical" ? "danger" : pattern.severity === "high" ? "warning" : "default"}>
              {categoryLabels[pattern.category]}
            </Badge>
            <Badge variant="outline">{getSubcategoryLabel(pattern.subcategory)}</Badge>
            <span className={`text-xs font-semibold ${getSeverityColor(pattern.severity)}`}>
              {getSeverityLabel(pattern.severity)}
            </span>
          </div>
          <span className="font-mono text-[10px] text-fg-muted">{occurrence.date}</span>
        </div>
        <h3 className="mt-2 text-base font-semibold text-fg-primary">{pattern.name}</h3>
        <p className="mt-1 text-sm text-fg-secondary">{pattern.description}</p>
      </div>

      {/* Exercício onde ocorreu */}
      <div className="rounded-md border border-border-default bg-bg-surface p-4">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-widest text-fg-muted">Ocorrência</h4>
        <div className="space-y-2">
          <div>
            <span className="text-[10px] text-fg-muted">Exercício:</span>
            <p className="text-sm text-fg-primary">{occurrence.exerciseStatement}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-sm border border-accent-danger/20 bg-accent-danger/5 p-2">
              <span className="text-[10px] text-accent-danger">Sua resposta</span>
              <p className="mt-0.5 font-mono text-sm text-fg-primary">{occurrence.studentAnswer}</p>
            </div>
            <div className="rounded-sm border border-accent-success/20 bg-accent-success/5 p-2">
              <span className="text-[10px] text-accent-success">Resposta correta</span>
              <p className="mt-0.5 font-mono text-sm text-fg-primary">{occurrence.correctAnswer}</p>
            </div>
          </div>
        </div>
      </div>

      {/* IA Explanation */}
      {occurrence.aiExplanation && (
        <div className="rounded-md border border-accent-primary/30 bg-accent-primary/5 p-4">
          <h4 className="mb-1 text-xs font-semibold uppercase tracking-widest text-accent-primary">
            Diagnóstico IA
          </h4>
          <p className="text-sm text-fg-secondary">{occurrence.aiExplanation}</p>
        </div>
      )}

      {/* Causa raiz */}
      <div className="rounded-md border border-border-default bg-bg-surface p-4">
        <h4 className="mb-1 text-xs font-semibold uppercase tracking-widest text-fg-muted">Causa Raiz</h4>
        <p className="text-sm text-fg-secondary">{pattern.rootCause}</p>
        {pattern.missingPrerequisites.length > 0 && (
          <div className="mt-2">
            <span className="text-[10px] text-fg-muted">Pré-requisitos faltantes:</span>
            <div className="mt-1 flex flex-wrap gap-1">
              {pattern.missingPrerequisites.map((p) => (
                <span key={p} className="rounded-sm bg-accent-danger/10 px-1.5 py-0.5 text-[10px] text-accent-danger">
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Exemplo catalogado */}
      <div className="rounded-md border border-border-default bg-bg-surface p-4">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-widest text-fg-muted">Exemplo Típico</h4>
        <div className="space-y-1.5 text-sm">
          <p className="text-fg-secondary"><span className="text-fg-muted">Exercício:</span> {pattern.example.exercise}</p>
          <p className="text-accent-danger"><span className="text-fg-muted">Erro comum:</span> {pattern.example.wrongAnswer}</p>
          <p className="text-accent-success"><span className="text-fg-muted">Correto:</span> {pattern.example.correctAnswer}</p>
          <p className="text-fg-tertiary italic"><span className="text-fg-muted">O aluno pensa:</span> "{pattern.example.studentReasoning}"</p>
        </div>
      </div>

      {/* Recomendações */}
      <div className="rounded-md border border-border-default bg-bg-surface p-4">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-widest text-fg-muted">Recomendações</h4>
        <div className="space-y-2">
          {pattern.recommendations.map((rec, i) => (
            <div key={i} className="flex gap-3 rounded-sm border border-border-subtle p-3">
              <span className="text-base">{recTypeIcons[rec.type] ?? "📌"}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-fg-primary">{rec.label}</span>
                  <Badge variant={rec.priority === 1 ? "danger" : rec.priority === 2 ? "warning" : "default"}>
                    P{rec.priority}
                  </Badge>
                  <span className="font-mono text-[10px] text-fg-muted">~{rec.estimatedMinutes}min</span>
                </div>
                <p className="mt-0.5 text-xs text-fg-tertiary">{rec.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Re-classify with AI */}
      <button
        onClick={() => onClassifyWithAI(occurrence)}
        disabled={aiLoading}
        className="w-full rounded-md border border-accent-primary bg-accent-primary/10 px-4 py-2.5 text-sm font-medium text-accent-primary transition-colors hover:bg-accent-primary/20 disabled:opacity-50"
      >
        {aiLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" />
            Reclassificando com IA...
          </span>
        ) : (
          "Reclassificar com IA"
        )}
      </button>
    </div>
  );
}
