import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date as relative countdown: "em 14 dias", "amanhã", "HOJE"
 */
export function formatCountdown(targetDate: string): string {
  const now = new Date();
  const target = new Date(targetDate);
  const diffMs = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return `${Math.abs(diffDays)}d atrás`;
  if (diffDays === 0) return "HOJE";
  if (diffDays === 1) return "amanhã";
  return `em ${diffDays} dias`;
}

/**
 * Format countdown urgency color class
 */
export function countdownColor(targetDate: string): string {
  const now = new Date();
  const target = new Date(targetDate);
  const diffDays = Math.ceil(
    (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays <= 0) return "text-accent-danger";
  if (diffDays <= 3) return "text-accent-danger";
  if (diffDays <= 7) return "text-accent-warning";
  if (diffDays <= 14) return "text-mastery-exposed";
  return "text-fg-tertiary";
}

/**
 * Format a mastery score (0-1) as display string
 */
export function formatScore(score: number): string {
  return score.toFixed(2);
}

/**
 * Get border color class for urgency
 */
export function urgencyBorder(targetDate: string): string {
  const now = new Date();
  const target = new Date(targetDate);
  const diffDays = Math.ceil(
    (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays <= 3) return "border-l-accent-danger";
  if (diffDays <= 7) return "border-l-accent-warning";
  if (diffDays <= 14) return "border-l-mastery-exposed";
  return "border-l-border-default";
}

/**
 * Mastery level → Tailwind color class
 */
export function masteryColor(
  level: string
): string {
  const map: Record<string, string> = {
    none: "bg-mastery-none",
    exposed: "bg-mastery-exposed",
    developing: "bg-mastery-developing",
    proficient: "bg-mastery-proficient",
    mastered: "bg-mastery-mastered",
  };
  return map[level] ?? map.none;
}

export function masteryTextColor(level: string): string {
  const map: Record<string, string> = {
    none: "text-mastery-none",
    exposed: "text-mastery-exposed",
    developing: "text-mastery-developing",
    proficient: "text-mastery-proficient",
    mastered: "text-mastery-mastered",
  };
  return map[level] ?? map.none;
}
