"use client";

import Link from "next/link";
import {
  GraduationCap, Users, CreditCard, TrendingUp,
  BookOpen, ClipboardList, CalendarDays,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import { StatCard, Card, CardHeader, Badge } from "@/components/ui";
import { useFeeDashboard, useInvoices } from "@/lib/queries/fees";
import { useStudents } from "@/lib/queries/students";
import { useSchoolUsers } from "@/lib/queries/staff";
import { useActiveAcademicSession } from "@/lib/queries/session";
import { useAssignmentsByUser } from "@/lib/queries/staff";
import { useAuthStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import type { FeeInvoice } from "@/types";

// ── Helpers ───────────────────────────────────────────────────

function statusLabel(s: FeeInvoice["paymentStatus"]) {
  if (s === "paid")          return "Paid";
  if (s === "partially_paid") return "Partial";
  return "Unpaid";
}

function statusColor(s: FeeInvoice["paymentStatus"]) {
  if (s === "paid")          return "text-success bg-success-light";
  if (s === "partially_paid") return "text-warning bg-warning-light";
  return "text-error bg-error-light";
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="h-8 w-48 bg-surface-tertiary rounded animate-pulse" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-surface-tertiary rounded-lg animate-pulse" />
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="h-64 bg-surface-tertiary rounded-lg animate-pulse lg:col-span-2" />
        <div className="h-64 bg-surface-tertiary rounded-lg animate-pulse" />
      </div>
    </div>
  );
}

// ── Teacher Dashboard ─────────────────────────────────────────

function TeacherDashboard({ userId }: { userId: string }) {
  const { data: assignments = [], isLoading } = useAssignmentsByUser(userId);
  const { data: session }                     = useActiveAcademicSession();

  if (isLoading) return <Skeleton />;

  const myClasses = Array.from(
    new Map(assignments.map((a) => [a.classId, a.class])).values()
  ).filter(Boolean);

  const isClassTeacher = assignments.some((a) => a.isClassTeacher);

  return (
    <div className="flex flex-col gap-6">
      {/* Active session banner */}
      {session && (
        <div className="flex items-center gap-3 p-4 bg-navy-50 border border-navy-200 rounded-xl">
          <CalendarDays size={18} className="text-navy-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-navy-700">
              {session.academicYear} — {session.currentTerm.charAt(0).toUpperCase() + session.currentTerm.slice(1)} Term
            </p>
            <p className="text-xs text-navy-500">Active academic session</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard title="My classes"    value={myClasses.length} icon={BookOpen} />
        <StatCard title="Assignments"   value={assignments.length} icon={ClipboardList} />
        <StatCard
          title="Role"
          value={isClassTeacher ? "Class Teacher" : "Subject Teacher"}
          icon={Users}
        />
      </div>

      {/* My classes */}
      <Card>
        <CardHeader title="My classes" subtitle="Classes and subjects you are assigned to" />
        {assignments.length === 0 ? (
          <p className="text-sm text-text-muted mt-4">No assignments yet. Contact your admin.</p>
        ) : (
          <div className="mt-4 flex flex-col gap-2">
            {assignments.map((a) => (
              <Link
                key={a.id}
                href={`/dashboard/academics`}
                className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-surface-secondary no-underline group"
              >
                <div>
                  <p className="text-sm font-medium text-text-primary">{a.class?.name ?? "—"}</p>
                  <p className="text-xs text-text-muted">{a.subjects?.map((s: any) => s.name).join(", ") ?? "—"}</p>
                </div>
                {a.isClassTeacher && (
                  <span className="text-xs bg-navy-100 text-navy-700 px-2 py-0.5 rounded font-semibold">
                    Class Teacher
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Quick actions */}
      <Card>
        <CardHeader title="Quick actions" />
        <div className="flex flex-col gap-2 mt-2">
          {[
            { label: "Enter scores",    href: "/dashboard/academics" },
            { label: "Mark attendance", href: "/dashboard/attendance" },
            { label: "View reports",    href: "/dashboard/academics"  },
          ].map((a) => (
            <Link
              key={a.href + a.label}
              href={a.href}
              className="flex items-center justify-between px-3 py-2.5 rounded border border-border hover:bg-surface-secondary transition-colors no-underline group"
            >
              <span className="text-sm text-text-secondary group-hover:text-text-primary">{a.label}</span>
              <span className="text-text-muted text-xs">→</span>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── Bursar Dashboard ──────────────────────────────────────────

function BursarDashboard() {
  const { data: metrics, isLoading: ml } = useFeeDashboard();
  const { data: invoices = [], isLoading: il } = useInvoices();

  if (ml || il) return <Skeleton />;

  const collectionRate = metrics && metrics.totalExpected > 0
    ? Math.round((metrics.totalSecured / metrics.totalExpected) * 100)
    : 0;

  const recentInvoices = [...invoices]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const collectionByMonth = invoices.reduce<Record<string, { month: string; expected: number; collected: number }>>(
    (acc, inv) => {
      const month = new Date(inv.createdAt).toLocaleString("en-NG", { month: "short" });
      if (!acc[month]) acc[month] = { month, expected: 0, collected: 0 };
      acc[month].expected  += Number(inv.totalAmount);
      acc[month].collected += Number(inv.amountPaid);
      return acc;
    }, {},
  );
  const chartData = Object.values(collectionByMonth).slice(-6);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard title="Collection rate"    value={`${collectionRate}%`}                  icon={TrendingUp} />
        <StatCard title="Total secured"      value={formatCurrency(metrics?.totalSecured ?? 0)} icon={CreditCard} />
        <StatCard title="Outstanding debt"   value={formatCurrency(metrics?.totalDebt    ?? 0)} icon={CreditCard} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader title="Fee collection" subtitle="Expected vs collected — last 6 months" />
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-text-muted text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barGap={4}>
                <CartesianGrid vertical={false} stroke="#E8EDF2" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#8A9BB0" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#8A9BB0" }} axisLine={false} tickLine={false}
                  tickFormatter={(v: number) => `₦${(v / 1000000).toFixed(1)}M`} />
                <Tooltip formatter={(v) => [formatCurrency(Number(v)), ""]}
                  contentStyle={{ border: "1px solid #D8E0E9", borderRadius: "0.375rem", fontSize: "12px" }} />
                <Bar dataKey="expected"  fill="#E8EDF2" radius={[3,3,0,0]} name="Expected" />
                <Bar dataKey="collected" fill="#1A3A5C" radius={[3,3,0,0]} name="Collected" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <CardHeader title="Fee status" subtitle="Current term" />
          <div className="flex flex-col gap-4 mt-2">
            {[
              { label: "Fully paid",     value: metrics?.paidCount     ?? 0, color: "text-success" },
              { label: "Partially paid", value: metrics?.partialCount   ?? 0, color: "text-warning" },
              { label: "Defaulters",     value: metrics?.defaulterCount ?? 0, color: "text-error"   },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">{item.label}</span>
                <span className={`text-lg font-semibold ${item.color}`}>{item.value}</span>
              </div>
            ))}
            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-text-primary">Total secured</span>
                <span className="text-sm font-semibold text-success">
                  {formatCurrency(metrics?.totalSecured ?? 0)}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Recent activity" subtitle="Last 5 updated invoices" />
        {recentInvoices.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-text-muted text-sm">No invoices yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm mt-2">
              <thead>
                <tr className="border-b border-border">
                  {["Student", "Term", "Balance", "Status"].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-text-muted uppercase tracking-wide py-2 pr-4 last:pr-0">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentInvoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-border last:border-0">
                    <td className="py-3 pr-4">
                      <p className="font-medium text-text-primary">{inv.student.firstName} {inv.student.lastName}</p>
                      <p className="text-xs text-text-muted">{inv.student.admissionNumber ?? "—"}</p>
                    </td>
                    <td className="py-3 pr-4 text-text-secondary">{inv.termLabel}</td>
                    <td className="py-3 pr-4 font-medium text-error">{formatCurrency(Number(inv.balance))}</td>
                    <td className="py-3">
                      <Badge label={statusLabel(inv.paymentStatus)} className={statusColor(inv.paymentStatus)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ── Admin Dashboard ───────────────────────────────────────────

function AdminDashboard() {
  const { data: metrics,  isLoading: ml } = useFeeDashboard();
  const { data: students = [], isLoading: sl } = useStudents();
  const { data: staff = [],    isLoading: stl } = useSchoolUsers();
  const { data: invoices = [], isLoading: il }  = useInvoices();

  if (ml || sl || stl || il) return <Skeleton />;

  const collectionRate = metrics && metrics.totalExpected > 0
    ? Math.round((metrics.totalSecured / metrics.totalExpected) * 100)
    : 0;

  const recentInvoices = [...invoices]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const collectionByMonth = invoices.reduce<Record<string, { month: string; expected: number; collected: number }>>(
    (acc, inv) => {
      const month = new Date(inv.createdAt).toLocaleString("en-NG", { month: "short" });
      if (!acc[month]) acc[month] = { month, expected: 0, collected: 0 };
      acc[month].expected  += Number(inv.totalAmount);
      acc[month].collected += Number(inv.amountPaid);
      return acc;
    }, {},
  );
  const chartData = Object.values(collectionByMonth).slice(-6);

  return (
    <div className="flex flex-col gap-6">
      {/* Stat cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total students"  value={students.length.toLocaleString()} icon={GraduationCap} />
        <StatCard title="Total staff"     value={staff.length}                     icon={Users} />
        <StatCard title="Collection rate" value={`${collectionRate}%`}             icon={TrendingUp} />
        <StatCard title="Outstanding fees" value={formatCurrency(metrics?.totalDebt ?? 0)} icon={CreditCard} />
      </div>

      {/* Chart + fee breakdown */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader title="Fee collection" subtitle="Expected vs collected — last 6 months" />
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-text-muted text-sm">No collection data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barGap={4}>
                <CartesianGrid vertical={false} stroke="#E8EDF2" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#8A9BB0" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#8A9BB0" }} axisLine={false} tickLine={false}
                  tickFormatter={(v: number) => `₦${(v / 1000000).toFixed(1)}M`} />
                <Tooltip formatter={(v) => [formatCurrency(Number(v)), ""]}
                  contentStyle={{ border: "1px solid #D8E0E9", borderRadius: "0.375rem", fontSize: "12px" }} />
                <Bar dataKey="expected"  fill="#E8EDF2" radius={[3,3,0,0]} name="Expected" />
                <Bar dataKey="collected" fill="#1A3A5C" radius={[3,3,0,0]} name="Collected" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <CardHeader title="Fee status" subtitle="Current term" />
          <div className="flex flex-col gap-4 mt-2">
            {[
              { label: "Fully paid",     value: metrics?.paidCount     ?? 0, color: "text-success" },
              { label: "Partially paid", value: metrics?.partialCount   ?? 0, color: "text-warning" },
              { label: "Defaulters",     value: metrics?.defaulterCount ?? 0, color: "text-error"   },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">{item.label}</span>
                <span className={`text-lg font-semibold ${item.color}`}>{item.value}</span>
              </div>
            ))}
            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-text-primary">Total secured</span>
                <span className="text-sm font-semibold text-success">{formatCurrency(metrics?.totalSecured ?? 0)}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent invoices + Quick actions */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader title="Recent activity" subtitle="Last 5 updated invoices" />
          {recentInvoices.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-text-muted text-sm">No invoices yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm mt-2">
                <thead>
                  <tr className="border-b border-border">
                    {["Student", "Term", "Balance", "Status"].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-text-muted uppercase tracking-wide py-2 pr-4 last:pr-0">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentInvoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-border last:border-0">
                      <td className="py-3 pr-4">
                        <p className="font-medium text-text-primary">{inv.student.firstName} {inv.student.lastName}</p>
                        <p className="text-xs text-text-muted">{inv.student.admissionNumber ?? "—"}</p>
                      </td>
                      <td className="py-3 pr-4 text-text-secondary">{inv.termLabel}</td>
                      <td className="py-3 pr-4 font-medium text-error">{formatCurrency(Number(inv.balance))}</td>
                      <td className="py-3">
                        <Badge label={statusLabel(inv.paymentStatus)} className={statusColor(inv.paymentStatus)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Quick actions" />
          <div className="flex flex-col gap-2 mt-2">
            {[
              { label: "Record a payment", href: "/dashboard/collections" },
              { label: "Add a student",    href: "/dashboard/students"    },
              { label: "Enter results",    href: "/dashboard/academics"   },
              { label: "Manage classes",   href: "/dashboard/classes"     },
              { label: "Staff duties",     href: "/dashboard/duties"      },
            ].map((a) => (
              <Link key={a.href + a.label} href={a.href}
                className="flex items-center justify-between px-3 py-2.5 rounded border border-border hover:bg-surface-secondary transition-colors no-underline group">
                <span className="text-sm text-text-secondary group-hover:text-text-primary">{a.label}</span>
                <span className="text-text-muted text-xs">→</span>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────

export default function DashboardPage() {
  const role   = useAuthStore((s) => s.role);
  const user   = useAuthStore((s) => s.user);

  if (role === "teacher") {
    return <TeacherDashboard userId={user?.id ?? ""} />;
  }

  if (role === "bursar") {
    return <BursarDashboard />;
  }

  // admin and super_admin get the full view
  return <AdminDashboard />;
}