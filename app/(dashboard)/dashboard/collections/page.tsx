"use client";

import { useState } from "react";
import {
  Plus, Search, CreditCard, ChevronDown,
  ChevronRight, Mail, FileText, Loader2,
  CheckCircle, AlertCircle, X,
} from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  PageHeader, Card, CardHeader, StatCard, Badge,
  Button, Modal, Input, Select, EmptyState,
} from "@/components/ui";
import {
  useFeeTemplates, useCreateFeeTemplate, useGenerateInvoices,
  useFeeDashboard, useInvoices, useCreateInvoice,
  useInvoicePayments, useRecordPayment,
  useSendFeeReminders, useDunningConfig, useUpdateDunningConfig,
  openReceipt,
} from "@/lib/queries/fees";
import { useClasses } from "@/lib/queries/classes";
import { useStudents } from "@/lib/queries/students";
import { usePermission } from "@/lib/hooks/usePermission";
import { ReadOnlyBanner } from "@/components/dashboard/ReadOnlyBanner";
import { classNames, formatCurrency } from "@/lib/utils";
import type { FeeInvoice, PaymentStatus, PaymentMethod, Payment } from "@/types";

// ── Constants ─────────────────────────────────────────────────

const METHOD_OPTIONS = [
  { value: "cash",          label: "Cash"          },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "pos",           label: "POS"           },
];

const STATUS_OPTIONS = [
  { value: "",               label: "All statuses"   },
  { value: "paid",           label: "Paid"           },
  { value: "partially_paid", label: "Partially Paid" },
  { value: "defaulter",      label: "Defaulter"      },
];

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

function methodLabel(m: PaymentMethod): string {
  const map: Record<PaymentMethod, string> = {
    cash: "Cash", bank_transfer: "Bank Transfer",
    pos: "POS", paystack: "Paystack",
  };
  return map[m] ?? m;
}

function methodVariant(m: PaymentMethod): "success" | "navy" | "default" {
  if (m === "paystack") return "success";
  if (m === "cash")     return "navy";
  return "default";
}

// ── Schemas ───────────────────────────────────────────────────

const templateSchema = z.object({
  classId:     z.string().optional(),
  termLabel:   z.string().min(1, "Term label is required"),
  description: z.string().optional(),
  lineItems: z.array(z.object({
    label:  z.string().min(1, "Label is required"),
    amount: z.coerce.number().min(1, "Amount must be greater than 0"),
  })).min(1, "Add at least one line item"),
});

const paymentSchema = z.object({
  invoiceId:     z.string().min(1, "Select an invoice"),
  amount:        z.coerce.number().min(1, "Enter amount"),
  paymentMethod: z.enum(["cash", "bank_transfer", "pos"]),
  reference:     z.string().optional(),
  note:          z.string().optional(),
});

type TemplateForm = z.infer<typeof templateSchema>;
type PaymentForm  = {
  invoiceId:     string;
  amount:        number;
  paymentMethod: "cash" | "bank_transfer" | "pos";
  reference?:    string;
  note?:         string;
};

// ── Payment history panel ─────────────────────────────────────

function PaymentHistory({ invoiceId }: { invoiceId: string }) {
  const { data: payments = [], isLoading } = useInvoicePayments(invoiceId);

  if (isLoading) {
    return <div className="h-16 bg-surface-tertiary rounded animate-pulse mx-5 mb-4" />;
  }

  if (payments.length === 0) {
    return (
      <p className="text-xs text-text-muted px-5 pb-4">No payments recorded yet.</p>
    );
  }

  return (
    <div className="px-5 pb-4">
      <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
        Payment history
      </p>
      <div className="flex flex-col gap-2">
        {payments.map((p: Payment) => (
          <div
            key={p.id}
            className="flex items-center justify-between py-2 border-b border-border last:border-0"
          >
            <div className="flex items-center gap-2">
              <Badge
                label={methodLabel(p.paymentMethod)}
                variant={methodVariant(p.paymentMethod)}
              />
              <div>
                <p className="text-sm font-medium text-text-primary">
                  {formatCurrency(Number(p.amount))}
                </p>
                <p className="text-xs text-text-muted">
                  {new Date(p.createdAt).toLocaleDateString("en-NG")}
                  {p.reference ? ` · ${p.reference}` : ""}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-text-muted">Balance after</p>
              <p className="text-sm font-medium text-text-primary">
                {formatCurrency(Number(p.balanceAfter))}
              </p>
              <button
                onClick={() => openReceipt(p.id)}
                className="text-xs text-navy-600 hover:text-navy-700 cursor-pointer"
              >
                Receipt
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Invoice row ───────────────────────────────────────────────

function InvoiceRow({
  invoice,
  onRecordPayment,
  readOnly,
}: {
  invoice:         FeeInvoice;
  onRecordPayment: (inv: FeeInvoice) => void;
  readOnly:        boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b border-border last:border-0">
      {/* Main row */}
      <div
        className="flex items-center gap-4 px-5 py-3 hover:bg-surface-secondary transition-colors cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <button className="text-text-muted shrink-0">
          {expanded
            ? <ChevronDown size={15} />
            : <ChevronRight size={15} />
          }
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary">
            {invoice.student.firstName} {invoice.student.lastName}
          </p>
          <p className="text-xs text-text-muted">
            {invoice.student.admissionNumber ?? "—"} · {invoice.termLabel}
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-6 shrink-0 text-sm">
          <div className="text-right">
            <p className="text-xs text-text-muted">Total</p>
            <p className="font-medium text-text-primary">
              {formatCurrency(Number(invoice.totalAmount))}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-text-muted">Paid</p>
            <p className="font-medium text-success">
              {formatCurrency(Number(invoice.amountPaid))}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-text-muted">Balance</p>
            <p className={classNames(
              "font-medium",
              Number(invoice.balance) > 0 ? "text-error" : "text-text-muted",
            )}>
              {formatCurrency(Number(invoice.balance))}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge
            label={statusLabel(invoice.paymentStatus)}
            variant={statusVariant(invoice.paymentStatus)}
          />
          {!readOnly && invoice.paymentStatus !== "paid" && (
            <Button
              size="sm"
              variant="secondary"
              onClick={(e) => { e.stopPropagation(); onRecordPayment(invoice); }}
            >
              Record payment
            </Button>
          )}
        </div>
      </div>

      {/* Expanded payment history */}
      {expanded && <PaymentHistory invoiceId={invoice.id} />}
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────

function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type:    "success" | "error";
  onClose: () => void;
}) {
  return (
    <div className={classNames(
      "fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white max-w-xs",
      type === "success" ? "bg-success" : "bg-error",
    )}>
      {type === "success"
        ? <CheckCircle size={16} className="shrink-0" />
        : <AlertCircle size={16} className="shrink-0" />
      }
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="cursor-pointer opacity-70 hover:opacity-100">
        <X size={14} />
      </button>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────

type Tab = "invoices" | "templates" | "reminders";

export default function CollectionsPage() {
  const [activeTab,      setActiveTab     ] = useState<Tab>("invoices");
  const [templateModal,  setTemplateModal ] = useState(false);
  const [paymentModal,   setPaymentModal  ] = useState(false);
  const [selectedInvoice,setSelectedInvoice] = useState<FeeInvoice | null>(null);
  const [search,         setSearch        ] = useState("");
  const [statusFilter,   setStatusFilter  ] = useState<PaymentStatus | "">("");
  const [toast,          setToast         ] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const { can }  = usePermission();
  const readOnly = !can.manageFees;

  // Data
  const { data: metrics,       isLoading: metricsLoading  } = useFeeDashboard();
  const { data: invoices = [], isLoading: invoicesLoading } = useInvoices(statusFilter || undefined);
  const { data: templates = [], isLoading: templatesLoading } = useFeeTemplates();
  const { data: classes   = [] }                             = useClasses();
  const { data: students  = [] }                             = useStudents();
  const { data: dunning   }                                  = useDunningConfig();

  // Mutations
  const createTemplate   = useCreateFeeTemplate();
  const generateInvoices = useGenerateInvoices();
  const createInvoice    = useCreateInvoice();
  const recordPayment    = useRecordPayment();
  const sendReminders    = useSendFeeReminders();
  const updateDunning    = useUpdateDunningConfig();

  // Template form
  const templateForm = useForm<TemplateForm>({
    resolver: zodResolver(templateSchema) as any,
    defaultValues: { lineItems: [{ label: "Tuition", amount: 0 }] },
  });
  const { fields, append, remove } = useFieldArray({
    control: templateForm.control,
    name:    "lineItems",
  });

  // Payment form
  const paymentForm = useForm<PaymentForm>({
    resolver: zodResolver(paymentSchema) as any,
    defaultValues: { paymentMethod: "cash" },
  });

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  // ── Handlers ────────────────────────────────────────────────

  async function onTemplateSubmit(data: TemplateForm) {
    try {
      await createTemplate.mutateAsync(data);
      templateForm.reset({ lineItems: [{ label: "Tuition", amount: 0 }] });
      setTemplateModal(false);
      showToast("Fee template created.", "success");
    } catch (err) {
      showToast((err as Error).message, "error");
    }
  }

  async function handleGenerateInvoices(templateId: string) {
    try {
      const result = await generateInvoices.mutateAsync(templateId);
      showToast(
        `${result.generated} invoice${result.generated !== 1 ? "s" : ""} generated. ${result.skipped} skipped (already exist).`,
        "success",
      );
    } catch (err) {
      showToast((err as Error).message, "error");
    }
  }

  function openPaymentModal(invoice: FeeInvoice) {
    setSelectedInvoice(invoice);
    paymentForm.reset({
      invoiceId:     invoice.id,
      amount:        Number(invoice.balance),
      paymentMethod: "cash",
    });
    setPaymentModal(true);
  }

  async function onPaymentSubmit(data: PaymentForm) {
    try {
      const result = await recordPayment.mutateAsync({
        ...data,
        paymentMethod: data.paymentMethod as PaymentMethod,
      });
      paymentForm.reset();
      setPaymentModal(false);
      setSelectedInvoice(null);
      showToast(`Payment of ${formatCurrency(data.amount)} recorded. Receipt generated.`, "success");
      openReceipt(result.payment.id);
    } catch (err) {
      showToast((err as Error).message, "error");
    }
  }

  async function handleSendReminders() {
    if (!confirm(
      `This will send fee reminder emails to all parents with outstanding balances. Continue?`
    )) return;
    try {
      const result = await sendReminders.mutateAsync();
      showToast(`Reminder emails sent to ${result.sent} parent${result.sent !== 1 ? "s" : ""}.`, "success");
    } catch (err) {
      showToast((err as Error).message, "error");
    }
  }

  // ── Filters ──────────────────────────────────────────────────

  const filtered = invoices.filter((inv) => {
    if (!search) return true;
    const name = `${inv.student.firstName} ${inv.student.lastName}`.toLowerCase();
    return (
      name.includes(search.toLowerCase()) ||
      (inv.student.admissionNumber ?? "").toLowerCase().includes(search.toLowerCase())
    );
  });

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
          <ReadOnlyBanner message="Only admins and bursars can manage fees." />
        )}

        <PageHeader
          title="Collections"
          subtitle="Fee management and payment tracking"
          action={
            !readOnly ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  loading={sendReminders.isPending}
                  onClick={handleSendReminders}
                >
                  <Mail size={14} />
                  Send reminders
                </Button>
                <Button size="sm" onClick={() => setTemplateModal(true)}>
                  <Plus size={14} />
                  New fee template
                </Button>
              </div>
            ) : undefined
          }
        />

        {/* Stat cards */}
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

        {/* Quick status counts */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Fully paid",     value: metrics?.paidCount      ?? 0, color: "text-success" },
            { label: "Partially paid", value: metrics?.partialCount    ?? 0, color: "text-warning" },
            { label: "Defaulters",     value: metrics?.defaulterCount  ?? 0, color: "text-error"   },
          ].map((item) => (
            <Card key={item.label} padding="sm">
              <p className="text-xs text-text-muted mb-1">{item.label}</p>
              <p className={classNames("text-2xl font-semibold", item.color)}>{item.value}</p>
              <p className="text-xs text-text-muted">students</p>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border">
          {([
            { id: "invoices",   label: "Fee Ledger"     },
            { id: "templates",  label: "Fee Templates"  },
            { id: "reminders",  label: "Reminders"      },
          ] as { id: Tab; label: string }[]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={classNames(
                "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer",
                activeTab === tab.id
                  ? "border-navy-600 text-navy-600"
                  : "border-transparent text-text-muted hover:text-text-primary",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Fee Ledger tab ── */}
        {activeTab === "invoices" && (
          <Card padding="none">
            <div className="p-4 border-b border-border flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-48">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="search"
                  placeholder="Search by student name or admission number..."
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
                title={search || statusFilter ? "No invoices match your filter" : "No invoices yet"}
                description={
                  search || statusFilter
                    ? "Try adjusting your search or filter."
                    : "Create a fee template and generate invoices to get started."
                }
              />
            ) : (
              <div>
                {filtered.map((inv) => (
                  <InvoiceRow
                    key={inv.id}
                    invoice={inv}
                    onRecordPayment={openPaymentModal}
                    readOnly={readOnly}
                  />
                ))}
              </div>
            )}
          </Card>
        )}

        {/* ── Templates tab ── */}
        {activeTab === "templates" && (
          <div className="flex flex-col gap-4">
            {!readOnly && (
              <div className="flex justify-end">
                <Button size="sm" onClick={() => setTemplateModal(true)}>
                  <Plus size={14} />
                  New template
                </Button>
              </div>
            )}

            {templatesLoading ? (
              <div className="h-48 bg-surface-tertiary rounded-lg animate-pulse" />
            ) : templates.length === 0 ? (
              <Card>
                <EmptyState
                  icon={FileText}
                  title="No fee templates"
                  description="Create a template to define what each class owes per term, then generate invoices in one click."
                  action={
                    !readOnly ? (
                      <Button size="sm" onClick={() => setTemplateModal(true)}>
                        <Plus size={14} />
                        Create first template
                      </Button>
                    ) : undefined
                  }
                />
              </Card>
            ) : (
              templates.map((template) => (
                <Card key={template.id} padding="none">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                    <div>
                      <p className="text-sm font-semibold text-text-primary">
                        {template.class?.name ?? "All classes"} — {template.termLabel}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5">
                        Total: {formatCurrency(Number(template.totalAmount))}
                        {template.description ? ` · ${template.description}` : ""}
                      </p>
                    </div>
                    {!readOnly && (
                      <Button
                        size="sm"
                        loading={generateInvoices.isPending}
                        onClick={() => handleGenerateInvoices(template.id)}
                      >
                        Generate invoices
                      </Button>
                    )}
                  </div>
                  <div className="divide-y divide-border">
                    {template.lineItems.map((item:any) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between px-5 py-2.5 hover:bg-surface-secondary"
                      >
                        <span className="text-sm text-text-secondary">{item.label}</span>
                        <span className="text-sm font-medium text-text-primary">
                          {formatCurrency(item.amount)}
                        </span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between px-5 py-2.5 bg-surface-secondary">
                      <span className="text-sm font-semibold text-text-primary">Total</span>
                      <span className="text-sm font-semibold text-text-primary">
                        {formatCurrency(Number(template.totalAmount))}
                      </span>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* ── Reminders tab ── */}
        {activeTab === "reminders" && (
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader
                title="Send fee reminders"
                subtitle="Email all parents with outstanding balances — includes a payment link"
              />
              <div className="flex items-center gap-4 mt-4">
                <div className="flex-1 p-4 bg-surface-secondary border border-border rounded-lg">
                  <p className="text-sm text-text-secondary">
                    <span className="font-semibold text-error">{metrics?.defaulterCount ?? 0}</span> defaulters
                    &nbsp;+&nbsp;
                    <span className="font-semibold text-warning">{metrics?.partialCount ?? 0}</span> partially paid
                    &nbsp;=&nbsp;
                    <span className="font-semibold text-text-primary">
                      {(metrics?.defaulterCount ?? 0) + (metrics?.partialCount ?? 0)}
                    </span> emails will be sent
                  </p>
                </div>
                {!readOnly && (
                  <Button
                    loading={sendReminders.isPending}
                    onClick={handleSendReminders}
                  >
                    <Mail size={14} />
                    Send reminders now
                  </Button>
                )}
              </div>
            </Card>

            <Card>
              <CardHeader
                title="Email template"
                subtitle="Customise the reminder message parents receive"
              />
              <div className="flex flex-col gap-4 mt-4">
                <textarea
                  rows={5}
                  defaultValue={dunning?.emailTemplate ?? ""}
                  placeholder="Leave blank to use the default message..."
                  className="w-full px-3 py-2 text-sm border border-border rounded bg-surface text-text-primary focus:outline-2 focus:outline-navy-600 placeholder:text-text-muted resize-none"
                  onBlur={(e) =>
                    updateDunning.mutate({ emailTemplate: e.target.value || undefined })
                  }
                />
                <p className="text-xs text-text-muted">
                  Changes save automatically when you click out of the text box.
                  The parent's name, student's name, balance, and payment link are always appended automatically.
                </p>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* ── Create Template Modal ── */}
      <Modal
        isOpen={templateModal}
        onClose={() => { setTemplateModal(false); templateForm.reset({ lineItems: [{ label: "Tuition", amount: 0 }] }); }}
        title="Create fee template"
        subtitle="Define what a class owes per term. You can generate invoices for all students in one click."
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setTemplateModal(false); templateForm.reset({ lineItems: [{ label: "Tuition", amount: 0 }] }); }}>
              Cancel
            </Button>
            <Button
              loading={createTemplate.isPending}
              onClick={templateForm.handleSubmit(onTemplateSubmit)}
            >
              Save template
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1.5">
                Class <span className="text-text-muted font-normal">(optional — leave blank for all classes)</span>
              </label>
              <select
                className="w-full h-9 px-3 text-sm border border-border rounded bg-surface text-text-primary focus:outline-2 focus:outline-navy-600"
                {...templateForm.register("classId")}
              >
                <option value="">All classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <Input
              label="Term label"
              placeholder="e.g. First Term 2024/2025"
              required
              error={templateForm.formState.errors.termLabel?.message}
              {...templateForm.register("termLabel")}
            />
          </div>

          <Input
            label="Description"
            placeholder="Optional notes"
            {...templateForm.register("description")}
          />

          {/* Line items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-text-primary uppercase tracking-wide">
                Fee breakdown
              </label>
              <button
                type="button"
                onClick={() => append({ label: "", amount: 0 })}
                className="text-xs text-navy-600 hover:text-navy-700 font-medium cursor-pointer"
              >
                + Add line item
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {fields.map((field, idx) => (
                <div key={field.id} className="flex items-start gap-2">
                  <div className="flex-1">
                    <input
                      placeholder="e.g. Tuition"
                      className="w-full h-9 px-3 text-sm border border-border rounded bg-surface text-text-primary focus:outline-2 focus:outline-navy-600 placeholder:text-text-muted"
                      {...templateForm.register(`lineItems.${idx}.label`)}
                    />
                  </div>
                  <div className="w-36">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">₦</span>
                      <input
                        type="number"
                        placeholder="0"
                        className="w-full h-9 pl-6 pr-3 text-sm border border-border rounded bg-surface text-text-primary focus:outline-2 focus:outline-navy-600"
                        {...templateForm.register(`lineItems.${idx}.amount`)}
                      />
                    </div>
                  </div>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(idx)}
                      className="h-9 w-9 flex items-center justify-center text-text-muted hover:text-error transition-colors cursor-pointer shrink-0"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Live total */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
              <span className="text-sm font-semibold text-text-primary">Total</span>
              <span className="text-sm font-semibold text-text-primary">
                {formatCurrency(
                  templateForm.watch("lineItems")?.reduce(
                    (sum, item) => sum + (Number(item.amount) || 0), 0
                  ) ?? 0
                )}
              </span>
            </div>

            {templateForm.formState.errors.lineItems && (
              <p className="text-xs text-error mt-1">
                {templateForm.formState.errors.lineItems.message}
              </p>
            )}
          </div>
        </div>
      </Modal>

      {/* ── Record Payment Modal ── */}
      <Modal
        isOpen={paymentModal}
        onClose={() => { setPaymentModal(false); setSelectedInvoice(null); paymentForm.reset(); }}
        title="Record payment"
        subtitle={
          selectedInvoice
            ? `${selectedInvoice.student.firstName} ${selectedInvoice.student.lastName} · Balance: ${formatCurrency(Number(selectedInvoice.balance))}`
            : ""
        }
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => { setPaymentModal(false); setSelectedInvoice(null); paymentForm.reset(); }}
            >
              Cancel
            </Button>
            <Button
              loading={recordPayment.isPending}
              onClick={paymentForm.handleSubmit(onPaymentSubmit)}
            >
              Save & open receipt
            </Button>
          </>
        }
      >
        {selectedInvoice && (
          <div className="flex flex-col gap-4">
            {/* Invoice line items breakdown */}
            {selectedInvoice.lineItems && selectedInvoice.lineItems.length > 0 && (
              <div className="p-3 bg-surface-secondary border border-border rounded-lg">
                <div className="flex flex-col gap-1">
                  {selectedInvoice.lineItems.map((item) => (
                    <div key={item.label} className="flex items-center justify-between text-xs">
                      <span className="text-text-muted">{item.label}</span>
                      <span className="text-text-secondary">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between text-xs font-semibold pt-1 mt-1 border-t border-border">
                    <span className="text-text-primary">Outstanding balance</span>
                    <span className="text-error">{formatCurrency(Number(selectedInvoice.balance))}</span>
                  </div>
                </div>
              </div>
            )}

            <Input
              label="Amount (₦)"
              type="number"
              required
              hint={`Max: ${formatCurrency(Number(selectedInvoice.balance))}`}
              error={paymentForm.formState.errors.amount?.message}
              {...paymentForm.register("amount")}
            />

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1.5">
                Payment method <span className="text-error">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {METHOD_OPTIONS.map((opt) => {
                  const selected = paymentForm.watch("paymentMethod") === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => paymentForm.setValue("paymentMethod", opt.value as any)}
                      className={classNames(
                        "h-10 text-sm font-medium rounded border transition-colors cursor-pointer",
                        selected
                          ? "bg-navy-600 border-navy-600 text-white"
                          : "border-border text-text-secondary hover:border-navy-400 hover:text-navy-600",
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <Input
              label="Reference / Teller number"
              placeholder="e.g. GTB/20250115/001 (optional)"
              {...paymentForm.register("reference")}
            />

            <Input
              label="Note"
              placeholder="Optional internal note"
              {...paymentForm.register("note")}
            />
          </div>
        )}
      </Modal>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}