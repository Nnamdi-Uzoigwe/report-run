import { type ButtonHTMLAttributes, forwardRef } from "react";
import { classNames } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size    = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary: "bg-navy-600 text-white hover:bg-navy-700 border border-navy-600 hover:border-navy-700",
  secondary: "bg-surface text-primary hover:bg-surface-secondary border hover:border-strong",
  ghost:     "bg-transparent text-text-secondary hover:bg-surface-secondary border border-transparent",
  danger:    "bg-error text-white hover:bg-red-700 border border-error hover:border-red-700",
};

const sizeStyles: Record<Size, string> = {
  sm: "text-sm px-3 py-1.5 h-8",
  md: "text-sm px-4 py-2 h-9",
  lg: "text-base px-5 py-2.5 h-11",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={classNames(
          "inline-flex items-center justify-center gap-2 font-medium rounded transition-colors duration-150 cursor-pointer",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-600",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {loading && (
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";