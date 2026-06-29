import { DashboardShell } from "@/components/dashboard/DashboardShell";

// This layout is intentionally a Server Component.
// All client-side logic (auth, nav, sidebar) lives in DashboardShell
// which renders inside the QueryClientProvider from the root layout.

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}