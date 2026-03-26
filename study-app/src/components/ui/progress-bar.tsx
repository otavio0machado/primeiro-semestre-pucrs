import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number; // 0–100
  variant?: "thin" | "normal";
  color?: string;
  className?: string;
}

export function ProgressBar({
  value,
  variant = "normal",
  color,
  className,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const heightClass = variant === "thin" ? "h-0.5" : "h-1";

  const barColor =
    color ??
    (clamped >= 90
      ? "bg-mastery-mastered"
      : clamped >= 70
        ? "bg-mastery-proficient"
        : clamped >= 40
          ? "bg-mastery-developing"
          : clamped > 0
            ? "bg-mastery-exposed"
            : "bg-fg-muted");

  return (
    <div
      className={cn("w-full bg-bg-tertiary rounded-none", heightClass, className)}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn("rounded-none transition-all duration-300", heightClass, barColor)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
