import { classNames } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
    direction: "up" | "down" | "neutral";
  };
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className,
}: StatCardProps) {
  return (
    <div
      className={classNames(
        "bg-surface border border-border rounded-lg p-6",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">
            {title}
          </p>
          <p className="text-2xl font-semibold text-text-primary mt-1 truncate">
            {value}
          </p>
          {subtitle && (
            <p className="text-sm text-text-muted mt-0.5">{subtitle}</p>
          )}
          {trend && (
            <p
              className={classNames(
                "text-xs mt-2 font-medium",
                trend.direction === "up"      && "text-success",
                trend.direction === "down"    && "text-error",
                trend.direction === "neutral" && "text-text-muted"
              )}
            >
              {trend.direction === "up" && "↑ "}
              {trend.direction === "down" && "↓ "}
              {trend.value}% {trend.label}
            </p>
          )}
        </div>
        <div className="p-2.5 bg-navy-50 rounded-lg shrink-0">
          <Icon size={20} className="text-navy-600" />
        </div>
      </div>
    </div>
  );
}