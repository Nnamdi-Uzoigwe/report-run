"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Save,
  School,
  Bell,
  BookOpen,
  Calendar,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  PageHeader,
  Card,
  CardHeader,
  Badge,
  Button,
  Input,
  Select,
} from "@/components/ui";
import { fetchSettings, updateSettings } from "@/lib/api";
import { classNames } from "@/lib/utils";
import type {
  SchoolSettings,
  GradeScale,
  TermConfig,
  SelectOption,
} from "@/types";
import { usePermission } from "@/lib/hooks/usePermission";
import { ReadOnlyBanner } from "@/components/dashboard/ReadOnlyBanner";

// ── Schemas ───────────────────────────────────────────────────

const schoolSchema = z.object({
  name: z.string().min(2, "School name is required"),
  address: z.string().min(5, "Address is required"),
  phone: z.string().min(7, "Phone is required"),
  email: z.string().email("Enter a valid email"),
});

const notifSchema = z.object({
  emailOnPayment: z.boolean(),
  smsOnPayment: z.boolean(),
  emailOnResult: z.boolean(),
  reminderLeadDays: z.coerce.number().min(1).max(30),
});

type SchoolForm = z.infer<typeof schoolSchema>;
type NotifForm = z.infer<typeof notifSchema>;

// ── Constants ─────────────────────────────────────────────────

const TABS = [
  { id: "school", label: "School", icon: School },
  { id: "terms", label: "Terms", icon: Calendar },
  { id: "grades", label: "Grade Scale", icon: BookOpen },
  { id: "notifications", label: "Notifications", icon: Bell },
] as const;

type TabId = (typeof TABS)[number]["id"];

const TERM_OPTIONS: SelectOption[] = [
  { value: "First Term", label: "First Term" },
  { value: "Second Term", label: "Second Term" },
  { value: "Third Term", label: "Third Term" },
];

// ── Sub-components ────────────────────────────────────────────

function TermCard({ term }: { term: TermConfig }) {
  return (
    <div className="flex items-center justify-between gap-4 p-4 border border-border rounded-lg">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-semibold text-text-primary">{term.name}</p>
          {term.isCurrent && <Badge label="Current" variant="success" />}
        </div>
        <p className="text-xs text-text-muted">
          {term.session} &mdash; {term.startDate} to {term.endDate}
        </p>
      </div>
      <Button size="sm" variant="secondary">
        Edit
      </Button>
    </div>
  );
}

function GradeRow({ grade }: { grade: GradeScale }) {
  function variant(): "success" | "warning" | "error" | "default" {
    if (["A1", "B2", "B3"].includes(grade.label)) return "success";
    if (["C4", "C5", "C6"].includes(grade.label)) return "warning";
    if (grade.label === "F9") return "error";
    return "default";
  }

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-border last:border-0 hover:bg-surface-secondary transition-colors">
      <div className="flex items-center gap-3">
        <Badge label={grade.label} variant={variant()} />
        <span className="text-sm text-text-secondary">{grade.remark}</span>
      </div>
      <span className="text-sm text-text-muted">
        {grade.minScore} – {grade.maxScore} marks
      </span>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
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
          "relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-navy-600",
          checked ? "bg-navy-600" : "bg-border",
        )}
      >
        <span
          className={classNames(
            "inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200",
            checked ? "translate-x-4" : "translate-x-0",
          )}
        />
      </button>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────

export default function SettingsPage() {
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("school");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Notification toggles (local state)
  const [emailOnPayment, setEmailOnPayment] = useState(false);
  const [smsOnPayment, setSmsOnPayment] = useState(false);
  const [emailOnResult, setEmailOnResult] = useState(false);

  const { can } = usePermission();
  const readOnly = !can.manageSettings;

  const schoolForm = useForm<SchoolForm>({
    resolver: zodResolver(schoolSchema) as any,
  });

  const notifForm = useForm<NotifForm>({
    resolver: zodResolver(notifSchema) as any,
  });

  useEffect(() => {
    fetchSettings()
      .then((s) => {
        setSettings(s);
        schoolForm.reset({
          name: s.school.name,
          address: s.school.address,
          phone: s.school.phone,
          email: s.school.email,
        });
        notifForm.reset({
          reminderLeadDays: s.notificationPreferences.reminderLeadDays,
        });
        setEmailOnPayment(s.notificationPreferences.emailOnPayment);
        setSmsOnPayment(s.notificationPreferences.smsOnPayment);
        setEmailOnResult(s.notificationPreferences.emailOnResult);
      })
      .catch(() => setError("Failed to load settings."))
      .finally(() => setLoading(false));
  }, []);

  async function onSchoolSave(data: SchoolForm) {
    setSaving(true);
    try {
      await updateSettings({
        school: { ...settings!.school, ...data },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  async function onNotifSave(data: NotifForm) {
    setSaving(true);
    try {
      await updateSettings({
        notificationPreferences: {
          emailOnPayment,
          smsOnPayment,
          emailOnResult,
          reminderLeadDays: data.reminderLeadDays,
        },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="h-8 w-48 bg-surface-tertiary rounded animate-pulse" />
        <div className="h-96 bg-surface-tertiary rounded-lg animate-pulse" />
      </div>
    );
  }

  if (error || !settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-error">
          <AlertCircle size={18} />
          <p className="text-sm">{error ?? "No settings found."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {readOnly && (
        <ReadOnlyBanner message="Only admins can modify school settings." />
      )}
      <PageHeader
        title="Settings"
        subtitle="Manage your school configuration"
      />

      {/* Saved toast */}
      {saved && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-navy-600 text-white text-sm font-medium rounded-lg shadow-lg">
          <Save size={14} />
          Settings saved
        </div>
      )}

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar tabs */}
        <div className="lg:col-span-1">
          <Card padding="sm">
            <nav className="flex flex-col gap-0.5">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={classNames(
                      "flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors duration-150 text-left cursor-pointer w-full",
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
                onSubmit={schoolForm.handleSubmit(onSchoolSave as any)}
                className="flex flex-col gap-4"
                noValidate
              >
                <Input
                  label="School name"
                  required
                  error={schoolForm.formState.errors.name?.message}
                  {...schoolForm.register("name")}
                />
                <Input
                  label="Address"
                  required
                  error={schoolForm.formState.errors.address?.message}
                  {...schoolForm.register("address")}
                />
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input
                    label="Phone number"
                    type="tel"
                    required
                    error={schoolForm.formState.errors.phone?.message}
                    {...schoolForm.register("phone")}
                  />
                  <Input
                    label="Email address"
                    type="email"
                    required
                    error={schoolForm.formState.errors.email?.message}
                    {...schoolForm.register("email")}
                  />
                </div>

                <div className="border-t border-border pt-4 mt-2">
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">
                    Current academic period
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Select
                      label="Current term"
                      options={TERM_OPTIONS}
                      value={settings.school.currentTerm}
                      onChange={() => {}}
                    />
                    <Input
                      label="Academic session"
                      defaultValue={settings.school.currentSession}
                      placeholder="2024/2025"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" loading={saving} disabled={readOnly}>
                    <Save size={14} />
                    Save changes
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Terms tab */}
          {activeTab === "terms" && (
            <Card>
              <CardHeader
                title="Terms & sessions"
                subtitle="Configure academic calendar periods"
                action={
                  <Button size="sm">
                    <AlertCircle size={13} />
                    Add term
                  </Button>
                }
              />
              <div className="flex flex-col gap-3">
                {settings.terms.map((term) => (
                  <TermCard key={term.id} term={term} />
                ))}
              </div>
            </Card>
          )}

          {/* Grade scale tab */}
          {activeTab === "grades" && (
            <Card padding="none">
              <div className="p-6 border-b border-border">
                <CardHeader
                  title="Grade scale"
                  subtitle="WAEC-compatible grading applied to all results"
                />
                <div className="p-3 bg-navy-50 border border-navy-100 rounded text-xs text-navy-700">
                  Grade scales are automatically applied when results are
                  entered. Contact support to configure a custom scale.
                </div>
              </div>
              <div>
                {settings.gradeScales.map((grade) => (
                  <GradeRow key={grade.id} grade={grade} />
                ))}
              </div>
            </Card>
          )}

          {/* Notifications tab */}
          {activeTab === "notifications" && (
            <Card>
              <CardHeader
                title="Notification preferences"
                subtitle="Control when and how ReportRun sends alerts"
              />
              <form
                onSubmit={notifForm.handleSubmit(onNotifSave as any)}
                noValidate
              >
                <div className="mb-6">
                  <Toggle
                    checked={emailOnPayment}
                    onChange={setEmailOnPayment}
                    label="Email on payment received"
                    hint="Send an email confirmation to the parent when a payment is recorded"
                  />
                  <Toggle
                    checked={smsOnPayment}
                    onChange={setSmsOnPayment}
                    label="SMS on payment received"
                    hint="Send an SMS to the parent's phone when a payment is recorded"
                  />
                  <Toggle
                    checked={emailOnResult}
                    onChange={setEmailOnResult}
                    label="Email when results are published"
                    hint="Notify parents by email when their child's results are available"
                  />
                </div>

                <div className="border-t border-border pt-5">
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-4">
                    Reminder settings
                  </p>
                  <Input
                    label="Default reminder lead time (days)"
                    type="number"
                    hint="How many days before a fee due date to send reminders"
                    error={notifForm.formState.errors.reminderLeadDays?.message}
                    {...notifForm.register("reminderLeadDays")}
                  />
                </div>

                <div className="flex justify-end pt-6">
                  <Button type="submit" loading={saving} disabled={readOnly}>
                    <Save size={14} />
                    Save preferences
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
