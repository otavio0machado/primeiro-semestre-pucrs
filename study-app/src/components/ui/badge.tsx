import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "mastery" | "outline" | "danger" | "warning" | "success";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default:
    "border-border-default bg-bg-tertiary text-fg-secondary",
  mastery:
    "border-border-default bg-bg-tertiary text-fg-secondary",
  outline:
    "border-border-default bg-transparent text-fg-secondary",
  danger:
    "border-accent-danger/30 bg-accent-danger/10 text-accent-danger",
  warning:
    "border-accent-warning/30 bg-accent-warning/10 text-accent-warning",
  success:
    "border-accent-success/30 bg-accent-success/10 text-accent-success",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[11px] font-medium leading-none tracking-wide uppercase",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
