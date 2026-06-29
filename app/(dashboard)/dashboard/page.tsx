"use client";

import {
  GraduationCap, Users, CreditCard, TrendingUp, AlertCircle,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import { StatCard, Card, CardHeader, Badge, PageHeader } from "@/components/ui";
import { useFeeDashboard } from "@/lib/queries/fees";
import { useStudents } from "@/lib/queries/students";
import { useSchoolUsers } from "@/lib/queries/staff";
import { useInvoices } from "@/lib/queries/fees";
import { useAuthStore } from "@/lib/store";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { FeeInvoice } from "@/types";

// ── Helpers ───────────────────────────────────────────────────

function statusLabel(status: FeeInvoice["paymentStatus"]): string {
  if (status === "paid")          return "Paid";
  if (status === "partially_paid") return "Partial";
  return "Unpaid";
}

function statusColor(status: FeeInvoice["paymentStatus"]): string {
  if (status === "paid")          return "text-success bg-success-light";
  if (status === "partially_paid") return "text-warning bg-warning-light";
  return "text-error bg-error-light";
}

// ── Sub-components ────────────────────────────────────────────

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

// ── Page ──────────────────────────────────────────────────────

export default function DashboardPage() {
  const schoolId = useAuthStore((s) => s.schoolId);

  const { data: metrics, isLoading: metricsLoading } = useFeeDashboard();
  const { data: students = [], isLoading: studentsLoading } = useStudents();
  const { data: staff = [],    isLoading: staffLoading }    = useSchoolUsers();
  const { data: invoices = [], isLoading: invoicesLoading } = useInvoices();

  const isLoading =
    metricsLoading || studentsLoading || staffLoading || invoicesLoading;

  if (isLoading) return <Skeleton />;

  // Derive chart data from real invoice data grouped by month
  const collectionByMonth = invoices.reduce<
    Record<string, { month: string; expected: number; collected: number }>
  >((acc, inv) => {
    const month = new Date(inv.createdAt).toLocaleString("en-NG", { month: "short" });
    if (!acc[month]) acc[month] = { month, expected: 0, collected: 0 };
    acc[month].expected  += Number(inv.totalAmount);
    acc[month].collected += Number(inv.amountPaid);
    return acc;
  }, {});

  const chartData = Object.values(collectionByMonth).slice(-6);

  const collectionRate = metrics
    ? metrics.totalExpected > 0
      ? Math.round((metrics.totalSecured / metrics.totalExpected) * 100)
      : 0
    : 0;

  const recentInvoices = [...invoices]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        subtitle={schoolId ? "Overview of your school's performance" : ""}
      />

      {/* Stat cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total students"
          value={students.length.toLocaleString()}
          icon={GraduationCap}
        />
        <StatCard
          title="Total staff"
          value={staff.length}
          icon={Users}
        />
        <StatCard
          title="Collection rate"
          value={`${collectionRate}%`}
          icon={TrendingUp}
        />
        <StatCard
          title="Outstanding fees"
          value={formatCurrency(metrics?.totalDebt ?? 0)}
          icon={CreditCard}
        />
      </div>

      {/* Chart + fee breakdown */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Collection chart */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Fee collection"
            subtitle="Expected vs collected — last 6 months"
          />
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-text-muted text-sm">
              No collection data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barGap={4}>
                <CartesianGrid vertical={false} stroke="#E8EDF2" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "#8A9BB0" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#8A9BB0" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `₦${(v / 1000000).toFixed(1)}M`}
                />
                <Tooltip
                  formatter={(value) => [formatCurrency(Number(value)), ""]}
                  contentStyle={{
                    border: "1px solid #D8E0E9",
                    borderRadius: "0.375rem",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="expected"  fill="#E8EDF2" radius={[3, 3, 0, 0]} name="Expected"  />
                <Bar dataKey="collected" fill="#1A3A5C" radius={[3, 3, 0, 0]} name="Collected" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Fee status breakdown */}
        <Card>
          <CardHeader title="Fee status" subtitle="Current term" />
          <div className="flex flex-col gap-4 mt-2">
            {[
              { label: "Fully paid",     value: metrics?.paidCount      ?? 0, color: "text-success" },
              { label: "Partially paid", value: metrics?.partialCount    ?? 0, color: "text-warning" },
              { label: "Defaulters",     value: metrics?.defaulterCount  ?? 0, color: "text-error"   },
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

      {/* Recent payments + Quick actions */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Recent invoices */}
        <Card className="lg:col-span-2">
          <CardHeader title="Recent activity" subtitle="Last 5 updated invoices" />
          {recentInvoices.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-text-muted text-sm">
              No invoices yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["Student", "Term", "Balance", "Status"].map((h) => (
                      <th
                        key={h}
                        className="text-left text-xs font-semibold text-text-muted uppercase tracking-wide px-0 py-2 pr-4 last:pr-0"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentInvoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-border last:border-0">
                      <td className="py-3 pr-4">
                        <p className="font-medium text-text-primary">
                          {inv.student.firstName} {inv.student.lastName}
                        </p>
                        <p className="text-xs text-text-muted">
                          {inv.student.admissionNumber ?? "—"}
                        </p>
                      </td>
                      <td className="py-3 pr-4 text-text-secondary">{inv.termLabel}</td>
                      <td className="py-3 pr-4 font-medium text-error">
                        {formatCurrency(Number(inv.balance))}
                      </td>
                      <td className="py-3">
                        <Badge
                          label={statusLabel(inv.paymentStatus)}
                          className={statusColor(inv.paymentStatus)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Quick actions */}
        <Card>
          <CardHeader title="Quick actions" />
          <div className="flex flex-col gap-2">
            {[
              { label: "Record a payment",  href: "/dashboard/collections" },
              { label: "Add a student",     href: "/dashboard/students"    },
              { label: "Enter results",     href: "/dashboard/academics"   },
              { label: "Manage classes",    href: "/dashboard/classes"     },
              { label: "Staff duties",      href: "/dashboard/duties"      },
            ].map((action) => (
              <a
                key={action.href}
                href={action.href}
                className="flex items-center justify-between px-3 py-2.5 rounded border border-border hover:bg-surface-secondary hover:border-border-strong transition-colors duration-150 no-underline group"
              >
                <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
                  {action.label}
                </span>
                <span className="text-text-muted group-hover:text-text-primary transition-colors text-xs">→</span>
              </a>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}