import { classNames } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "error" | "info" | "navy";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-surface-tertiary text-text-secondary",
  success: "bg-success-light text-success",
  warning: "bg-warning-light text-warning",
  error:   "bg-error-light text-error",
  info:    "bg-info-light text-info",
  navy:    "bg-navy-100 text-navy-700",
};

export function Badge({ label, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={classNames(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
        variantStyles[variant],
        className
      )}
    >
      {label}
    </span>
  );
}