import { cn, formatScore } from "@/lib/utils";

interface ScoreDisplayProps {
  score: number;
  className?: string;
}

function scoreColor(score: number): string {
  if (score >= 0.9) return "text-mastery-mastered";
  if (score >= 0.7) return "text-mastery-proficient";
  if (score >= 0.4) return "text-mastery-developing";
  if (score > 0) return "text-mastery-exposed";
  return "text-fg-muted";
}

export function ScoreDisplay({ score, className }: ScoreDisplayProps) {
  return (
    <span
      className={cn(
        "font-mono text-sm font-medium tabular-nums",
        scoreColor(score),
        className
      )}
    >
      {formatScore(score)}
    </span>
  );
}
