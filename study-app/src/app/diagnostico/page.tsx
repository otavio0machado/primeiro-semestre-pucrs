"use client";

import { useState, useMemo, useCallback } from "react";
import { HealthOverview } from "@/components/diagnosis/health-overview";
import { CategoryChart } from "@/components/diagnosis/category-chart";
import { ErrorFeed } from "@/components/diagnosis/error-feed";
import { ErrorDetail } from "@/components/diagnosis/error-detail";
import { mockOccurrences, type ErrorOccurrence } from "@/data/error-taxonomy";
import {
  buildDiagnosticSummary,
  getCategoryDistribution,
  getPattern,
  getTopRecommendations,
  getSubcategoryLabel,
} from "@/lib/error-diagnosis";
import { Badge } from "@/components/ui/badge";

type FilterDiscipline = "all" | "calculo-1" | "mat-discreta";
type FilterStatus = "all" | "unresolved" | "unreviewed" | "resolved";

export default function DiagnosticoPage() {
  const [filterDisc, setFilterDisc] = useState<FilterDiscipline>("all");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [selected, setSelected] = useState<ErrorOccurrence | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);

  // Filter occurrences
  const filtered = useMemo(() => {
    let occs = [...mockOccurrences];
    if (filterDisc !== "all") occs = occs.filter((o) => o.disciplineId === filterDisc);
    if (filterStatus === "unresolved") occs = occs.filter((o) => !o.resolved);
    if (filterStatus === "unreviewed") occs = occs.filter((o) => !o.reviewed);
    if (filterStatus === "resolved") occs = occs.filter((o) => o.resolved);
    return occs;
  }, [filterDisc, filterStatus]);

  // Summaries
  const summaries = useMemo(() => [
    buildDiagnosticSummary("calculo-1", "Cálculo I"),
    buildDiagnosticSummary("mat-discreta", "Mat. Discreta"),
  ], []);

  const distribution = useMemo(() => getCategoryDistribution(
    filterDisc === "all" ? mockOccurrences : mockOccurrences.filter((o) => o.disciplineId === filterDisc)
  ), [filterDisc]);

  const topRecs = useMemo(() => {
    if (filterDisc === "all") {
      return [
        ...getTopRecommendations("calculo-1", 3),
        ...getTopRecommendations("mat-discreta", 3),
      ].sort((a, b) => b.occurrenceCount - a.occurrenceCount).slice(0, 5);
    }
    return getTopRecommendations(filterDisc, 5);
  }, [filterDisc]);

  const selectedPattern = selected ? getPattern(selected.patternId) : null;

  const handleClassifyWithAI = useCallback(async (occ: ErrorOccurrence) => {
    setAiLoading(true);
    setAiResult(null);
    try {
      const res = await fetch("/api/ai/classify-error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseStatement: occ.exerciseStatement,
          correctAnswer: occ.correctAnswer,
          studentAnswer: occ.studentAnswer,
          topicName: occ.topicName,
          courseName: occ.disciplineId === "calculo-1" ? "Cálculo I" : "Mat. Discreta",
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        setAiResult(`Erro: ${err.error?.message ?? "Falha na classificação."}`);
      } else {
        const { data } = await res.json();
        setAiResult(
          `Classe: ${data.errorClass} (${Math.round(data.confidence * 100)}%)\n` +
          `Explicação: ${data.explanation}\n` +
          `Raciocínio provável: ${data.likelyReasoning}\n` +
          `Remediação: ${data.remediation}` +
          (data.missingPrerequisite ? `\nPré-req faltante: ${data.missingPrerequisite}` : "")
        );
      }
    } catch {
      setAiResult("Erro de rede. Verifique a conexão e a ANTHROPIC_API_KEY.");
    } finally {
      setAiLoading(false);
    }
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-fg-primary">Diagnóstico de Erros</h1>
        <div className="flex items-center gap-2">
          {([
            { v: "all", l: "Todas" },
            { v: "calculo-1", l: "Cálculo I" },
            { v: "mat-discreta", l: "Discreta" },
          ] as const).map((f) => (
            <button
              key={f.v}
              onClick={() => setFilterDisc(f.v)}
              className={`rounded-sm border px-2 py-0.5 text-xs transition-colors ${
                filterDisc === f.v
                  ? "border-accent-primary bg-accent-primary/10 text-accent-primary"
                  : "border-border-default text-fg-tertiary hover:text-fg-secondary"
              }`}
            >
              {f.l}
            </button>
          ))}
        </div>
      </div>

      {/* Health overview */}
      <HealthOverview summaries={summaries} />

      {/* Distribution + Recommendations row */}
      <div className="grid grid-cols-[1fr_1fr] gap-4">
        <CategoryChart data={distribution} />

        {/* Top recommendations */}
        <div className="rounded-md border border-border-default bg-bg-surface p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-fg-muted">
            Ações Prioritárias
          </h3>
          <div className="space-y-2">
            {topRecs.map((rec, i) => (
              <div key={i} className="flex items-start gap-3 rounded-sm border border-border-subtle p-2.5">
                <span className="mt-0.5 font-mono text-xs text-fg-muted">{i + 1}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-fg-primary">{rec.recommendation.label}</p>
                  <p className="text-xs text-fg-tertiary">{rec.pattern.name} · {rec.occurrenceCount}x</p>
                </div>
                <Badge variant={rec.recommendation.priority === 1 ? "danger" : "warning"}>
                  ~{rec.recommendation.estimatedMinutes}min
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Error feed + Detail */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-fg-tertiary">Filtrar:</span>
        {([
          { v: "all", l: "Todos" },
          { v: "unresolved", l: "Não resolvidos" },
          { v: "unreviewed", l: "Não revisados" },
          { v: "resolved", l: "Resolvidos" },
        ] as const).map((f) => (
          <button
            key={f.v}
            onClick={() => setFilterStatus(f.v)}
            className={`rounded-sm border px-2 py-0.5 text-xs transition-colors ${
              filterStatus === f.v
                ? "border-accent-primary bg-accent-primary/10 text-accent-primary"
                : "border-border-default text-fg-tertiary hover:text-fg-secondary"
            }`}
          >
            {f.l}
          </button>
        ))}
        <span className="ml-auto font-mono text-xs text-fg-muted">{filtered.length} erros</span>
      </div>

      <div className="grid grid-cols-[360px_1fr] gap-4">
        <ErrorFeed
          occurrences={filtered}
          onSelect={setSelected}
          selectedId={selected?.id}
        />

        <div>
          {selected && selectedPattern ? (
            <>
              <ErrorDetail
                occurrence={selected}
                pattern={selectedPattern}
                onClassifyWithAI={handleClassifyWithAI}
                aiLoading={aiLoading}
              />
              {aiResult && (
                <div className="mt-4 rounded-md border border-accent-primary/30 bg-accent-primary/5 p-4">
                  <h4 className="mb-1 text-xs font-semibold uppercase tracking-widest text-accent-primary">
                    Reclassificação IA
                  </h4>
                  <pre className="whitespace-pre-wrap font-mono text-xs text-fg-secondary">{aiResult}</pre>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-md border border-border-default bg-bg-surface p-8 text-center">
              <p className="text-sm text-fg-tertiary">Selecione um erro no histórico para ver o diagnóstico completo.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
