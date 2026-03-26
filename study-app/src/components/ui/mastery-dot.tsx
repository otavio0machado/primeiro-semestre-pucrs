"use client";

import { cn, masteryColor } from "@/lib/utils";

type MasteryLevel = "none" | "exposed" | "developing" | "proficient" | "mastered";

const labels: Record<MasteryLevel, string> = {
  none: "Nunca estudou",
  exposed: "Viu o conteúdo",
  developing: "Resolve com ajuda",
  proficient: "Resolve sozinho",
  mastered: "Domina",
};

interface MasteryDotProps {
  level: MasteryLevel;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function MasteryDot({
  level,
  size = "md",
  showLabel = false,
  className,
}: MasteryDotProps) {
  const sizeClasses = {
    sm: "h-2 w-2",
    md: "h-2.5 w-2.5",
    lg: "h-3 w-3",
  };

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)} title={labels[level]}>
      <span
        className={cn(
          "rounded-full shrink-0",
          sizeClasses[size],
          masteryColor(level)
        )}
        aria-label={labels[level]}
      />
      {showLabel && (
        <span className="text-xs text-fg-secondary">{level}</span>
      )}
    </span>
  );
}
