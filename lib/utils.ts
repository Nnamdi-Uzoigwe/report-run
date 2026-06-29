import type { PaymentStatus, Status } from "@/types";

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateString));
}

export function formatDateTime(dateString: string): string {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function getStatusColor(status: Status): string {
  const map: Record<Status, string> = {
    active:   "bg-success-light text-success",
    inactive: "bg-surface-tertiary text-text-muted",
    pending:  "bg-warning-light text-warning",
    archived: "bg-surface-tertiary text-text-muted",
  };
  return map[status];
}

export function getPaymentStatusColor(status: PaymentStatus): string {
  const map: Record<PaymentStatus, string> = {
    paid:    "bg-success-light text-success",
    partially_paid: "bg-warning-light text-warning",
    defaulter:  "bg-error-light text-error",
  };
  return map[status];
}

export function getPaymentStatusLabel(status: PaymentStatus): string {
  const map: Record<PaymentStatus, string> = {
    paid:    "Paid",
    partially_paid: "Partial",
    defaulter:  "Unpaid",
  };
  return map[status];
}

export function truncate(str: string, length: number): string {
  return str.length > length ? `${str.slice(0, length)}…` : str;
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}

export function classNames(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}