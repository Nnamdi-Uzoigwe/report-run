"use client";

import { useState } from "react";
import { Save, School, Bell, BookOpen } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  PageHeader, Card, CardHeader, Badge, Button, Input,
} from "@/components/ui";
import { useSchool, useUpdateSchool, useUploadSchoolLogo } from "@/lib/queries/school";
import { useActiveSubscription } from "@/lib/queries/school";
import {
  useGradingSchemes, useCreateGradingScheme,
  useSetDefaultGradingScheme, useDeleteGradingScheme,
} from "@/lib/queries/classes";
import { useDunningConfig, useUpdateDunningConfig } from "@/lib/queries/fees";
import { usePermission } from "@/lib/hooks/usePermission";
import { ReadOnlyBanner } from "@/components/dashboard/ReadOnlyBanner";
import { classNames, formatCurrency } from "@/lib/utils";
import type { GradeBand } from "@/types";

// ── Schemas ───────────────────────────────────────────────────

const schoolSchema = z.object({
  name:    z.string().min(2, "School name is required"),
  address: z.string().optional(),
  phone:   z.string().optional(),
});

type SchoolForm = z.infer<typeof schoolSchema>;

// ── Tabs ──────────────────────────────────────────────────────

const TABS = [
  { id: "school",       label: "School",         icon: School   },
  { id: "grading",      label: "Grade Scale",     icon: BookOpen },
  { id: "notifications",label: "Notifications",   icon: Bell     },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ── Helpers ───────────────────────────────────────────────────

function gradeVariant(grade: string): "success" | "warning" | "error" | "default" {
  if (["A", "A1", "B2", "B3"].includes(grade)) return "success";
  if (["C4", "C5", "C6"].includes(grade))      return "warning";
  if (["F", "F9"].includes(grade))             return "error";
  return "default";
}

function Toggle({
  checked, onChange, label, hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
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
        onClick={() => onChange(!checked)}
        className={classNames(
          "relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors cursor-pointer",
          checked ? "bg-navy-600" : "bg-border"
        )}
      >
        <span
          className={classNames(
            "inline-block h-4 w-4 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-4" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("school");
  const [saved,     setSaved    ] = useState(false);

  const { can } = usePermission();
  const readOnly = !can.manageSettings;

  const { data: school,       isLoading: schoolLoading  } = useSchool();
  const { data: subscription                            } = useActiveSubscription();
  const { data: schemes  = [], isLoading: schemesLoading } = useGradingSchemes();
  const { data: dunning                                 } = useDunningConfig();

  const updateSchool = useUpdateSchool();
  const uploadLogo   = useUploadSchoolLogo();
  const createScheme = useCreateGradingScheme();
  const setDefault   = useSetDefaultGradingScheme();
  const deleteScheme = useDeleteGradingScheme();
  const updateDunning = useUpdateDunningConfig();

  const schoolForm = useForm<SchoolForm>({
    resolver: zodResolver(schoolSchema),
    values: school
      ? { name: school.name, address: school.address ?? "", phone: school.phone ?? "" }
      : undefined,
  });

  async function onSchoolSave(data: SchoolForm) {
    await updateSchool.mutateAsync(data);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
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

      <PageHeader title="Settings" subtitle="Manage your school configuration" />

      {/* Saved toast */}
      {saved && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-navy-600 text-white text-sm font-medium rounded-lg shadow-lg">
          <Save size={14} />
          Settings saved
        </div>
      )}

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
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
                      "flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors duration-150 text-left cursor-pointer w-full",
                      isActive
                        ? "bg-navy-600 text-white"
                        : "text-text-secondary hover:text-text-primary hover:bg-surface-secondary"
                    )}
                  >
                    <Icon size={15} className="shrink-0" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </Card>

          {/* Subscription badge */}
          {subscription && (
            <Card padding="sm" className="mt-4">
              <p className="text-xs text-text-muted mb-1">Current plan</p>
              <p className="text-sm font-semibold text-text-primary">{subscription.plan.name}</p>
              <p className="text-xs text-text-muted mt-1">
                {subscription.plan.studentLimit
                  ? `Up to ${subscription.plan.studentLimit} students`
                  : "Unlimited students"}
              </p>
              <p className="text-xs text-text-muted">
                {formatCurrency(Number(subscription.plan.priceKobo) / 100)} / {subscription.plan.billingCycle}
              </p>
            </Card>
          )}
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {/* School tab */}
          {activeTab === "school" && (
            <Card>
              <CardHeader
                title="School details"
                subtitle="This information appears on report cards and receipts"
              />
              <form
                onSubmit={schoolForm.handleSubmit(onSchoolSave)}
                className="flex flex-col gap-4"
                noValidate
              >
                {updateSchool.error && (
                  <p className="text-sm text-error">
                    {(updateSchool.error as Error).message}
                  </p>
                )}
                <Input
                  label="School name"
                  required
                  error={schoolForm.formState.errors.name?.message}
                  {...schoolForm.register("name")}
                />
                <Input
                  label="Address"
                  {...schoolForm.register("address")}
                />
                <Input
                  label="Phone number"
                  type="tel"
                  {...schoolForm.register("phone")}
                />

                {/* Logo upload */}
                <div>
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
                    School logo
                  </p>
                  {school?.logoUrl && (
                    <img
                      src={school.logoUrl}
                      alt="School logo"
                      className="w-16 h-16 object-contain border border-border rounded mb-3"
                    />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={readOnly || uploadLogo.isPending}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadLogo.mutate(file);
                    }}
                    className="text-sm text-text-secondary"
                  />
                  {uploadLogo.isPending && (
                    <p className="text-xs text-text-muted mt-1">Uploading…</p>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    loading={updateSchool.isPending}
                    disabled={readOnly}
                  >
                    <Save size={14} />
                    Save changes
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Grading tab */}
          {activeTab === "grading" && (
            <div className="flex flex-col gap-4">
              {schemes.length === 0 ? (
                <Card>
                  <p className="text-sm text-text-muted text-center py-8">
                    No grading schemes configured. Contact your admin or create one below.
                  </p>
                </Card>
              ) : (
                schemes.map((scheme) => (
                  <Card key={scheme.id} padding="none">
                    <div className="p-4 border-b border-border flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-text-primary">{scheme.name}</p>
                        {scheme.isDefault && (
                          <Badge label="Default" variant="success" />
                        )}
                      </div>
                      {!readOnly && (
                        <div className="flex items-center gap-2">
                          {!scheme.isDefault && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setDefault.mutate(scheme.id)}
                              loading={setDefault.isPending}
                            >
                              Set as default
                            </Button>
                          )}
                          {!scheme.isDefault && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                if (confirm("Delete this grading scheme?")) {
                                  deleteScheme.mutate(scheme.id);
                                }
                              }}
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="divide-y divide-border">
                      {scheme.bands.map((band: GradeBand) => (
                        <div
                          key={band.grade}
                          className="flex items-center justify-between px-4 py-3"
                        >
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

          {/* Notifications tab */}
          {activeTab === "notifications" && (
            <Card>
              <CardHeader
                title="Notification preferences"
                subtitle="Control when ReportRun sends automated emails"
              />
              <Toggle
                checked={dunning?.enabled ?? false}
                onChange={(v) => updateDunning.mutate({ enabled: v })}
                label="Fee reminder emails"
                hint="Send daily reminders to parents with outstanding balances"
              />
              {dunning && (
                <div className="mt-4">
                  <p className="text-xs text-text-muted mb-1">Days before exam to start reminders</p>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      defaultValue={dunning.daysBeforeExam}
                      min={1}
                      max={60}
                      className="w-20 h-9 px-3 text-sm border border-border rounded bg-surface focus:outline-2 focus:outline-navy-600"
                      onBlur={(e) =>
                        updateDunning.mutate({ daysBeforeExam: Number(e.target.value) })
                      }
                    />
                    <span className="text-sm text-text-muted">days</span>
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}