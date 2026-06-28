"use client";

import { useEffect, useState } from "react";
import { Plus, Search, AlertCircle, CreditCard, Download } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  PageHeader, Card, StatCard, Badge, Button,
  Modal, Input, Select, EmptyState, Table,
} from "@/components/ui";
import {
  fetchPayments, fetchStudents, fetchFeeCategories,
  fetchReminderConfigs, upsertReminderConfig, recordPayment,
} from "@/lib/api";
import {
  formatCurrency, formatDateTime,
  getPaymentStatusColor, getPaymentStatusLabel,
} from "@/lib/utils";
import type {
  Payment, Student, FeeCategory,
  ReminderConfig, PaymentMethod, SelectOption,
} from "@/types";

// ── Schemas ───────────────────────────────────────────────────

const paymentSchema = z.object({
  studentId:     z.string().min(1, "Select a student"),
  feeCategoryId: z.string().min(1, "Select a fee category"),
  amountPaid:    z.coerce.number().min(1, "Enter amount paid"),
  method:        z.string().min(1, "Select payment method"),
});

const reminderSchema = z.object({
  feeCategoryId:     z.string().min(1, "Select a fee category"),
  channel:           z.string().min(1, "Select a channel"),
  triggerDaysBefore: z.coerce.number().min(1).max(30),
  message:           z.string().min(10, "Message is too short"),
  isActive:          z.boolean().optional(),
});

type PaymentForm  = z.infer<typeof paymentSchema>;
type ReminderForm = z.infer<typeof reminderSchema>;

// ── Constants ─────────────────────────────────────────────────

const METHOD_OPTIONS: SelectOption[] = [
  { value: "cash",          label: "Cash"          },
  { value: "bank_transfer", label: "Bank Transfer"  },
  { value: "pos",           label: "POS"           },
  { value: "online",        label: "Online"        },
];

const CHANNEL_OPTIONS: SelectOption[] = [
  { value: "sms",   label: "SMS only"       },
  { value: "email", label: "Email only"     },
  { value: "both",  label: "SMS and Email"  },
];

// ── Page ──────────────────────────────────────────────────────

export default function CollectionsPage() {
  const [payments,        setPayments       ] = useState<Payment[]>([]);
  const [students,        setStudents       ] = useState<Student[]>([]);
  const [feeCategories,   setFeeCategories  ] = useState<FeeCategory[]>([]);
  const [reminders,       setReminders      ] = useState<ReminderConfig[]>([]);
  const [loading,         setLoading        ] = useState(true);
  const [error,           setError          ] = useState<string | null>(null);
  const [paymentModal,    setPaymentModal   ] = useState(false);
  const [reminderModal,   setReminderModal  ] = useState(false);
  const [saving,          setSaving         ] = useState(false);
  const [search,          setSearch         ] = useState("");
  const [statusFilter,    setStatusFilter   ] = useState("");
  const [activeTab,       setActiveTab      ] = useState<"ledger" | "reminders">("ledger");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const paymentForm = useForm<PaymentForm>({
    resolver: zodResolver(paymentSchema) as any,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reminderForm = useForm<ReminderForm>({
    resolver: zodResolver(reminderSchema) as any,
    defaultValues: { triggerDaysBefore: 7, isActive: true },
  });

  useEffect(() => {
    Promise.all([
      fetchPayments(),
      fetchStudents(),
      fetchFeeCategories(),
      fetchReminderConfigs(),
    ])
      .then(([p, s, f, r]) => {
        setPayments(p);
        setStudents(s);
        setFeeCategories(f);
        setReminders(r);
      })
      .catch(() => setError("Failed to load collections data."))
      .finally(() => setLoading(false));
  }, []);

  async function onPaymentSubmit(data: PaymentForm) {
    setSaving(true);
    try {
      const student  = students.find((s) => s.id === data.studentId);
      const category = feeCategories.find((f) => f.id === data.feeCategoryId);
      const created  = await recordPayment({
        studentId:       data.studentId,
        studentName:     student ? `${student.firstName} ${student.lastName}` : "",
        admissionNumber: student?.admissionNumber ?? "",
        className:       student?.className ?? "",
        feeCategoryId:   data.feeCategoryId,
        feeCategoryName: category?.name ?? "",
        amountDue:       category?.amount ?? 0,
        amountPaid:      data.amountPaid,
        balance:         (category?.amount ?? 0) - data.amountPaid,
        status:          data.amountPaid >= (category?.amount ?? 0) ? "paid" : "partial",
        method:          data.method as PaymentMethod,
        paidAt:          new Date().toISOString(),
        receiptNumber:   `RCP-${Date.now()}`,
        term:            "Third Term",
        session:         "2024/2025",
      });
      setPayments((prev) => [created, ...prev]);
      paymentForm.reset();
      setPaymentModal(false);
    } finally {
      setSaving(false);
    }
  }

  async function onReminderSubmit(data: ReminderForm) {
    setSaving(true);
    try {
      const category = feeCategories.find((f) => f.id === data.feeCategoryId);
      const created  = await upsertReminderConfig({
        feeCategoryId:     data.feeCategoryId,
        feeCategoryName:   category?.name ?? "",
        channel:           data.channel as ReminderConfig["channel"],
        triggerDaysBefore: data.triggerDaysBefore,
        message:           data.message,
        isActive:          data.isActive ?? true,
      });
      setReminders((prev) => [...prev, created]);
      reminderForm.reset();
      setReminderModal(false);
    } finally {
      setSaving(false);
    }
  }

  function toggleReminder(id: string) {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r))
    );
  }

  // Filtered payments
  const filtered = payments.filter((p) => {
    const matchesSearch =
      search === "" ||
      p.studentName.toLowerCase().includes(search.toLowerCase()) ||
      p.admissionNumber.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const totalCollected  = payments.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.amountPaid, 0);
  const totalPending    = payments.filter((p) => p.status !== "paid" && p.status !== "waived").reduce((sum, p) => sum + p.balance, 0);
  const paidCount       = payments.filter((p) => p.status === "paid").length;
  const unpaidCount     = payments.filter((p) => p.status === "unpaid").length;

  // Options
  const studentOptions: SelectOption[] = students.map((s) => ({
    value: s.id,
    label: `${s.firstName} ${s.lastName} (${s.admissionNumber})`,
  }));

  const feeCategoryOptions: SelectOption[] = feeCategories.map((f) => ({
    value: f.id,
    label: `${f.name} — ${formatCurrency(f.amount)}`,
  }));

  const statusOptions: SelectOption[] = [
    { value: "",        label: "All statuses" },
    { value: "paid",    label: "Paid"         },
    { value: "partial", label: "Partial"      },
    { value: "unpaid",  label: "Unpaid"       },
    { value: "waived",  label: "Waived"       },
  ];

  // Table columns
  const columns = [
    {
      key: "student",
      header: "Student",
      render: (p: Payment) => (
        <div>
          <p className="font-medium text-text-primary">{p.studentName}</p>
          <p className="text-xs text-text-muted">{p.admissionNumber}</p>
        </div>
      ),
    },
    {
      key: "class",
      header: "Class",
      render: (p: Payment) => (
        <span className="text-text-secondary">{p.className}</span>
      ),
    },
    {
      key: "category",
      header: "Fee",
      render: (p: Payment) => (
        <span className="text-text-secondary">{p.feeCategoryName}</span>
      ),
    },
    {
      key: "due",
      header: "Amount Due",
      render: (p: Payment) => (
        <span className="font-medium text-text-primary">
          {formatCurrency(p.amountDue)}
        </span>
      ),
    },
    {
      key: "paid",
      header: "Paid",
      render: (p: Payment) => (
        <span className="font-medium text-success">
          {formatCurrency(p.amountPaid)}
        </span>
      ),
    },
    {
      key: "balance",
      header: "Balance",
      render: (p: Payment) => (
        <span className={p.balance > 0 ? "text-error font-medium" : "text-text-muted"}>
          {formatCurrency(p.balance)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (p: Payment) => (
        <Badge
          label={getPaymentStatusLabel(p.status)}
          className={getPaymentStatusColor(p.status)}
        />
      ),
    },
    {
      key: "date",
      header: "Date",
      render: (p: Payment) => (
        <span className="text-xs text-text-muted">
          {p.paidAt ? formatDateTime(p.paidAt) : "—"}
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="h-8 w-48 bg-surface-tertiary rounded animate-pulse" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-surface-tertiary rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-surface-tertiary rounded-lg animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-error">
          <AlertCircle size={18} />
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Collections"
          subtitle="Third Term, 2024/2025"
          action={
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setReminderModal(true)}
              >
                Manage reminders
              </Button>
              <Button size="sm" onClick={() => setPaymentModal(true)}>
                <Plus size={15} />
                Record payment
              </Button>
            </div>
          }
        />

        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total collected"
            value={formatCurrency(totalCollected)}
            icon={CreditCard}
          />
          <StatCard
            title="Outstanding"
            value={formatCurrency(totalPending)}
            icon={AlertCircle}
          />
          <StatCard
            title="Fully paid"
            value={paidCount}
            icon={CreditCard}
            subtitle="students"
          />
          <StatCard
            title="Not yet paid"
            value={unpaidCount}
            icon={CreditCard}
            subtitle="students"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border">
          {(["ledger", "reminders"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors cursor-pointer ${
                activeTab === tab
                  ? "border-navy-600 text-navy-600"
                  : "border-transparent text-text-muted hover:text-text-primary"
              }`}
            >
              {tab === "ledger" ? "Payment Ledger" : "Reminder Rules"}
            </button>
          ))}
        </div>

        {/* Ledger tab */}
        {activeTab === "ledger" && (
          <Card padding="none">
            <div className="p-4 border-b border-border flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-48">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                />
                <input
                  type="search"
                  placeholder="Search by name or admission number..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-9 pl-8 pr-3 text-sm border border-border rounded bg-surface focus:outline-2 focus:outline-navy-600 placeholder:text-text-muted"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 px-3 text-sm border border-border rounded bg-surface text-text-primary focus:outline-2 focus:outline-navy-600"
              >
                {statusOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <Button variant="secondary" size="sm">
                <Download size={14} />
                Export
              </Button>
            </div>

            {filtered.length === 0 ? (
              <EmptyState
                icon={CreditCard}
                title="No payments found"
                description={
                  search || statusFilter
                    ? "Try adjusting your search or filter."
                    : "Record the first payment to get started."
                }
              />
            ) : (
              <Table
                columns={columns}
                data={filtered}
                keyExtractor={(p) => p.id}
              />
            )}
          </Card>
        )}

        {/* Reminders tab */}
        {activeTab === "reminders" && (
          <div className="flex flex-col gap-4">
            {reminders.length === 0 ? (
              <Card>
                <EmptyState
                  icon={CreditCard}
                  title="No reminder rules"
                  description="Set up automated reminders to improve your collection rate."
                  action={
                    <Button size="sm" onClick={() => setReminderModal(true)}>
                      <Plus size={14} />
                      Add reminder rule
                    </Button>
                  }
                />
              </Card>
            ) : (
              reminders.map((r) => (
                <Card key={r.id}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-text-primary">
                          {r.feeCategoryName}
                        </p>
                        <Badge
                          label={r.isActive ? "Active" : "Paused"}
                          variant={r.isActive ? "success" : "default"}
                        />
                      </div>
                      <p className="text-xs text-text-muted mb-2">
                        Send via {r.channel.toUpperCase()} —{" "}
                        {r.triggerDaysBefore} days before due date
                      </p>
                      <p className="text-sm text-text-secondary bg-surface-secondary border border-border rounded p-3">
                        {r.message}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={r.isActive ? "secondary" : "primary"}
                      onClick={() => toggleReminder(r.id)}
                    >
                      {r.isActive ? "Pause" : "Activate"}
                    </Button>
                  </div>
                </Card>
              ))
            )}
            <div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setReminderModal(true)}
              >
                <Plus size={14} />
                Add reminder rule
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={paymentModal}
        onClose={() => { setPaymentModal(false); paymentForm.reset(); }}
        title="Record payment"
        subtitle="Enter payment details for a student"
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => { setPaymentModal(false); paymentForm.reset(); }}
            >
              Cancel
            </Button>
            <Button
              loading={saving}
              onClick={paymentForm.handleSubmit(onPaymentSubmit as any)}
            >
              Record payment
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Select
            label="Student"
            required
            options={studentOptions}
            placeholder="Select student"
            error={paymentForm.formState.errors.studentId?.message}
            {...paymentForm.register("studentId")}
          />
          <Select
            label="Fee category"
            required
            options={feeCategoryOptions}
            placeholder="Select fee category"
            error={paymentForm.formState.errors.feeCategoryId?.message}
            {...paymentForm.register("feeCategoryId")}
          />
          <Input
            label="Amount paid (₦)"
            type="number"
            required
            placeholder="0"
            error={paymentForm.formState.errors.amountPaid?.message}
            {...paymentForm.register("amountPaid")}
          />
          <Select
            label="Payment method"
            required
            options={METHOD_OPTIONS}
            placeholder="Select method"
            error={paymentForm.formState.errors.method?.message}
            {...paymentForm.register("method")}
          />
        </div>
      </Modal>

      {/* Reminder Modal */}
      <Modal
        isOpen={reminderModal}
        onClose={() => { setReminderModal(false); reminderForm.reset(); }}
        title="Add reminder rule"
        subtitle="Configure an automated fee reminder"
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => { setReminderModal(false); reminderForm.reset(); }}
            >
              Cancel
            </Button>
            <Button
              loading={saving}
              onClick={reminderForm.handleSubmit(onReminderSubmit as any)}
            >
              Save rule
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Select
            label="Fee category"
            required
            options={feeCategoryOptions}
            placeholder="Select fee category"
            error={reminderForm.formState.errors.feeCategoryId?.message}
            {...reminderForm.register("feeCategoryId")}
          />
          <Select
            label="Channel"
            required
            options={CHANNEL_OPTIONS}
            placeholder="Select channel"
            error={reminderForm.formState.errors.channel?.message}
            {...reminderForm.register("channel")}
          />
          <Input
            label="Days before due date"
            type="number"
            required
            hint="Reminder will be sent this many days before the fee due date"
            error={reminderForm.formState.errors.triggerDaysBefore?.message}
            {...reminderForm.register("triggerDaysBefore")}
          />
          <Input
            label="Message"
            required
            placeholder="Dear Parent, this is a reminder..."
            error={reminderForm.formState.errors.message?.message}
            {...reminderForm.register("message")}
          />
        </div>
      </Modal>
    </>
  );
}