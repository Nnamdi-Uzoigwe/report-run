"use client";

import { useEffect, useState } from "react";
import {
  GraduationCap, Users, CreditCard,
  TrendingUp, AlertCircle,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  StatCard, Card, CardHeader, Badge, PageHeader,
} from "@/components/ui";
import { fetchDashboardMetrics } from "@/lib/api";
import { formatCurrency, formatDateTime, getPaymentStatusColor, getPaymentStatusLabel } from "@/lib/utils";
import type { DashboardMetrics } from "@/types";

// ── Sub-components ────────────────────────────────────────────

function AttendanceBar({ metrics }: { metrics: DashboardMetrics }) {
  const { present, absent, late, total } = metrics.attendanceSummary;
  const presentPct = Math.round((present / total) * 100);
  const absentPct  = Math.round((absent  / total) * 100);
  const latePct    = Math.round((late    / total) * 100);

  return (
    <Card>
      <CardHeader
        title="Today's attendance"
        subtitle={`${total} students total`}
      />
      <div className="flex rounded-full overflow-hidden h-3 mb-4">
        <div className="bg-success transition-all" style={{ width: `${presentPct}%` }} />
        <div className="bg-warning transition-all" style={{ width: `${latePct}%`    }} />
        <div className="bg-error transition-all"   style={{ width: `${absentPct}%`  }} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Present", value: present, color: "text-success" },
          { label: "Late",    value: late,    color: "text-warning"  },
          { label: "Absent",  value: absent,  color: "text-error"    },
        ].map((item) => (
          <div key={item.label} className="text-center">
            <p className={`text-xl font-semibold ${item.color}`}>{item.value}</p>
            <p className="text-xs text-text-muted mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function CollectionChart({ data }: { data: DashboardMetrics["feeCollectionByMonth"] }) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader
        title="Fee collection"
        subtitle="Expected vs collected — current session"
      />
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} barGap={4}>
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
      <div className="flex items-center gap-5 mt-2">
        {[
          { color: "bg-navy-600",           label: "Collected" },
          { color: "bg-surface-tertiary border border-border", label: "Expected"  },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded-sm inline-block ${item.color}`} />
            <span className="text-xs text-text-muted">{item.label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function RecentPayments({ payments }: { payments: DashboardMetrics["recentPayments"] }) {
  return (
    <Card className="lg:col-span-3">
      <CardHeader title="Recent payments" subtitle="Last 5 transactions" />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {["Student", "Class", "Amount", "Status", "Date"].map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-text-muted uppercase tracking-wide px-0 py-2 pr-4 last:pr-0">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0">
                <td className="py-3 pr-4">
                  <p className="font-medium text-text-primary">{p.studentName}</p>
                  <p className="text-xs text-text-muted">{p.admissionNumber}</p>
                </td>
                <td className="py-3 pr-4 text-text-secondary">{p.className}</td>
                <td className="py-3 pr-4 font-medium text-text-primary">
                  {formatCurrency(p.amountPaid)}
                </td>
                <td className="py-3 pr-4">
                  <Badge
                    label={getPaymentStatusLabel(p.status)}
                    className={getPaymentStatusColor(p.status)}
                  />
                </td>
                <td className="py-3 text-text-muted text-xs">
                  {p.paidAt ? formatDateTime(p.paidAt) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError  ] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardMetrics()
      .then(setMetrics)
      .catch(() => setError("Failed to load dashboard data."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
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

  if (error || !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-error">
          <AlertCircle size={18} />
          <p className="text-sm">{error ?? "No data available."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        subtitle={`Greenfield Academy — Third Term, 2024/2025`}
      />

      {/* Stat cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total students"
          value={metrics.totalStudents.toLocaleString()}
          icon={GraduationCap}
          trend={{ value: 4, label: "vs last term", direction: "up" }}
        />
        <StatCard
          title="Total staff"
          value={metrics.totalStaff}
          icon={Users}
          trend={{ value: 0, label: "no change", direction: "neutral" }}
        />
        <StatCard
          title="Collection rate"
          value={`${metrics.collectionRate}%`}
          icon={TrendingUp}
          trend={{ value: 8, label: "vs last term", direction: "up" }}
        />
        <StatCard
          title="Pending fees"
          value={formatCurrency(metrics.pendingFees)}
          icon={CreditCard}
          trend={{ value: 12, label: "vs last term", direction: "down" }}
        />
      </div>

      {/* Chart + attendance */}
      <div className="grid lg:grid-cols-3 gap-4">
        <CollectionChart data={metrics.feeCollectionByMonth} />
        <AttendanceBar   metrics={metrics} />
      </div>

      {/* Recent payments */}
      <div className="grid lg:grid-cols-3 gap-4">
        <RecentPayments payments={metrics.recentPayments} />

        {/* Quick links */}
        <Card>
          <CardHeader title="Quick actions" />
          <div className="flex flex-col gap-2">
            {[
              { label: "Record a payment",  href: "/dashboard/collections" },
              { label: "Add a student",     href: "/dashboard/students"    },
              { label: "Enter results",     href: "/dashboard/academics"   },
              { label: "Assign duty",       href: "/dashboard/duties"      },
              { label: "Send a message",    href: "/dashboard/messages"    },
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