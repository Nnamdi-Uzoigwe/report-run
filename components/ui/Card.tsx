import { classNames } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

interface CardSectionProps {
  children: React.ReactNode;
  className?: string;
}

const paddingStyles = {
  none: "",
  sm:   "p-4",
  md:   "p-6",
  lg:   "p-8",
};

export function Card({ children, className, padding = "md" }: CardProps) {
  return (
    <div
      className={classNames(
        "bg-surface border border-border rounded-lg",
        paddingStyles[padding],
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, className }: CardHeaderProps) {
  return (
    <div className={classNames("flex items-start justify-between gap-4 mb-6", className)}>
      <div>
        <h2 className="text-base font-semibold text-text-primary">{title}</h2>
        {subtitle && (
          <p className="text-sm text-text-muted mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardSection({ children, className }: CardSectionProps) {
  return (
    <div className={classNames("border-t border-border pt-4 mt-4", className)}>
      {children}
    </div>
  );
}