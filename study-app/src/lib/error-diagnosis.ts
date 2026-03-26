// ============================================================
// ERROR DIAGNOSIS ENGINE — Análise, agregação e recomendações
// ============================================================

import {
  errorPatterns,
  mockOccurrences,
  type ErrorCategory,
  type Severity,
  type ErrorPattern,
  type ErrorOccurrence,
  type DiagnosticSummary,
  type Recommendation,
  type Subcategory,
} from "@/data/error-taxonomy";

// ── Lookups ──

const patternMap = new Map(errorPatterns.map((p) => [p.id, p]));

export function getPattern(id: string): ErrorPattern | undefined {
  return patternMap.get(id);
}

export function getPatternsForDiscipline(disciplineId: string): ErrorPattern[] {
  return errorPatterns.filter((p) => p.disciplineId === disciplineId);
}

export function getPatternsForCategory(category: ErrorCategory): ErrorPattern[] {
  return errorPatterns.filter((p) => p.category === category);
}

export function getPatternsForSubcategory(sub: Subcategory): ErrorPattern[] {
  return errorPatterns.filter((p) => p.subcategory === sub);
}

// ── Ocorrências ──

export function getOccurrencesForDiscipline(disciplineId: string, occurrences: ErrorOccurrence[] = mockOccurrences): ErrorOccurrence[] {
  return occurrences.filter((o) => o.disciplineId === disciplineId);
}

export function getUnresolvedOccurrences(occurrences: ErrorOccurrence[] = mockOccurrences): ErrorOccurrence[] {
  return occurrences.filter((o) => !o.resolved);
}

export function getUnreviewedOccurrences(occurrences: ErrorOccurrence[] = mockOccurrences): ErrorOccurrence[] {
  return occurrences.filter((o) => !o.reviewed);
}

// ── Agregação ──

export function buildDiagnosticSummary(
  disciplineId: string,
  disciplineName: string,
  occurrences: ErrorOccurrence[] = mockOccurrences
): DiagnosticSummary {
  const discOccs = occurrences.filter((o) => o.disciplineId === disciplineId);

  // Por categoria
  const byCategory: Record<ErrorCategory, number> = {
    conceptual: 0, algebraic: 0, logical: 0, interpretation: 0, formalization: 0,
  };
  // Por subcategoria
  const bySubcategory: Record<string, number> = {};
  // Por severidade
  const bySeverity: Record<Severity, number> = {
    low: 0, medium: 0, high: 0, critical: 0,
  };

  const patternCounts: Record<string, { count: number; lastDate: string }> = {};

  for (const occ of discOccs) {
    const pattern = patternMap.get(occ.patternId);
    if (pattern) {
      byCategory[pattern.category]++;
      bySubcategory[pattern.subcategory] = (bySubcategory[pattern.subcategory] ?? 0) + 1;
      bySeverity[pattern.severity]++;

      if (!patternCounts[occ.patternId]) {
        patternCounts[occ.patternId] = { count: 0, lastDate: occ.date };
      }
      patternCounts[occ.patternId].count++;
      if (occ.date > patternCounts[occ.patternId].lastDate) {
        patternCounts[occ.patternId].lastDate = occ.date;
      }
    }
  }

  const topPatterns = Object.entries(patternCounts)
    .map(([patternId, data]) => ({ patternId, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Trend: simples — se erros recentes > erros antigos, piorando
  const sorted = [...discOccs].sort((a, b) => a.date.localeCompare(b.date));
  const half = Math.floor(sorted.length / 2);
  const firstHalf = sorted.slice(0, half).length;
  const secondHalf = sorted.slice(half).length;
  const resolvedCount = discOccs.filter((o) => o.resolved).length;
  const trend: "improving" | "stable" | "worsening" =
    resolvedCount > discOccs.length * 0.5 ? "improving" :
    secondHalf > firstHalf * 1.3 ? "worsening" : "stable";

  // Health score: 100 - (erros_ativos * peso_severidade)
  const activeErrors = discOccs.filter((o) => !o.resolved);
  const severityWeight = { low: 2, medium: 5, high: 10, critical: 20 };
  const penalty = activeErrors.reduce((sum, o) => {
    const p = patternMap.get(o.patternId);
    return sum + (p ? severityWeight[p.severity] : 5);
  }, 0);
  const healthScore = Math.max(0, Math.min(100, 100 - penalty));

  return {
    disciplineId,
    disciplineName,
    totalErrors: discOccs.length,
    byCategory,
    bySubcategory,
    bySeverity,
    topPatterns,
    trend,
    healthScore,
  };
}

// ── Recomendações priorizadas ──

export function getTopRecommendations(
  disciplineId: string,
  maxCount: number = 5,
  occurrences: ErrorOccurrence[] = mockOccurrences
): { recommendation: Recommendation; pattern: ErrorPattern; occurrenceCount: number }[] {
  const discOccs = occurrences
    .filter((o) => o.disciplineId === disciplineId && !o.resolved);

  // Contar ocorrências por padrão
  const counts: Record<string, number> = {};
  for (const o of discOccs) {
    counts[o.patternId] = (counts[o.patternId] ?? 0) + 1;
  }

  // Pegar top padrões e extrair recomendação #1 de cada
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxCount)
    .map(([patternId, count]) => {
      const pattern = patternMap.get(patternId)!;
      return {
        recommendation: pattern.recommendations[0],
        pattern,
        occurrenceCount: count,
      };
    })
    .filter((r) => r.recommendation);
}

// ── Distribuição por categoria (para gráfico) ──

export interface CategoryDistribution {
  category: ErrorCategory;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

const categoryLabels: Record<ErrorCategory, string> = {
  conceptual: "Conceitual",
  algebraic: "Algébrico",
  logical: "Lógico",
  interpretation: "Interpretação",
  formalization: "Formalização",
};

const categoryColors: Record<ErrorCategory, string> = {
  conceptual: "bg-accent-danger",
  algebraic: "bg-accent-warning",
  logical: "bg-mastery-exposed",
  interpretation: "bg-accent-primary",
  formalization: "bg-mastery-developing",
};

export function getCategoryDistribution(
  occurrences: ErrorOccurrence[] = mockOccurrences
): CategoryDistribution[] {
  const total = occurrences.length;
  const counts: Record<ErrorCategory, number> = {
    conceptual: 0, algebraic: 0, logical: 0, interpretation: 0, formalization: 0,
  };

  for (const o of occurrences) {
    const p = patternMap.get(o.patternId);
    if (p) counts[p.category]++;
  }

  return (Object.entries(counts) as [ErrorCategory, number][])
    .map(([category, count]) => ({
      category,
      label: categoryLabels[category],
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      color: categoryColors[category],
    }))
    .sort((a, b) => b.count - a.count);
}

// ── Subcategorias ──

const subcategoryLabels: Record<string, string> = {
  dominio: "Domínio", limite: "Limite", derivada: "Derivada",
  logica: "Lógica", quantificadores: "Quantificadores",
  inducao: "Indução", relacoes: "Relações",
};

export function getSubcategoryLabel(sub: string): string {
  return subcategoryLabels[sub] ?? sub;
}

// ── Severity ──

const severityLabels: Record<Severity, string> = {
  low: "Baixo", medium: "Médio", high: "Alto", critical: "Crítico",
};

const severityColors: Record<Severity, string> = {
  low: "text-fg-tertiary",
  medium: "text-mastery-exposed",
  high: "text-accent-warning",
  critical: "text-accent-danger",
};

export function getSeverityLabel(s: Severity): string {
  return severityLabels[s];
}

export function getSeverityColor(s: Severity): string {
  return severityColors[s];
}

// ── Category labels/colors export ──

export { categoryLabels, categoryColors };
