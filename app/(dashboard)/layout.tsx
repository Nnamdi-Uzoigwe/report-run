"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, GraduationCap, CreditCard,
  BookOpen, School, Settings, MessageSquare, Menu, X,
  LogOut, ChevronRight,
} from "lucide-react";
import { classNames } from "@/lib/utils";
import { useAuthStore } from "@/lib/store";
import { useMe } from "@/lib/hooks/useMe";
import { logoutAction } from "@/lib/actions/auth";
import { NotificationBell } from "@/components/dashboard/NotificationBell";

// ── Nav config ────────────────────────────────────────────────

const ALL_NAV_ITEMS = [
  {
    label:     "Dashboard",
    href:      "/dashboard",
    icon:      LayoutDashboard,
    roles:     ["super_admin", "admin", "teacher", "accountant"],
  },
  {
    label:     "Staff Duties",
    href:      "/dashboard/duties",
    icon:      Users,
    roles:     ["super_admin", "admin"],
  },
  {
    label:     "Students",
    href:      "/dashboard/students",
    icon:      GraduationCap,
    roles:     ["super_admin", "admin"],
  },
  {
    label:     "Collections",
    href:      "/dashboard/collections",
    icon:      CreditCard,
    roles:     ["super_admin", "admin", "accountant"],
  },
  {
    label:     "Academics",
    href:      "/dashboard/academics",
    icon:      BookOpen,
    roles:     ["super_admin", "admin", "teacher"],
  },
  {
    label:     "Classes",
    href:      "/dashboard/classes",
    icon:      School,
    roles:     ["super_admin", "admin"],
  },
  {
    label:     "Messages",
    href:      "/dashboard/messages",
    icon:      MessageSquare,
    roles:     ["super_admin", "admin"],
  },
  {
    label:     "Settings",
    href:      "/dashboard/settings",
    icon:      Settings,
    roles:     ["super_admin", "admin"],
  },
] as const;

// ── Sidebar ───────────────────────────────────────────────────

function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, clearUser } = useAuthStore();
  const role     = useAuthStore((s) => s.role);
 const navItems = ALL_NAV_ITEMS.filter((item) =>
    !role || (item.roles as readonly string[]).includes(role)
  );

async function handleLogout() {
    await logoutAction();
    clearUser();
    router.push("/login");
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-border shrink-0">
        <Link
          href="/dashboard"
          onClick={onClose}
          className="flex items-center gap-2 no-underline"
        >
          <span className="inline-flex items-center justify-center w-7 h-7 bg-navy-600 rounded text-white text-xs font-bold select-none">
            RR
          </span>
          <span className="font-semibold text-text-primary text-sm">
            ReportRun
          </span>
        </Link>
        <button
          onClick={onClose}
          className="lg:hidden p-1 text-text-muted hover:text-text-primary cursor-pointer"
          aria-label="Close sidebar"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-0.5">
          {navItems.map((item) => {
            const Icon      = item.icon;
            const isActive  = pathname === item.href;
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
                  {isActive && (
                    <ChevronRight size={14} className="ml-auto opacity-60" />
                  )}
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
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded text-sm text-text-secondary hover:text-error hover:bg-error-light transition-colors duration-150 cursor-pointer"
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={classNames(
          "fixed inset-y-0 left-0 z-50 w-56 bg-surface border-r border-border transition-transform duration-200 lg:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 bg-surface border-r border-border fixed inset-y-0 left-0 z-30">
        {sidebarContent}
      </aside>
    </>
  );
}

// ── Topbar ────────────────────────────────────────────────────

function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();
  const current  = ALL_NAV_ITEMS.find((n) => n.href === pathname);

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

// ── Layout ────────────────────────────────────────────────────
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const { error } = useMe();

  useEffect(() => {
    if (error && (error as any)?.status === 401) {
      router.replace("/login");
    }
  }, [error, router]);

  return (
    <div className="min-h-screen bg-surface-secondary">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="lg:pl-56 flex flex-col min-h-screen">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}