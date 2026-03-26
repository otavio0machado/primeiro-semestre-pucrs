import { ScoreDisplay } from "@/components/ui/score-display";
import { ArrowRight } from "lucide-react";

interface Gap {
  topicName: string;
  topicId: string;
  score: number;
  exercisesAvailable?: number;
  prerequisite?: string;
  action: string;
  actionType: "practice" | "view";
}

interface RecommendedActionProps {
  examName: string;
  gaps: Gap[];
}

export function RecommendedAction({ examName, gaps }: RecommendedActionProps) {
  return (
    <div className="rounded-md border border-border-default bg-bg-surface p-4">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-fg-muted">
        Ação Recomendada
      </h3>
      <p className="mt-2 text-sm text-fg-secondary">
        Seus {gaps.length} maiores gaps para {examName}:
      </p>

      <div className="mt-3 space-y-3">
        {gaps.map((gap, i) => (
          <div
            key={gap.topicId}
            className="flex items-start gap-3 rounded-md border border-border-subtle bg-bg-primary p-3"
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-bg-tertiary font-mono text-xs text-fg-tertiary">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-fg-primary">
                  {gap.topicName}
                </span>
                <ScoreDisplay score={gap.score} className="text-xs" />
              </div>
              {gap.exercisesAvailable && (
                <p className="mt-0.5 text-xs text-fg-tertiary">
                  {gap.exercisesAvailable} exercícios disponíveis
                </p>
              )}
              {gap.prerequisite && (
                <p className="mt-0.5 text-xs text-accent-warning">
                  Pré-requisito: {gap.prerequisite}
                </p>
              )}
            </div>
            <button className="flex shrink-0 items-center gap-1 rounded-md bg-accent-primary/10 px-3 py-1.5 text-xs font-medium text-accent-primary transition-colors hover:bg-accent-primary/20">
              {gap.action}
              <ArrowRight size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
