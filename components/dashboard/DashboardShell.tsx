"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, GraduationCap, CreditCard,
  BookOpen, School, Settings, MessageSquare, Menu, X,
  LogOut, ChevronRight, Loader2,
} from "lucide-react";
import { classNames } from "@/lib/utils";
import { useAuthStore } from "@/lib/store";
import { useMe, useLogout } from "@/lib/queries/auth";
import { NotificationBell } from "@/components/dashboard/NotificationBell";
import { SubscriptionSuccessToast } from "@/components/dashboard/SubscriptionSuccessToast";
import { ApiError } from "@/lib/errors";
import type { UserRole } from "@/types";

// ── Nav config ────────────────────────────────────────────────

const ALL_NAV_ITEMS: {
  label: string;
  href:  string;
  icon:  React.ElementType;
  roles: UserRole[];
}[] = [
  { label: "Dashboard",    href: "/dashboard",             icon: LayoutDashboard, roles: ["super_admin", "admin", "teacher", "bursar"] },
  { label: "Staff & Duties", href: "/dashboard/duties",   icon: Users,           roles: ["super_admin", "admin"] },
  { label: "Students",     href: "/dashboard/students",   icon: GraduationCap,   roles: ["super_admin", "admin"] },
  { label: "Collections",  href: "/dashboard/collections",icon: CreditCard,      roles: ["super_admin", "admin", "bursar"] },
  { label: "Academics",    href: "/dashboard/academics",  icon: BookOpen,        roles: ["super_admin", "admin", "teacher"] },
  { label: "Classes",      href: "/dashboard/classes",    icon: School,          roles: ["super_admin", "admin"] },
  { label: "Messages",     href: "/dashboard/messages",   icon: MessageSquare,   roles: ["super_admin", "admin"] },
  { label: "Settings",     href: "/dashboard/settings",   icon: Settings,        roles: ["super_admin", "admin"] },
];

// ── Sidebar ───────────────────────────────────────────────────

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const user     = useAuthStore((s) => s.user);
  const role     = useAuthStore((s) => s.role);
  const logout   = useLogout();

  const navItems = ALL_NAV_ITEMS.filter(
    (item) => !role || item.roles.includes(role)
  );

  const content = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-border shrink-0">
        <Link href="/dashboard" onClick={onClose} className="flex items-center gap-2 no-underline">
          <span className="inline-flex items-center justify-center w-7 h-7 bg-navy-600 rounded text-white text-xs font-bold select-none">
            RR
          </span>
          <span className="font-semibold text-text-primary text-sm">ReportRun</span>
        </Link>
        <button onClick={onClose} className="lg:hidden p-1 text-text-muted hover:text-text-primary cursor-pointer" aria-label="Close sidebar">
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-0.5">
          {navItems.map((item) => {
            const Icon     = item.icon;
            const isActive = pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={classNames(
                    "flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-colors duration-150 no-underline",
                    isActive
                      ? "bg-navy-600 text-white"
                      : "text-text-secondary hover:text-text-primary hover:bg-surface-secondary"
                  )}
                >
                  <Icon size={16} className="shrink-0" />
                  {item.label}
                  {isActive && <ChevronRight size={14} className="ml-auto opacity-60" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User */}
      <div className="border-t border-border p-3 shrink-0">
        <div className="flex items-center gap-3 px-2 py-2 mb-1">
          <div className="w-7 h-7 rounded-full bg-navy-100 flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-navy-600">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-text-primary truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-text-muted truncate capitalize">
              {user?.role?.replace("_", " ")}
            </p>
          </div>
        </div>
        <button
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
          className="w-full flex items-center gap-3 px-3 py-2 rounded text-sm text-text-secondary hover:text-error hover:bg-error-light transition-colors duration-150 cursor-pointer disabled:opacity-50"
        >
          {logout.isPending ? <Loader2 size={15} className="animate-spin" /> : <LogOut size={15} />}
          {logout.isPending ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={onClose} aria-hidden="true" />
      )}
      <aside className={classNames(
        "fixed inset-y-0 left-0 z-50 w-56 bg-surface border-r border-border transition-transform duration-200 lg:hidden",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
        {content}
      </aside>
      <aside className="hidden lg:flex flex-col w-56 bg-surface border-r border-border fixed inset-y-0 left-0 z-30">
        {content}
      </aside>
    </>
  );
}

// ── Topbar ────────────────────────────────────────────────────

function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();
  const current  = ALL_NAV_ITEMS.find(
    (n) => pathname === n.href || (n.href !== "/dashboard" && pathname.startsWith(n.href))
  );

  return (
    <header className="h-14 bg-surface border-b border-border flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-surface-secondary transition-colors cursor-pointer"
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>
        <h1 className="text-sm font-semibold text-text-primary">
          {current?.label ?? "Dashboard"}
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <NotificationBell />
      </div>
    </header>
  );
}

// ── Auth gate — calls useMe safely inside the provider tree ──

function AuthGate({ children }: { children: React.ReactNode }) {
  const router             = useRouter();
  const { isLoading, error } = useMe();

  useEffect(() => {
    if (error instanceof ApiError && error.status === 401) {
      router.replace("/login");
    }
  }, [error, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-secondary">
        <Loader2 size={24} className="animate-spin text-navy-600" />
      </div>
    );
  }

  return <>{children}</>;
}

// ── Shell ─────────────────────────────────────────────────────

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AuthGate>
      <div className="min-h-screen bg-surface-secondary">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="lg:pl-56 flex flex-col min-h-screen">
          <Topbar onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 p-4 lg:p-6">
            {children}
          </main>
        </div>
        <SubscriptionSuccessToast />
      </div>
    </AuthGate>
  );
}