"use client";

import { useState } from "react";
import { Plus, Search, CreditCard, ExternalLink } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  PageHeader, Card, StatCard, Badge,
  Button, Modal, Input, Select, EmptyState, Table,
} from "@/components/ui";
import {
  useFeeDashboard, useInvoices, useCreateInvoice,
  useRecordPayment, useDunningConfig, useUpdateDunningConfig,
  openReceipt,
} from "@/lib/queries/fees";
import { useStudents } from "@/lib/queries/students";
import { usePermission } from "@/lib/hooks/usePermission";
import { ReadOnlyBanner } from "@/components/dashboard/ReadOnlyBanner";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { FeeInvoice, PaymentStatus, SelectOption } from "@/types";

// ── Schemas ───────────────────────────────────────────────────

const invoiceSchema = z.object({
  studentId:   z.string().min(1, "Select a student"),
  termLabel:   z.string().min(1, "Enter term label"),
  totalAmount: z.coerce.number().min(1, "Enter the total amount"),
});

const paymentSchema = z.object({
  invoiceId:       z.string().min(1, "Select an invoice"),
  percentageToPay: z.coerce.number().min(1).max(100, "Must be 1–100"),
  paymentMethod:   z.string().optional(),
  reference:       z.string().optional(),
  note:            z.string().optional(),
});

// Explicit types avoid Zod's z.coerce inference issues with React Hook Form
type InvoiceForm = {
  studentId:   string;
  termLabel:   string;
  totalAmount: number;
};

type PaymentForm = {
  invoiceId:       string;
  percentageToPay: number;
  paymentMethod?:  string;
  reference?:      string;
  note?:           string;
};

// ── Helpers ───────────────────────────────────────────────────

function statusLabel(s: PaymentStatus) {
  if (s === "paid")           return "Paid";
  if (s === "partially_paid") return "Partial";
  return "Unpaid";
}
function statusVariant(s: PaymentStatus): "success" | "warning" | "error" {
  if (s === "paid")           return "success";
  if (s === "partially_paid") return "warning";
  return "error";
}

const METHOD_OPTIONS: SelectOption[] = [
  { value: "cash",          label: "Cash"          },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "pos",           label: "POS"           },
];

const STATUS_OPTIONS: SelectOption[] = [
  { value: "",               label: "All statuses"   },
  { value: "paid",           label: "Paid"           },
  { value: "partially_paid", label: "Partially Paid" },
  { value: "defaulter",      label: "Defaulter"      },
];

// ── Page ──────────────────────────────────────────────────────

export default function CollectionsPage() {
  const [activeTab,     setActiveTab    ] = useState<"ledger" | "reminders">("ledger");
  const [invoiceModal,  setInvoiceModal ] = useState(false);
  const [paymentModal,  setPaymentModal ] = useState(false);
  const [search,        setSearch       ] = useState("");
  const [statusFilter,  setStatusFilter ] = useState<PaymentStatus | "">("");

  const { can } = usePermission();
  const readOnly = !can.manageFees;

  const { data: metrics,         isLoading: metricsLoading } = useFeeDashboard();
  const { data: invoices = [],   isLoading: invoicesLoading } = useInvoices(
    statusFilter || undefined
  );
  const { data: students = [] }                               = useStudents();
  const { data: dunningConfig }                               = useDunningConfig();

  const createInvoice      = useCreateInvoice();
  const recordPayment      = useRecordPayment();
  const updateDunning      = useUpdateDunningConfig();

  const invoiceForm = useForm<InvoiceForm>({ resolver: zodResolver(invoiceSchema) as any });
  const paymentForm = useForm<PaymentForm>({ resolver: zodResolver(paymentSchema) as any });

  async function onInvoiceSubmit(data: InvoiceForm) {
    await createInvoice.mutateAsync(data);
    invoiceForm.reset();
    setInvoiceModal(false);
  }

  async function onPaymentSubmit(data: PaymentForm) {
    const result = await recordPayment.mutateAsync(data);
    paymentForm.reset();
    setPaymentModal(false);
    // Offer to open receipt immediately
    if (result.payment?.id) {
      openReceipt(result.payment.id);
    }
  }

  const filtered = invoices.filter((inv) => {
    if (!search) return true;
    const name = `${inv.student.firstName} ${inv.student.lastName}`.toLowerCase();
    return name.includes(search.toLowerCase()) ||
      (inv.student.admissionNumber ?? "").toLowerCase().includes(search.toLowerCase());
  });

  const studentOptions: SelectOption[] = students.map((s) => ({
    value: s.id,
    label: `${s.firstName} ${s.lastName}`,
  }));

  const invoiceOptions: SelectOption[] = invoices
    .filter((inv) => inv.paymentStatus !== "paid")
    .map((inv) => ({
      value: inv.id,
      label: `${inv.student.firstName} ${inv.student.lastName} — ${inv.termLabel} (Balance: ${formatCurrency(Number(inv.balance))})`,
    }));

  const columns = [
    {
      key: "student",
      header: "Student",
      render: (inv: FeeInvoice) => (
        <div>
          <p className="font-medium text-text-primary">
            {inv.student.firstName} {inv.student.lastName}
          </p>
          <p className="text-xs text-text-muted">{inv.student.admissionNumber ?? "—"}</p>
        </div>
      ),
    },
    {
      key: "term",
      header: "Term",
      render: (inv: FeeInvoice) => (
        <span className="text-text-secondary">{inv.termLabel}</span>
      ),
    },
    {
      key: "total",
      header: "Total",
      render: (inv: FeeInvoice) => (
        <span className="font-medium text-text-primary">
          {formatCurrency(Number(inv.totalAmount))}
        </span>
      ),
    },
    {
      key: "paid",
      header: "Paid",
      render: (inv: FeeInvoice) => (
        <span className="font-medium text-success">
          {formatCurrency(Number(inv.amountPaid))}
        </span>
      ),
    },
    {
      key: "balance",
      header: "Balance",
      render: (inv: FeeInvoice) => (
        <span className={Number(inv.balance) > 0 ? "text-error font-medium" : "text-text-muted"}>
          {formatCurrency(Number(inv.balance))}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (inv: FeeInvoice) => (
        <Badge
          label={statusLabel(inv.paymentStatus)}
          variant={statusVariant(inv.paymentStatus)}
        />
      ),
    },
  ];

  const isLoading = metricsLoading || invoicesLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="h-8 w-48 bg-surface-tertiary rounded animate-pulse" />
        <div className="grid sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-surface-tertiary rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-surface-tertiary rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        {readOnly && (
          <ReadOnlyBanner message="Only admins and bursars can record payments." />
        )}

        <PageHeader
          title="Collections"
          subtitle="Fee ledger and payment management"
          action={
            !readOnly ? (
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => setPaymentModal(true)}>
                  Record payment
                </Button>
                <Button size="sm" onClick={() => setInvoiceModal(true)}>
                  <Plus size={15} />
                  Create invoice
                </Button>
              </div>
            ) : undefined
          }
        />

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4">
          <StatCard
            title="Total expected"
            value={formatCurrency(metrics?.totalExpected ?? 0)}
            icon={CreditCard}
          />
          <StatCard
            title="Total collected"
            value={formatCurrency(metrics?.totalSecured ?? 0)}
            icon={CreditCard}
          />
          <StatCard
            title="Outstanding"
            value={formatCurrency(metrics?.totalDebt ?? 0)}
            icon={CreditCard}
          />
        </div>

        {/* Status breakdown */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Paid",           value: metrics?.paidCount      ?? 0, color: "text-success" },
            { label: "Partially paid", value: metrics?.partialCount    ?? 0, color: "text-warning" },
            { label: "Defaulters",     value: metrics?.defaulterCount  ?? 0, color: "text-error"   },
          ].map((item) => (
            <Card key={item.label} padding="sm">
              <p className="text-xs text-text-muted mb-1">{item.label}</p>
              <p className={`text-2xl font-semibold ${item.color}`}>{item.value}</p>
              <p className="text-xs text-text-muted">students</p>
            </Card>
          ))}
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
              {tab === "ledger" ? "Payment Ledger" : "Dunning Reminders"}
            </button>
          ))}
        </div>

        {/* Ledger */}
        {activeTab === "ledger" && (
          <Card padding="none">
            <div className="p-4 border-b border-border flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-48">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="search"
                  placeholder="Search by student name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-9 pl-8 pr-3 text-sm border border-border rounded bg-surface focus:outline-2 focus:outline-navy-600 placeholder:text-text-muted"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as PaymentStatus | "")}
                className="h-9 px-3 text-sm border border-border rounded bg-surface text-text-primary focus:outline-2 focus:outline-navy-600"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {filtered.length === 0 ? (
              <EmptyState
                icon={CreditCard}
                title="No invoices found"
                description={
                  search || statusFilter
                    ? "Try adjusting your search or filter."
                    : "Create an invoice to start tracking payments."
                }
              />
            ) : (
              <Table
                columns={columns}
                data={filtered}
                keyExtractor={(inv) => inv.id}
              />
            )}
          </Card>
        )}

        {/* Reminders */}
        {activeTab === "reminders" && (
          <Card>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm font-semibold text-text-primary">Dunning email reminders</p>
                <p className="text-xs text-text-muted mt-0.5">
                  Automatic fee reminder emails sent daily to parents with outstanding balances
                </p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-sm text-text-secondary">
                  {dunningConfig?.enabled ? "Enabled" : "Disabled"}
                </span>
                <button
                  role="switch"
                  aria-checked={dunningConfig?.enabled}
                  onClick={() =>
                    updateDunning.mutate({ enabled: !dunningConfig?.enabled })
                  }
                  className={`relative inline-flex h-5 w-9 rounded-full border-2 border-transparent transition-colors cursor-pointer ${
                    dunningConfig?.enabled ? "bg-navy-600" : "bg-border"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                      dunningConfig?.enabled ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </label>
            </div>

            {dunningConfig && (
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-xs text-text-muted mb-1">Days before exam to start reminders</p>
                  <p className="text-sm font-medium text-text-primary">
                    {dunningConfig.daysBeforeExam} days
                  </p>
                </div>
                {dunningConfig.emailTemplate && (
                  <div>
                    <p className="text-xs text-text-muted mb-1">Custom email template</p>
                    <p className="text-sm text-text-secondary bg-surface-secondary border border-border rounded p-3">
                      {dunningConfig.emailTemplate}
                    </p>
                  </div>
                )}
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Create Invoice Modal */}
      <Modal
        isOpen={invoiceModal}
        onClose={() => { setInvoiceModal(false); invoiceForm.reset(); }}
        title="Create invoice"
        subtitle="Create a fee invoice for a student"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setInvoiceModal(false); invoiceForm.reset(); }}>
              Cancel
            </Button>
            <Button
              loading={createInvoice.isPending}
              onClick={invoiceForm.handleSubmit(onInvoiceSubmit)}
            >
              Create invoice
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {createInvoice.error && (
            <p className="text-sm text-error">{(createInvoice.error as Error).message}</p>
          )}
          <Select
            label="Student"
            required
            options={studentOptions}
            placeholder="Select student"
            error={invoiceForm.formState.errors.studentId?.message}
            {...invoiceForm.register("studentId")}
          />
          <Input
            label="Term label"
            placeholder="e.g. First Term 2024/2025"
            required
            error={invoiceForm.formState.errors.termLabel?.message}
            {...invoiceForm.register("termLabel")}
          />
          <Input
            label="Total amount (₦)"
            type="number"
            required
            placeholder="150000"
            error={invoiceForm.formState.errors.totalAmount?.message}
            {...invoiceForm.register("totalAmount")}
          />
        </div>
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        isOpen={paymentModal}
        onClose={() => { setPaymentModal(false); paymentForm.reset(); }}
        title="Record payment"
        subtitle="Enter the percentage of the invoice being paid"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setPaymentModal(false); paymentForm.reset(); }}>
              Cancel
            </Button>
            <Button
              loading={recordPayment.isPending}
              onClick={paymentForm.handleSubmit(onPaymentSubmit)}
            >
              Record & open receipt
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {recordPayment.error && (
            <p className="text-sm text-error">{(recordPayment.error as Error).message}</p>
          )}
          <Select
            label="Invoice"
            required
            options={invoiceOptions}
            placeholder="Select invoice"
            error={paymentForm.formState.errors.invoiceId?.message}
            {...paymentForm.register("invoiceId")}
          />
          <Input
            label="Percentage to pay (1–100)"
            type="number"
            required
            placeholder="40"
            hint="e.g. 40 means 40% of the total invoice amount"
            error={paymentForm.formState.errors.percentageToPay?.message}
            {...paymentForm.register("percentageToPay")}
          />
          <Select
            label="Payment method"
            options={METHOD_OPTIONS}
            placeholder="Select method"
            {...paymentForm.register("paymentMethod")}
          />
          <Input
            label="Reference / teller number"
            placeholder="Optional"
            {...paymentForm.register("reference")}
          />
          <Input
            label="Note"
            placeholder="Optional note for the receipt"
            {...paymentForm.register("note")}
          />
        </div>
      </Modal>
    </>
  );
}