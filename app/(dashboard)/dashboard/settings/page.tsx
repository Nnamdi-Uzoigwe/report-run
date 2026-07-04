"use client";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { clientFetch } from "@/lib/client-fetch";
import { keys } from "@/lib/queries/keys";
import {
  Save, School, BookOpen, CreditCard,
  Shield, Plus, Trash2, CheckCircle, AlertCircle,
  Eye, EyeOff, Star, Building2, Loader2,
} from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  PageHeader, Card, CardHeader, Badge, Button, Input,
} from "@/components/ui";
import {
  useSchool, useUpdateSchool, useUploadSchoolLogo,
  useActiveSubscription, usePlans, useInitiateSubscription,
  useListBanks, useVerifyBankAccount, useSaveBankAccount,
} from "@/lib/queries/school";
import {
  useGradingSchemes, useCreateGradingScheme,
  useSetDefaultGradingScheme, useDeleteGradingScheme,
  useUpdateGradingScheme,
} from "@/lib/queries/classes";
import { usePermission } from "@/lib/hooks/usePermission";
import { useAuthStore } from "@/lib/store";
import { changePasswordAction } from "@/lib/actions/auth";
import { ReadOnlyBanner } from "@/components/dashboard/ReadOnlyBanner";
import { classNames, formatCurrency } from "@/lib/utils";
import type { GradeBand } from "@/types";
import Image from "next/image";

// ── Schemas ───────────────────────────────────────────────────

const schoolSchema = z.object({
  name:         z.string().min(2, "School name is required"),
  address:      z.string().optional(),
  phone:        z.string().optional(),
  currencyCode: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword:     z.string().min(8, "New password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Confirm your new password"),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords do not match",
  path:    ["confirmPassword"],
});

const gradingSchema = z.object({
  name:  z.string().min(1, "Scheme name is required"),
  bands: z.array(z.object({
    grade:    z.string().min(1, "Grade is required"),
    minScore: z.coerce.number().min(0).max(100),
    maxScore: z.coerce.number().min(0).max(100),
    remark:   z.string().optional(),
  })).min(1, "Add at least one grade band"),
});

type SchoolForm    = z.infer<typeof schoolSchema>;
type PasswordForm  = z.infer<typeof passwordSchema>;
type GradingForm   = z.infer<typeof gradingSchema>;

// ── Sub-components ────────────────────────────────────────────

function Toggle({
  checked, onChange, label, hint, disabled,
}: {
  checked:  boolean;
  onChange: (v: boolean) => void;
  label:    string;
  hint?:    string;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-4 border-b border-border last:border-0">
      <div>
        <p className="text-sm font-medium text-text-primary">{label}</p>
        {hint && <p className="text-xs text-text-muted mt-0.5">{hint}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={classNames(
          "relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors",
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
          checked ? "bg-navy-600" : "bg-border",
        )}
      >
        <span className={classNames(
          "inline-block h-4 w-4 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-4" : "translate-x-0",
        )} />
      </button>
    </div>
  );
}

function Toast({ message, type, onClose }: {
  message: string;
  type:    "success" | "error";
  onClose: () => void;
}) {
  return (
    <div className={classNames(
      "fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white",
      type === "success" ? "bg-success" : "bg-error",
    )}>
      {type === "success" ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
      {message}
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100 cursor-pointer">×</button>
    </div>
  );
}

function gradeVariant(grade: string): "success" | "warning" | "error" | "default" {
  if (["A","A1","B2","B3"].includes(grade))  return "success";
  if (["C4","C5","C6"].includes(grade))      return "warning";
  if (["F","F9","E8"].includes(grade))       return "error";
  return "default";
}

// ── TABS ──────────────────────────────────────────────────────

const TABS = [
  { id: "school",       label: "School Info",       icon: School    },
  { id: "grading",      label: "Grade Scale",        icon: BookOpen  },
  { id: "account",      label: "Account & Security", icon: Shield    },
  { id: "bank",         label: "Bank Account",       icon: CreditCard},
  { id: "subscription", label: "Subscription",       icon: CreditCard},
] as const;

type TabId = (typeof TABS)[number]["id"];

// ── Scheme Edit Form ─────────────────────────────────────────

function SchemeEditForm({
  scheme,
  onSave,
  saving,
}: {
  scheme:  any;
  onSave:  (data: { name: string; bands: GradeBand[] }) => Promise<void>;
  saving:  boolean;
}) {
  const form = useForm<GradingForm>({
    resolver:      zodResolver(gradingSchema) as any,
    defaultValues: {
      name:  scheme.name,
      bands: scheme.bands.map((b: GradeBand) => ({
        grade:    b.grade,
        minScore: b.minScore,
        maxScore: b.maxScore,
        remark:   b.remark ?? "",
      })),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name:    "bands",
  });

  return (
    <div className="p-4 flex flex-col gap-4">
      <Input
        label="Scheme name"
        required
        error={form.formState.errors.name?.message}
        {...form.register("name")}
      />

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-text-primary uppercase tracking-wide">Grade bands</label>
          <button
            type="button"
            onClick={() => append({ grade: "", minScore: 0, maxScore: 0, remark: "" })}
            className="text-xs text-navy-600 font-medium cursor-pointer hover:text-navy-700"
          >
            + Add band
          </button>
        </div>

        <div className="border border-border rounded-lg overflow-hidden">
          <div className="grid grid-cols-4 bg-surface-secondary border-b border-border">
            {["Grade","Min","Max","Remark"].map((h) => (
              <div key={h} className="px-3 py-2 text-xs font-semibold text-text-muted">{h}</div>
            ))}
          </div>
          {fields.map((field, idx) => (
            <div
              key={field.id}
              className={classNames(
                "grid grid-cols-4 border-b border-border last:border-0",
                idx % 2 === 0 ? "bg-surface" : "bg-surface-secondary",
              )}
            >
              <div className="px-2 py-2">
                <input
                  placeholder="A1"
                  className="w-full h-8 px-2 text-sm border border-border rounded bg-surface focus:outline-2 focus:outline-navy-600"
                  {...form.register(`bands.${idx}.grade`)}
                />
              </div>
              <div className="px-2 py-2">
                <input
                  type="number"
                  className="w-full h-8 px-2 text-sm border border-border rounded bg-surface focus:outline-2 focus:outline-navy-600"
                  {...form.register(`bands.${idx}.minScore`)}
                />
              </div>
              <div className="px-2 py-2">
                <input
                  type="number"
                  className="w-full h-8 px-2 text-sm border border-border rounded bg-surface focus:outline-2 focus:outline-navy-600"
                  {...form.register(`bands.${idx}.maxScore`)}
                />
              </div>
              <div className="px-2 py-2 flex items-center gap-1">
                <input
                  placeholder="Excellent"
                  className="w-full h-8 px-2 text-sm border border-border rounded bg-surface focus:outline-2 focus:outline-navy-600"
                  {...form.register(`bands.${idx}.remark`)}
                />
                <button
                  type="button"
                  onClick={() => remove(idx)}
                  className="p-1 text-text-muted hover:text-error cursor-pointer shrink-0"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          loading={saving}
          onClick={form.handleSubmit((data) => onSave(data as any))}
        >
          <Save size={14} />
          Save changes
        </Button>
      </div>
    </div>
  );
}

// ── Bank Account Section ──────────────────────────────────────

function BankAccountSection({
  school,
  readOnly,
  showToast,
}: {
  school:    any;
  readOnly:  boolean;
  showToast: (msg: string, type: "success" | "error") => void;
}) {
  const [selectedBankCode, setSelectedBankCode] = useState(school?.bankCode ?? "");
  const [accountNumber,    setAccountNumber    ] = useState(school?.bankAccountNumber ?? "");
  const [verified,         setVerified         ] = useState<{ accountName: string; accountNumber: string } | null>(
    school?.bankAccountName ? { accountName: school.bankAccountName, accountNumber: school.bankAccountNumber } : null
  );

  const { data: banks = [], isLoading: banksLoading } = useListBanks();
  const verifyAccount  = useVerifyBankAccount();
  const saveBankAccount = useSaveBankAccount();

  const selectedBank = banks.find((b) => b.code === selectedBankCode);

  async function handleVerify() {
    if (!accountNumber || accountNumber.length !== 10) {
      showToast("Enter a valid 10-digit account number.", "error");
      return;
    }
    if (!selectedBankCode) {
      showToast("Select a bank first.", "error");
      return;
    }
    setVerified(null);
    try {
      const result = await verifyAccount.mutateAsync({ accountNumber, bankCode: selectedBankCode });
      setVerified(result);
    } catch (err) {
      showToast((err as Error).message, "error");
    }
  }

  async function handleSave() {
    if (!verified || !selectedBank) return;
    try {
      await saveBankAccount.mutateAsync({
        accountNumber: verified.accountNumber,
        accountName:   verified.accountName,
        bankCode:      selectedBankCode,
        bankName:      selectedBank.name,
      });
      showToast("Bank account saved. Paystack subaccount created — online payments will now be split automatically.", "success");
    } catch (err) {
      showToast((err as Error).message, "error");
    }
  }

  const hasExisting = !!school?.paystackSubaccountCode;

  return (
    <div className="flex flex-col gap-4">
      {/* How it works */}
      <Card>
        <CardHeader
          title="Bank account & payment splitting"
          subtitle="Add your school's bank account to receive fee payments automatically"
        />
        <div className="mt-4 p-4 bg-navy-50 border border-navy-200 rounded-lg">
          <p className="text-xs font-semibold text-navy-700 mb-2">How online fee payments work:</p>
          <div className="flex flex-col gap-1.5 text-xs text-navy-600">
            <div className="flex items-start gap-2">
              <span className="font-bold shrink-0">Parent pays:</span>
              <span>Fee amount + 5% platform fee (e.g. ₦50,000 fee → parent pays ₦52,500)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold shrink-0">School receives:</span>
              <span>Exactly ₦50,000 — settled directly to your bank account by Paystack</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold shrink-0">ReportRun keeps:</span>
              <span>5% platform fee (Paystack's 1.5% processing fee is deducted from our share)</span>
            </div>
          </div>
        </div>

        {hasExisting && (
          <div className="mt-4 flex items-center gap-3 p-3 bg-success-light border border-success rounded-lg">
            <CheckCircle size={16} className="text-success shrink-0" />
            <div>
              <p className="text-sm font-semibold text-success">Bank account connected</p>
              <p className="text-xs text-success">
                {school.bankAccountName} — {school.bankName} ({school.bankAccountNumber})
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Setup form */}
      <Card>
        <CardHeader
          title={hasExisting ? "Update bank account" : "Connect bank account"}
          subtitle="Enter your account number and we'll verify it with Paystack"
        />
        <div className="flex flex-col gap-4 mt-4">

          {/* Bank select */}
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1.5">Bank <span className="text-error">*</span></label>
            {banksLoading ? (
              <div className="h-9 bg-surface-tertiary rounded animate-pulse" />
            ) : (
              <select
                value={selectedBankCode}
                onChange={(e) => { setSelectedBankCode(e.target.value); setVerified(null); }}
                disabled={readOnly}
                className="w-full h-9 px-3 text-sm border border-border rounded bg-surface text-text-primary focus:outline-2 focus:outline-navy-600 disabled:opacity-60"
              >
                <option value="">Select your bank...</option>
                {banks.map((b) => (
                  <option key={b.code} value={b.code}>{b.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Account number + verify */}
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1.5">
              Account number <span className="text-error">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={10}
                value={accountNumber}
                onChange={(e) => { setAccountNumber(e.target.value.replace(/\D/g, "")); setVerified(null); }}
                disabled={readOnly}
                placeholder="0123456789"
                className="flex-1 h-9 px-3 text-sm border border-border rounded bg-surface text-text-primary focus:outline-2 focus:outline-navy-600 disabled:opacity-60 font-mono tracking-widest"
              />
              <Button
                size="sm"
                variant="secondary"
                loading={verifyAccount.isPending}
                disabled={readOnly || accountNumber.length !== 10 || !selectedBankCode}
                onClick={handleVerify}
              >
                Verify
              </Button>
            </div>
            <p className="text-xs text-text-muted mt-1">Must be exactly 10 digits</p>
          </div>

          {/* Verification result */}
          {verifyAccount.isPending && (
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <Loader2 size={14} className="animate-spin" />
              Verifying with Paystack...
            </div>
          )}

          {verified && (
            <div className="flex items-center justify-between p-4 bg-success-light border border-success rounded-lg">
              <div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={15} className="text-success" />
                  <p className="text-sm font-semibold text-success">Account verified</p>
                </div>
                <p className="text-sm text-success mt-1">
                  <span className="font-bold">{verified.accountName}</span>
                  <span className="text-xs ml-2 opacity-70">({verified.accountNumber})</span>
                </p>
                <p className="text-xs text-success mt-0.5 opacity-80">
                  Confirm this is your school's account before saving.
                </p>
              </div>
              {!readOnly && (
                <Button
                  loading={saveBankAccount.isPending}
                  onClick={handleSave}
                >
                  {hasExisting ? "Update account" : "Save & connect"}
                </Button>
              )}
            </div>
          )}

          {verifyAccount.isError && (
            <div className="flex items-center gap-2 p-3 bg-error-light border border-error rounded text-sm text-error">
              <AlertCircle size={14} className="shrink-0" />
              {(verifyAccount.error as Error).message}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

// ── PAGE ──────────────────────────────────────────────────────

export default function SettingsPage() {
  const [activeTab,       setActiveTab      ] = useState<TabId>("school");
  const [toast,           setToast          ] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [showNewScheme,   setShowNewScheme  ] = useState(false);
  const [editingSchemeId, setEditingSchemeId] = useState<string | null>(null);
  const [showPwd,         setShowPwd        ] = useState({ current: false, new: false, confirm: false });
  const [billingCycle,    setBillingCycle   ] = useState<"monthly" | "annually">("monthly");

  // Verify payment and activate subscription when redirected back from Paystack
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("subscription") === "success") {
      const reference = params.get("reference");
      setActiveTab("subscription");
      // Clean URL first
      window.history.replaceState({}, "", window.location.pathname);

      if (reference) {
        // Call backend to verify and activate — this sets startsAt and expiresAt
        clientFetch(`/subscriptions/verify/${reference}`, { method: "POST" })
          .then(() => {
            showToast("Subscription activated! Your plan is now active.", "success");
            queryClient.invalidateQueries({ queryKey: keys.subscription.active(schoolId!) });
          })
          .catch(() => {
            showToast("Payment received — your plan will activate shortly.", "success");
          });
      } else {
        showToast("Payment received — your plan will activate shortly.", "success");
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Bank account state
  const [selectedBankCode, setSelectedBankCode] = useState("");
  const [accountNumber,    setAccountNumber    ] = useState("");
  const [verifiedName,     setVerifiedName     ] = useState<string | null>(null);

  const { can }  = usePermission();
  const readOnly = !can.manageSettings;
  const user     = useAuthStore((s) => s.user);
  const schoolId = useAuthStore((s) => s.schoolId);
  const queryClient = useQueryClient();

  // Data
  const { data: school,        isLoading: schoolLoading  } = useSchool();
  const { data: subscription                             } = useActiveSubscription();
  const { data: plans    = []                            } = usePlans(billingCycle);
  const { data: schemes  = [], isLoading: schemesLoading } = useGradingSchemes();

  // Mutations
  const updateSchool   = useUpdateSchool();
  const uploadLogo     = useUploadSchoolLogo();
  const createScheme   = useCreateGradingScheme();
  const setDefault     = useSetDefaultGradingScheme();
  const deleteScheme   = useDeleteGradingScheme();
  const updateScheme   = useUpdateGradingScheme();
  const initiateSub    = useInitiateSubscription();

  // Forms
  const schoolForm = useForm<SchoolForm>({
    resolver: zodResolver(schoolSchema),
    values:   school
      ? { name: school.name, address: school.address ?? "", phone: school.phone ?? "", currencyCode: school.currencyCode ?? "NGN" }
      : undefined,
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema) as any,
  });

  const gradingForm = useForm<GradingForm>({
    resolver:      zodResolver(gradingSchema) as any,
    defaultValues: {
      name:  "",
      bands: [
        { grade: "A1", minScore: 75, maxScore: 100, remark: "Excellent"  },
        { grade: "B2", minScore: 70, maxScore: 74,  remark: "Very Good"  },
        { grade: "B3", minScore: 65, maxScore: 69,  remark: "Good"       },
        { grade: "C4", minScore: 60, maxScore: 64,  remark: "Credit"     },
        { grade: "C5", minScore: 55, maxScore: 59,  remark: "Credit"     },
        { grade: "C6", minScore: 50, maxScore: 54,  remark: "Credit"     },
        { grade: "D7", minScore: 45, maxScore: 49,  remark: "Pass"       },
        { grade: "E8", minScore: 40, maxScore: 44,  remark: "Pass"       },
        { grade: "F9", minScore: 0,  maxScore: 39,  remark: "Fail"       },
      ],
    },
  });

  const { fields: bandFields, append: addBand, remove: removeBand } = useFieldArray({
    control: gradingForm.control,
    name:    "bands",
  });

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function onSchoolSave(data: SchoolForm) {
    try {
      await updateSchool.mutateAsync(data);
      showToast("School details saved.", "success");
    } catch (err) {
      showToast((err as Error).message, "error");
    }
  }

  async function onPasswordSave(data: PasswordForm) {
    try {
      const result = await changePasswordAction(data.currentPassword, data.newPassword);
      if (result.error) throw new Error(result.error);
      passwordForm.reset();
      showToast("Password changed successfully.", "success");
    } catch (err) {
      showToast((err as Error).message, "error");
    }
  }

  async function onGradingSave(data: GradingForm) {
    try {
      await createScheme.mutateAsync(data);
      gradingForm.reset();
      setShowNewScheme(false);
      showToast("Grading scheme created.", "success");
    } catch (err) {
      showToast((err as Error).message, "error");
    }
  }

  if (schoolLoading || schemesLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="h-8 w-48 bg-surface-tertiary rounded animate-pulse" />
        <div className="h-96 bg-surface-tertiary rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {readOnly && (
        <ReadOnlyBanner message="Only admins can modify school settings." />
      )}

      <PageHeader title="Settings" subtitle="School configuration and account management" />

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <Card padding="sm">
            <nav className="flex flex-col gap-0.5">
              {TABS.map((tab) => {
                const Icon     = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={classNames(
                      "flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors text-left cursor-pointer w-full",
                      isActive
                        ? "bg-navy-600 text-white"
                        : "text-text-secondary hover:text-text-primary hover:bg-surface-secondary",
                    )}
                  >
                    <Icon size={15} className="shrink-0" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </Card>

          {/* Subscription summary */}
          {subscription && (
            <Card padding="sm">
              <div className="flex items-center gap-2 mb-2">
                <Star size={13} className="text-gold-500" />
                <p className="text-xs font-semibold text-text-primary">Current plan</p>
              </div>
              <p className="text-sm font-bold text-text-primary">{subscription.plan.name}</p>
              <p className="text-xs text-text-muted mt-1">
                {subscription.plan.studentLimit
                  ? `Up to ${subscription.plan.studentLimit} students`
                  : "Unlimited students"}
              </p>
              {!readOnly && (
                <button
                  onClick={() => setActiveTab("subscription")}
                  className="text-xs text-navy-600 hover:text-navy-700 font-medium mt-2 cursor-pointer"
                >
                  Manage plan →
                </button>
              )}
            </Card>
          )}
        </div>

        {/* Content */}
        <div className="lg:col-span-3 flex flex-col gap-4">

          {/* ── SCHOOL INFO ── */}
          {activeTab === "school" && (
            <Card>
              <CardHeader
                title="School details"
                subtitle="Appears on report cards, receipts, and emails sent to parents"
              />
              <div className="flex flex-col gap-4 mt-4">
                {updateSchool.error && (
                  <p className="text-sm text-error">{(updateSchool.error as Error).message}</p>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  <Input
                    label="School name"
                    required
                    error={schoolForm.formState.errors.name?.message}
                    disabled={readOnly}
                    {...schoolForm.register("name")}
                  />
                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1.5">Currency</label>
                    <select
                      disabled={readOnly}
                      className="w-full h-9 px-3 text-sm border border-border rounded bg-surface text-text-primary focus:outline-2 focus:outline-navy-600 disabled:opacity-60"
                      {...schoolForm.register("currencyCode")}
                    >
                      <option value="NGN">NGN — Nigerian Naira (₦)</option>
                      <option value="GHS">GHS — Ghanaian Cedi (₵)</option>
                      <option value="KES">KES — Kenyan Shilling (KSh)</option>
                      <option value="ZAR">ZAR — South African Rand (R)</option>
                      <option value="USD">USD — US Dollar ($)</option>
                      <option value="GBP">GBP — British Pound (£)</option>
                    </select>
                  </div>
                </div>

                <Input
                  label="School address"
                  placeholder="14 Ahmadu Bello Way, Abuja"
                  disabled={readOnly}
                  {...schoolForm.register("address")}
                />

                <Input
                  label="Phone number"
                  type="tel"
                  placeholder="+234 800 000 0000"
                  disabled={readOnly}
                  {...schoolForm.register("phone")}
                />

                {/* Admin email — read only, can't change */}
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1.5">
                    Admin email <span className="text-text-muted font-normal">(read-only)</span>
                  </label>
                  <input
                    type="email"
                    value={school?.adminEmail ?? ""}
                    disabled
                    className="w-full h-9 px-3 text-sm border border-border rounded bg-surface-secondary text-text-muted cursor-not-allowed"
                  />
                </div>

                {/* Logo upload */}
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-2">
                    School logo
                  </label>
                  <div className="flex items-center gap-4">
                    {school?.logoUrl ? (
                     <div className="relative w-16 h-16 border border-border rounded-lg bg-surface overflow-hidden">
                    <Image
                      src={school.logoUrl}
                      alt="School logo"
                      fill
                      className="object-contain"
                    />
                  </div>
                    ) : (
                      <div className="w-16 h-16 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-surface-secondary">
                        <School size={20} className="text-text-muted" />
                      </div>
                    )}
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={readOnly || uploadLogo.isPending}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadLogo.mutate(file);
                        }}
                        className="text-sm text-text-secondary file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-border file:text-xs file:font-medium file:bg-surface file:text-text-primary file:cursor-pointer hover:file:bg-surface-secondary"
                      />
                      {uploadLogo.isPending && (
                        <p className="text-xs text-text-muted mt-1">Uploading…</p>
                      )}
                      <p className="text-xs text-text-muted mt-1">
                        PNG, JPG or SVG. Max 2MB. Appears on report cards and emails.
                      </p>
                    </div>
                  </div>
                </div>

                {!readOnly && (
                  <div className="flex justify-end pt-2 border-t border-border">
                    <Button
                      loading={updateSchool.isPending}
                      onClick={schoolForm.handleSubmit(onSchoolSave)}
                    >
                      <Save size={14} />
                      Save changes
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* ── GRADE SCALE ── */}
          {activeTab === "grading" && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-text-muted">
                  Grade scales define how total scores map to letter grades on report cards.
                </p>
                {!readOnly && (
                  <Button size="sm" onClick={() => setShowNewScheme(!showNewScheme)}>
                    <Plus size={14} />
                    New scheme
                  </Button>
                )}
              </div>

              {/* Create new scheme form */}
              {showNewScheme && (
                <Card>
                  <CardHeader title="Create grading scheme" subtitle="Define grade bands from highest to lowest" />
                  <div className="flex flex-col gap-4 mt-4">
                    <Input
                      label="Scheme name"
                      placeholder="e.g. WAEC Standard"
                      required
                      error={gradingForm.formState.errors.name?.message}
                      {...gradingForm.register("name")}
                    />

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-semibold text-text-primary uppercase tracking-wide">
                          Grade bands
                        </label>
                        <button
                          type="button"
                          onClick={() => addBand({ grade: "", minScore: 0, maxScore: 0, remark: "" })}
                          className="text-xs text-navy-600 font-medium cursor-pointer hover:text-navy-700"
                        >
                          + Add band
                        </button>
                      </div>

                      <div className="border border-border rounded-lg overflow-hidden">
                        <div className="grid grid-cols-4 gap-0 bg-surface-secondary border-b border-border">
                          {["Grade","Min score","Max score","Remark"].map((h) => (
                            <div key={h} className="px-3 py-2 text-xs font-semibold text-text-muted">{h}</div>
                          ))}
                        </div>
                        {bandFields.map((field, idx) => (
                          <div key={field.id} className={classNames(
                            "grid grid-cols-4 gap-0 border-b border-border last:border-0",
                            idx % 2 === 0 ? "bg-surface" : "bg-surface-secondary",
                          )}>
                            <div className="px-2 py-2">
                              <input
                                placeholder="A1"
                                className="w-full h-8 px-2 text-sm border border-border rounded bg-surface focus:outline-2 focus:outline-navy-600"
                                {...gradingForm.register(`bands.${idx}.grade`)}
                              />
                            </div>
                            <div className="px-2 py-2">
                              <input
                                type="number"
                                placeholder="0"
                                className="w-full h-8 px-2 text-sm border border-border rounded bg-surface focus:outline-2 focus:outline-navy-600"
                                {...gradingForm.register(`bands.${idx}.minScore`)}
                              />
                            </div>
                            <div className="px-2 py-2">
                              <input
                                type="number"
                                placeholder="100"
                                className="w-full h-8 px-2 text-sm border border-border rounded bg-surface focus:outline-2 focus:outline-navy-600"
                                {...gradingForm.register(`bands.${idx}.maxScore`)}
                              />
                            </div>
                            <div className="px-2 py-2 flex items-center gap-1">
                              <input
                                placeholder="Excellent"
                                className="w-full h-8 px-2 text-sm border border-border rounded bg-surface focus:outline-2 focus:outline-navy-600"
                                {...gradingForm.register(`bands.${idx}.remark`)}
                              />
                              <button
                                type="button"
                                onClick={() => removeBand(idx)}
                                className="p-1 text-text-muted hover:text-error cursor-pointer shrink-0"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <Button variant="secondary" onClick={() => setShowNewScheme(false)}>
                        Cancel
                      </Button>
                      <Button
                        loading={createScheme.isPending}
                        onClick={gradingForm.handleSubmit(onGradingSave)}
                      >
                        <Save size={14} />
                        Save scheme
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {/* Existing schemes */}
              {schemes.length === 0 && !showNewScheme ? (
                <Card>
                  <div className="text-center py-10">
                    <BookOpen size={28} className="text-text-muted mx-auto mb-2" />
                    <p className="text-sm font-medium text-text-primary">No grading schemes</p>
                    <p className="text-xs text-text-muted mt-1">Create one to define how scores map to grades on report cards.</p>
                  </div>
                </Card>
              ) : (
                <>{schemes.map((scheme) => {
                const isEditing = editingSchemeId === scheme.id;
                return (
                  <Card key={scheme.id} padding="none">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-text-primary">{scheme.name}</p>
                        {scheme.isDefault && <Badge label="Default" variant="success" />}
                      </div>
                      {!readOnly && (
                        <div className="flex items-center gap-2">
                          {!scheme.isDefault && (
                            <Button
                              size="sm"
                              variant="secondary"
                              loading={setDefault.isPending}
                              onClick={() => setDefault.mutate(scheme.id)}
                            >
                              Set as default
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setEditingSchemeId(isEditing ? null : scheme.id)}
                          >
                            {isEditing ? "Cancel" : "Edit"}
                          </Button>
                          {!scheme.isDefault && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                if (confirm(`Delete "${scheme.name}"?`)) deleteScheme.mutate(scheme.id);
                              }}
                            >
                              <Trash2 size={13} />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Inline edit form */}
                    {isEditing ? (
                      <SchemeEditForm
                        scheme={scheme}
                        onSave={async (data) => {
                          try {
                            await updateScheme.mutateAsync({ schemeId: scheme.id, data });
                            setEditingSchemeId(null);
                            showToast("Grading scheme updated.", "success");
                          } catch (err) {
                            showToast((err as Error).message, "error");
                          }
                        }}
                        saving={updateScheme.isPending}
                      />
                    ) : (
                      <div className="divide-y divide-border">
                        {scheme.bands.map((band: GradeBand) => (
                          <div key={band.grade} className="flex items-center justify-between px-4 py-2.5">
                            <div className="flex items-center gap-3">
                              <Badge label={band.grade} variant={gradeVariant(band.grade)} />
                              <span className="text-sm text-text-secondary">{band.remark ?? "—"}</span>
                            </div>
                            <span className="text-sm text-text-muted">
                              {band.minScore}–{band.maxScore} marks
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                );
              })}
              </>
              )}
            </div>
          )}

          {/* ── ACCOUNT & SECURITY ── */}
          {activeTab === "account" && (
            <div className="flex flex-col gap-4">
              {/* Profile info */}
              <Card>
                <CardHeader title="Your profile" subtitle="Your name and email as it appears in the system" />
                <div className="flex items-center gap-4 mt-4 p-4 bg-surface-secondary rounded-lg border border-border">
                  <div className="w-12 h-12 rounded-full bg-navy-100 flex items-center justify-center shrink-0">
                    <span className="text-base font-bold text-navy-600">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-text-muted">{user?.email}</p>
                    <p className="text-xs text-text-muted capitalize mt-0.5">
                      {user?.role?.replace("_", " ")}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-text-muted mt-3">
                  To update your name or email contact your school administrator.
                </p>
              </Card>

              {/* Change password */}
              <Card>
                <CardHeader
                  title="Change password"
                  subtitle="Use a strong password at least 8 characters long"
                />
                <div className="flex flex-col gap-4 mt-4">
                  {passwordForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-error">
                      {passwordForm.formState.errors.confirmPassword.message}
                    </p>
                  )}

                  {(["currentPassword", "newPassword", "confirmPassword"] as const).map((field) => {
                    const labels: Record<string, string> = {
                      currentPassword: "Current password",
                      newPassword:     "New password",
                      confirmPassword: "Confirm new password",
                    };
                    const show = showPwd[field === "currentPassword" ? "current" : field === "newPassword" ? "new" : "confirm"];
                    const key  = field === "currentPassword" ? "current" : field === "newPassword" ? "new" : "confirm" as keyof typeof showPwd;
                    return (
                      <div key={field} className="relative">
                        <Input
                          label={labels[field]}
                          type={show ? "text" : "password"}
                          required
                          error={passwordForm.formState.errors[field]?.message}
                          {...passwordForm.register(field)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPwd((p) => ({ ...p, [key]: !p[key] }))}
                          className="absolute right-3 top-7 text-text-muted hover:text-text-primary cursor-pointer"
                        >
                          {show ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    );
                  })}

                  <div className="flex justify-end pt-1">
                    <Button
                      loading={passwordForm.formState.isSubmitting}
                      onClick={passwordForm.handleSubmit(onPasswordSave)}
                    >
                      <Shield size={14} />
                      Update password
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* ── BANK & PAYMENTS ── */}
          {activeTab === "bank" && (
            <BankAccountSection school={school} readOnly={readOnly} showToast={showToast} />
          )}

          {/* ── SUBSCRIPTION ── */}
          {activeTab === "subscription" && (
            <div className="flex flex-col gap-4">
              {/* Current plan */}
              {subscription && (
                <Card>
                  <CardHeader
                    title="Current subscription"
                    subtitle="Your active plan and usage"
                  />
                  <div className="flex flex-col gap-4 mt-4">

                    {/* Plan header */}
                    <div className="flex items-center justify-between p-4 bg-navy-50 border border-navy-200 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-navy-600 rounded-lg flex items-center justify-center shrink-0">
                          <Star size={16} className="text-white" />
                        </div>
                        <div>
                          <p className="text-base font-bold text-navy-700">
                            {subscription.plan.name}
                          </p>
                          <p className="text-xs text-navy-500 capitalize mt-0.5">
                            {subscription.plan.billingCycle ?? "one-time"} billing
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-navy-700">
                          {Number(subscription.plan.priceKobo) === 0
                            ? "Free"
                            : formatCurrency(Number(subscription.plan.priceKobo) / 100)}
                        </p>
                        {Number(subscription.plan.priceKobo) > 0 && (
                          <p className="text-xs text-navy-500">
                            per {subscription.plan.billingCycle === "annually" ? "year" : "month"}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Plan limits */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 border border-border rounded-lg">
                        <p className="text-xs text-text-muted mb-1">Students</p>
                        <p className="text-sm font-semibold text-text-primary">
                          {subscription.plan.studentLimit
                            ? `Up to ${subscription.plan.studentLimit.toLocaleString()}`
                            : "Unlimited"}
                        </p>
                      </div>
                      <div className="p-3 border border-border rounded-lg">
                        <p className="text-xs text-text-muted mb-1">Staff accounts</p>
                        <p className="text-sm font-semibold text-text-primary">
                          {subscription.plan.staffLimit
                            ? `Up to ${subscription.plan.staffLimit}`
                            : "Unlimited"}
                        </p>
                      </div>
                      <div className="p-3 border border-border rounded-lg">
                        <p className="text-xs text-text-muted mb-1">Started</p>
                        <p className="text-sm font-semibold text-text-primary">
                          {subscription.startsAt
                            ? new Date(subscription.startsAt).toLocaleDateString("en-NG", {
                                day: "numeric", month: "short", year: "numeric",
                              })
                            : "—"}
                        </p>
                      </div>
                      <div className="p-3 border border-border rounded-lg">
                        <p className="text-xs text-text-muted mb-1">
                          {subscription.expiresAt ? "Renews" : "Expires"}
                        </p>
                        <p className="text-sm font-semibold text-text-primary">
                          {subscription.expiresAt
                            ? new Date(subscription.expiresAt).toLocaleDateString("en-NG", {
                                day: "numeric", month: "short", year: "numeric",
                              })
                            : "Never"}
                        </p>
                      </div>
                    </div>

                    {/* Features list */}
                    {subscription.plan.highlights?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
                          What&apos;s included
                        </p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {subscription.plan.highlights.map((h: string) => (
                            <div key={h} className="flex items-center gap-2 text-xs text-text-secondary">
                              <CheckCircle size={12} className="text-success shrink-0" />
                              {h}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Status badge */}
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-success" />
                        <p className="text-xs text-text-muted capitalize">
                          Status: <span className="text-success font-semibold">{subscription.status}</span>
                        </p>
                      </div>
                      {subscription.expiresAt && (
                        <p className="text-xs text-text-muted">
                          {Math.max(0, Math.ceil(
                            (new Date(subscription.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                          ))} days remaining
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              )}

              {!subscription && (
                <Card>
                  <div className="text-center py-8">
                    <Star size={28} className="text-text-muted mx-auto mb-2" />
                    <p className="text-sm font-medium text-text-primary">No active subscription</p>
                    <p className="text-xs text-text-muted mt-1">Choose a plan below to get started.</p>
                  </div>
                </Card>
              )}

              {/* Available plans */}
              <Card>
                <div className="flex items-center justify-between mb-1">
                  <CardHeader
                    title="Available plans"
                    subtitle="Upgrade or change your plan at any time"
                  />
                  {/* Monthly / Yearly toggle */}
                  <div className="flex items-center gap-1 bg-surface-secondary border border-border rounded-lg p-1 shrink-0">
                    {(["monthly", "annually"] as const).map((cycle) => (
                      <button
                        key={cycle}
                        onClick={() => setBillingCycle(cycle)}
                        className={classNames(
                          "px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer",
                          billingCycle === cycle
                            ? "bg-navy-600 text-white"
                            : "text-text-muted hover:text-text-primary",
                        )}
                      >
                        {cycle === "monthly" ? "Monthly" : "Yearly"}
                        {cycle === "annually" && (
                          <span className="ml-1.5 text-xs bg-gold-100 text-gold-700 px-1.5 py-0.5 rounded-full font-bold">
                            Save 20%
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-3 mt-4">
                  {plans.map((plan) => {
                    const isCurrent      = subscription?.plan?.id === plan.id;
                    const currentPrice   = Number(subscription?.plan?.priceKobo ?? 0);
                    const thisPlanPrice  = Number(plan.priceKobo);
                    const isUpgrade      = thisPlanPrice > currentPrice;
                    const isDowngrade    = thisPlanPrice < currentPrice && thisPlanPrice > 0;
                    const isFree         = thisPlanPrice === 0 && !plan.isCustom;

                    return (
                      <div
                        key={plan.id}
                        className={classNames(
                          "flex items-center justify-between p-4 border rounded-lg",
                          isCurrent ? "border-navy-600 bg-navy-50" : "border-border bg-surface",
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm font-semibold text-text-primary">{plan.name}</p>
                            {isCurrent && <Badge label="Current plan" variant="navy" />}
                          </div>
                          <p className="text-xs text-text-muted">
                            {plan.studentLimit ? `Up to ${plan.studentLimit} students` : "Unlimited students"}
                          </p>
                          {plan.highlights?.slice(0, 2).map((h: string) => (
                            <p key={h} className="text-xs text-text-muted">{h}</p>
                          ))}
                        </div>
                        <div className="text-right ml-4 shrink-0">
                          {/* Price */}
                          {!plan.isCustom && (
                            <p className="text-sm font-bold text-text-primary">
                              {isFree
                                ? "Free"
                                : formatCurrency(thisPlanPrice / 100)}
                              {!isFree && (
                                <span className="text-xs font-normal text-text-muted ml-1">
                                  /{billingCycle === "annually" ? "yr" : "mo"}
                                </span>
                              )}
                            </p>
                          )}

                          {/* Current plan — just a text label, no button */}
                          {isCurrent && (
                            <p className="text-xs text-navy-600 font-semibold mt-1.5">Current plan</p>
                          )}

                          {/* Action button — only for non-current plans */}
                          {!isCurrent && !readOnly && (
                            <Button
                              size="sm"
                              variant={isDowngrade ? "secondary" : "primary"}
                              className="mt-2"
                              loading={initiateSub.isPending}
                              onClick={() => {
                                if (plan.isCustom) {
                                  window.open("mailto:hello@novtryx.com?subject=ReportRun Custom Plan", "_blank");
                                } else if (isFree) {
                                  showToast("Contact support to downgrade to the free plan.", "success");
                                } else {
                                  if (isDowngrade && !confirm(`Downgrade to ${plan.name}? Your current plan remains active until it expires.`)) return;
                                  initiateSub.mutate(plan.id, {
                                    onSuccess: (d) => { window.location.href = d.authorizationUrl; },
                                    onError:   (e) => showToast((e as Error).message, "error"),
                                  });
                                }
                              }}
                            >
                              {plan.isCustom ? "Contact us" : isUpgrade ? "Upgrade" : "Downgrade"}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          )}

        </div>
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}