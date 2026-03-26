import { cn, formatCountdown, urgencyBorder, countdownColor } from "@/lib/utils";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { MockExam } from "@/data/mock";

interface ExamCountdownProps {
  exam: MockExam;
}

export function ExamCountdown({ exam }: ExamCountdownProps) {
  const countdown = formatCountdown(exam.date);
  const dateStr = new Date(exam.date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-md border border-border-default bg-bg-surface p-4 border-l-2",
        urgencyBorder(exam.date)
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-fg-primary">{exam.name}</h3>
          <p className="mt-0.5 text-xs text-fg-tertiary">
            {dateStr} · {exam.topicIds.length} tópicos
          </p>
        </div>
        <span
          className={cn(
            "rounded-sm border border-border-default bg-bg-tertiary px-2 py-0.5 font-mono text-xs font-medium",
            countdownColor(exam.date)
          )}
        >
          {countdown}
        </span>
      </div>

      <ProgressBar value={exam.coveragePct} variant="normal" />

      <div className="flex items-center justify-between text-xs">
        <span className="font-mono text-fg-secondary">
          {exam.coveragePct}% coberto
        </span>
        {exam.gapCount > 0 && (
          <span className="text-accent-warning">
            {exam.gapCount} tópicos abaixo de 40%
          </span>
        )}
      </div>
    </div>
  );
}
