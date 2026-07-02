"use client";

import { useState } from "react";
import {
  Save, School, Bell, BookOpen, CreditCard,
  Shield, Plus, Trash2, CheckCircle, AlertCircle,
  Eye, EyeOff, Star,
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
} from "@/lib/queries/school";
import {
  useGradingSchemes, useCreateGradingScheme,
  useSetDefaultGradingScheme, useDeleteGradingScheme,
} from "@/lib/queries/classes";
import { usePermission } from "@/lib/hooks/usePermission";
import { useAuthStore } from "@/lib/store";
import { changePasswordAction } from "@/lib/actions/auth";
import { ReadOnlyBanner } from "@/components/dashboard/ReadOnlyBanner";
import { classNames, formatCurrency } from "@/lib/utils";
import type { GradeBand } from "@/types";

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
  { id: "school",       label: "School Info",      icon: School   },
  { id: "grading",      label: "Grade Scale",       icon: BookOpen },
  { id: "account",      label: "Account & Security",icon: Shield   },
  { id: "subscription", label: "Subscription",      icon: CreditCard },
  { id: "notifications",label: "Notifications",     icon: Bell     },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ── PAGE ──────────────────────────────────────────────────────

export default function SettingsPage() {
  const [activeTab,    setActiveTab   ] = useState<TabId>("school");
  const [toast,        setToast       ] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [showNewScheme,setShowNewScheme] = useState(false);
  const [showPwd,      setShowPwd     ] = useState({ current: false, new: false, confirm: false });

  const { can }  = usePermission();
  const readOnly = !can.manageSettings;
  const user     = useAuthStore((s) => s.user);

  // Data
  const { data: school,        isLoading: schoolLoading  } = useSchool();
  const { data: subscription                             } = useActiveSubscription();
  const { data: plans    = []                            } = usePlans();
  const { data: schemes  = [], isLoading: schemesLoading } = useGradingSchemes();
  // const { data: dunning                                  } = useDunningConfig();

  // Mutations
  const updateSchool   = useUpdateSchool();
  const uploadLogo     = useUploadSchoolLogo();
  const createScheme   = useCreateGradingScheme();
  const setDefault     = useSetDefaultGradingScheme();
  const deleteScheme   = useDeleteGradingScheme();
  // const updateDunning  = useUpdateDunningConfig();
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
                      <img
                        src={school.logoUrl}
                        alt="School logo"
                        className="w-16 h-16 object-contain border border-border rounded-lg bg-surface"
                      />
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
                schemes.map((scheme) => (
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
                  </Card>
                ))
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

          {/* ── SUBSCRIPTION ── */}
          {activeTab === "subscription" && (
            <div className="flex flex-col gap-4">
              {/* Current plan */}
              {subscription && (
                <Card>
                  <CardHeader title="Current subscription" />
                  <div className="flex flex-col gap-3 mt-4">
                    <div className="flex items-center justify-between p-4 bg-navy-50 border border-navy-200 rounded-lg">
                      <div>
                        <p className="text-sm font-bold text-navy-700">{subscription.plan.name}</p>
                        <p className="text-xs text-navy-600 mt-0.5">
                          {subscription.plan.studentLimit
                            ? `Up to ${subscription.plan.studentLimit} students`
                            : "Unlimited students"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-navy-700">
                          {Number(subscription.plan.priceKobo) === 0
                            ? "Free"
                            : formatCurrency(Number(subscription.plan.priceKobo) / 100)}
                        </p>
                        {subscription.plan.billingCycle && (
                          <p className="text-xs text-navy-600">per {subscription.plan.billingCycle}</p>
                        )}
                      </div>
                    </div>
                    {subscription.expiresAt && (
                      <p className="text-xs text-text-muted">
                        Renews on {new Date(subscription.expiresAt).toLocaleDateString("en-NG", {
                          day: "numeric", month: "long", year: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                </Card>
              )}

              {/* Available plans */}
              <Card>
                <CardHeader
                  title="Available plans"
                  subtitle="Upgrade or change your plan at any time"
                />
                <div className="flex flex-col gap-3 mt-4">
                  {plans.map((plan) => {
                    const isCurrent = subscription?.plan?.id === plan.id;
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
                            {isCurrent && <Badge label="Current" variant="navy" />}
                          </div>
                          <p className="text-xs text-text-muted">
                            {plan.studentLimit ? `Up to ${plan.studentLimit} students` : "Unlimited students"}
                          </p>
                          {plan.highlights?.slice(0, 2).map((h: string) => (
                            <p key={h} className="text-xs text-text-muted">{h}</p>
                          ))}
                        </div>
                        <div className="text-right ml-4 shrink-0">
                          <p className="text-sm font-bold text-text-primary">
                            {Number(plan.priceKobo) === 0
                              ? "Free"
                              : plan.isCustom
                              ? "Custom"
                              : formatCurrency(Number(plan.priceKobo) / 100)}
                          </p>
                          {!isCurrent && !readOnly && (
                            <Button
                              size="sm"
                              className="mt-2"
                              loading={initiateSub.isPending}
                              onClick={() => {
                                if (plan.isCustom) {
                                  window.location.href = "/contact";
                                } else if (Number(plan.priceKobo) === 0) {
                                  showToast("You are already on the best free plan.", "success");
                                } else {
                                  initiateSub.mutate(plan.id, {
                                    onSuccess: (d) => { window.location.href = d.authorizationUrl; },
                                    onError:   (e) => showToast((e as Error).message, "error"),
                                  });
                                }
                              }}
                            >
                              {plan.isCustom ? "Contact us" : "Upgrade"}
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

          {/* ── NOTIFICATIONS ── */}
        

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