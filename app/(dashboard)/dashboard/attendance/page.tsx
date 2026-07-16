"use client";

import { useState, useEffect } from "react";
import {
  ClipboardList, CheckSquare, AlertCircle,
  Sun, CloudSun, ChevronLeft, ChevronRight, Users, Lock, Download,
} from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { useAssignmentsByUser } from "@/lib/queries/staff";
import {
  PageHeader, Card, Badge, Button, EmptyState,
} from "@/components/ui";
import {
  useActiveSession,
  useSessionAttendance,
  useDailySummary,
  useSubmitAttendance,
} from "@/lib/queries/academics";
import { useClasses } from "@/lib/queries/classes";
import { useStudents } from "@/lib/queries/students";
import { usePermission } from "@/lib/hooks/usePermission";
import { ReadOnlyBanner } from "@/components/dashboard/ReadOnlyBanner";
import { classNames } from "@/lib/utils";
import type { Student } from "@/types";

// ── Helpers ───────────────────────────────────────────────────

function todayString(): string {
  return new Date().toISOString().split("T")[0];
}

function formatDisplayDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-NG", {
    weekday: "long",
    day:     "numeric",
    month:   "long",
    year:    "numeric",
  });
}

function offsetDate(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

// ── Session badge ─────────────────────────────────────────────

function SessionBadge({
  session,
  isMorningLocked,
}: {
  session:         "morning" | "afternoon";
  isMorningLocked: boolean;
}) {
  const isMorning = session === "morning";
  return (
    <div className={classNames(
      "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium",
      isMorning
        ? "bg-amber-50 border-amber-200 text-amber-700"
        : "bg-blue-50 border-blue-200 text-blue-700",
    )}>
      {isMorning ? <Sun size={14} /> : <CloudSun size={14} />}
      <span>{isMorning ? "Morning session" : "Afternoon session"}</span>
      {isMorningLocked && !isMorning && (
        <span className="text-xs opacity-70">· morning closed</span>
      )}
    </div>
  );
}

// ── Student row ───────────────────────────────────────────────

function StudentRow({
  student,
  checked,
  onToggle,
  readOnly,
}: {
  student:  Student;
  checked:  boolean;
  onToggle: () => void;
  readOnly: boolean;
}) {
  return (
    <div
      onClick={() => !readOnly && onToggle()}
      className={classNames(
        "flex items-center gap-4 px-5 py-3 border-b border-border last:border-0 transition-colors duration-100",
        !readOnly && "cursor-pointer hover:bg-surface-secondary",
        checked && "bg-success-light/30",
      )}
    >
      <div className={classNames(
        "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors duration-100",
        checked ? "bg-success border-success" : "border-border bg-surface",
      )}>
        {checked && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>

      <div className="w-8 h-8 rounded-full bg-navy-100 flex items-center justify-center shrink-0">
        <span className="text-xs font-semibold text-navy-600">
          {student.firstName[0]}{student.lastName[0]}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <p className={classNames(
          "text-sm font-medium",
          checked ? "text-text-primary" : "text-text-secondary",
        )}>
          {student.lastName}, {student.firstName}
        </p>
        <p className="text-xs text-text-muted">{student.admissionNumber ?? "—"}</p>
      </div>

      <Badge
        label={checked ? "Present" : "Absent"}
        variant={checked ? "success" : "error"}
      />
    </div>
  );
}

// ── Register view ─────────────────────────────────────────────

function RegisterView({
  classId,
  date,
  session,
  readOnly,
  locked,
  lockReason,
}: {
  classId:    string;
  date:       string;
  session:    "morning" | "afternoon";
  readOnly:   boolean;
  locked:     boolean;
  lockReason: string;
}) {
  const { data: students = [], isLoading: studentsLoading } = useStudents(classId);
  const { data: existing = [], isLoading: existingLoading } = useSessionAttendance(
    classId, date, session,
  );
  const submit = useSubmitAttendance();

  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  // Sync checkedIds whenever existing records load or session changes.
  // useEffect is correct here — we're syncing external data into local state.
  useEffect(() => {
    const set = new Set<string>();
    for (const r of existing) {
      if (r.status === "present") set.add(r.studentId);
    }
    setCheckedIds(set);
  }, [existing]);

  function toggleStudent(id: string) {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (checkedIds.size === students.length) {
      setCheckedIds(new Set());
    } else {
      setCheckedIds(new Set(students.map((s) => s.id)));
    }
  }

  async function handleSubmit() {
    const entries = students.map((s) => ({
      studentId: s.id,
      status:    (checkedIds.has(s.id) ? "present" : "absent") as "present" | "absent",
    }));
    await submit.mutateAsync({ classId, date, session, entries });
  }

  if (studentsLoading || existingLoading) {
    return (
      <div className="flex flex-col gap-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-14 bg-surface-tertiary rounded animate-pulse" />
        ))}
      </div>
    );
  }

  // Locked state — show the reason but still show the read-only list
  if (locked) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 p-3 bg-surface-secondary border border-border rounded-lg">
          <Lock size={14} className="text-text-muted shrink-0" />
          <p className="text-sm text-text-muted">{lockReason}</p>
        </div>
        {existing.length > 0 && (
          <Card padding="none">
            {existing.map((r) => (
              <div
                key={r.studentId}
                className="flex items-center justify-between px-5 py-3 border-b border-border last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {r.student?.lastName}, {r.student?.firstName}
                  </p>
                  <p className="text-xs text-text-muted">{r.student?.admissionNumber ?? "—"}</p>
                </div>
                <Badge
                  label={r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                  variant={r.status === "present" ? "success" : "error"}
                />
              </div>
            ))}
          </Card>
        )}
        {existing.length === 0 && (
          <p className="text-sm text-text-muted text-center py-6">
            No records submitted for this session.
          </p>
        )}
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No students in this class"
        description="Add students to this class first."
      />
    );
  }

  const presentCount = checkedIds.size;
  const absentCount  = students.length - presentCount;
  const allChecked   = checkedIds.size === students.length;
  const isDisabled   = readOnly || locked;

  return (
    <div className="flex flex-col gap-4">
      {/* Stats */}
      <div className="flex items-center gap-6 px-1">
        <span className="text-sm text-text-secondary">
          <span className="font-semibold text-success">{presentCount}</span> present
        </span>
        <span className="text-sm text-text-secondary">
          <span className="font-semibold text-error">{absentCount}</span> absent
        </span>
        <span className="text-sm text-text-muted ml-auto">{students.length} students</span>
      </div>

      {/* List */}
      <Card padding="none">
        {/* Select all */}
        <div
          onClick={!isDisabled ? toggleAll : undefined}
          className={classNames(
            "flex items-center gap-4 px-5 py-3 border-b-2 border-border bg-surface-secondary",
            !isDisabled && "cursor-pointer hover:bg-surface-tertiary",
          )}
        >
          <div className={classNames(
            "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0",
            allChecked
              ? "bg-navy-600 border-navy-600"
              : checkedIds.size > 0
              ? "bg-navy-200 border-navy-400"
              : "border-border bg-surface",
          )}>
            {allChecked && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            {!allChecked && checkedIds.size > 0 && (
              <div className="w-2.5 h-0.5 bg-navy-600 rounded" />
            )}
          </div>
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wide">
            {allChecked ? "Deselect all" : "Mark all present"}
          </span>
        </div>

        {students.map((student) => (
          <StudentRow
            key={student.id}
            student={student}
            checked={checkedIds.has(student.id)}
            onToggle={() => toggleStudent(student.id)}
            readOnly={isDisabled}
          />
        ))}
      </Card>

      {/* Submit */}
      {!isDisabled && (
        <div className="flex items-center justify-between gap-4 pt-1">
          <div>
            {submit.isSuccess && (
              <p className="text-sm text-success flex items-center gap-1.5">
                <CheckSquare size={14} />
                Saved successfully
              </p>
            )}
            {submit.error && (
              <p className="text-sm text-error flex items-center gap-1.5">
                <AlertCircle size={14} />
                {(submit.error as Error).message}
              </p>
            )}
          </div>
          <Button
            loading={submit.isPending}
            onClick={handleSubmit}
            disabled={students.length === 0}
          >
            Save {session} register
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Daily summary view ────────────────────────────────────────

function DailySummaryView({ classId, date }: { classId: string; date: string }) {
  const { data: summary = [], isLoading } = useDailySummary(classId, date);

  if (isLoading) {
    return <div className="h-64 bg-surface-tertiary rounded animate-pulse" />;
  }

  if (summary.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="No records yet"
        description="No attendance has been submitted for this date."
      />
    );
  }

  const morningPresent   = summary.filter((r) => r.morning?.status   === "present").length;
  const afternoonPresent = summary.filter((r) => r.afternoon?.status === "present").length;

  function statusCell(status: string | undefined) {
    if (!status) return <span className="text-text-muted text-xs">—</span>;
    return (
      <Badge
        label={status.charAt(0).toUpperCase() + status.slice(1)}
        variant={status === "present" ? "success" : "error"}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: "Morning present",   value: morningPresent,   icon: Sun,     color: "text-amber-600" },
          { label: "Afternoon present", value: afternoonPresent, icon: CloudSun,color: "text-blue-600"  },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} padding="sm">
              <div className="flex items-center gap-3">
                <Icon size={18} className={stat.color} />
                <div>
                  <p className="text-xs text-text-muted">{stat.label}</p>
                  <p className="text-xl font-semibold text-text-primary">
                    {stat.value} / {summary.length}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-secondary">
                <th className="text-left px-5 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Student</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-amber-600 uppercase tracking-wide">Morning</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-blue-600 uppercase tracking-wide">Afternoon</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((row, i) => (
                <tr
                  key={row.studentId}
                  className={classNames(
                    "border-b border-border last:border-0",
                    i % 2 === 1 ? "bg-surface-secondary" : "",
                  )}
                >
                  <td className="px-5 py-3">
                    <p className="font-medium text-text-primary">
                      {row.student.lastName}, {row.student.firstName}
                    </p>
                    <p className="text-xs text-text-muted">{row.student.admissionNumber ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3 text-center">{statusCell(row.morning?.status)}</td>
                  <td className="px-4 py-3 text-center">{statusCell(row.afternoon?.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────

export default function AttendancePage() {
  const today = todayString();
  const [date,          setDate         ] = useState(today);
  const [selectedClass, setSelectedClass] = useState("");
  const [activeTab,     setActiveTab    ] = useState<"register" | "summary">("register");
  const [exporting,     setExporting    ] = useState(false);

  const { can, isTeacher } = usePermission();
  const readOnly  = !can.submitAttendance;
  const user      = useAuthStore((s) => s.user);
  const schoolId  = useAuthStore((s) => s.schoolId);

  // Load this teacher's assignments to filter which classes they can see
  const { data: myAssignments = [] } = useAssignmentsByUser(user?.id ?? "");

  // Admins see all classes; teachers only see their assigned classes
  const { data: allClasses = [] } = useClasses();
  const availableClasses = isTeacher
    ? allClasses.filter((c) => myAssignments.some((a) => a.classId === c.id && a.isClassTeacher))
    : allClasses;

  // Teachers must be class teacher on at least one class to access attendance
  const isClassTeacher = isTeacher
    ? myAssignments.some((a) => a.isClassTeacher)
    : true;

  const { data: sessionInfo, isLoading: sessionLoading } = useActiveSession();

  const isToday         = date === today;
  const isMorningLocked = isToday ? (sessionInfo?.isMorningLocked ?? false) : false;
  const morningLocked   = isToday ? isMorningLocked  : false;
  const afternoonLocked = isToday ? !isMorningLocked : false;

  async function handleExport() {
    if (!selectedClass || !schoolId) return;
    setExporting(true);
    try {
      const base     = process.env.NEXT_PUBLIC_API_URL ?? "https://school-mgt-server.vercel.app/api/v1";
      const token    = document.cookie.split("; ").find((r) => r.startsWith("rr_access="))?.substring("rr_access=".length);
      const fromDate = offsetDate(today, -30);
      const url      = `${base}/attendance/export?classId=${selectedClass}&schoolId=${schoolId}&from=${fromDate}&to=${today}`;
      const res      = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Export failed");
      const blob    = await res.blob();
      const link    = document.createElement("a");
      link.href     = URL.createObjectURL(blob);
      link.download = `register_${availableClasses.find(c => c.id === selectedClass)?.name ?? "class"}_${fromDate}_to_${today}.xlsx`;
      link.click();
      URL.revokeObjectURL(link.href);
    } finally {
      setExporting(false);
    }
  }

  // Block teachers who are not appointed as class teacher
  if (isTeacher && !isClassTeacher) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center gap-3 p-6">
        <Lock size={32} className="text-text-muted" />
        <p className="text-sm font-semibold text-text-primary">Access restricted</p>
        <p className="text-xs text-text-muted max-w-xs leading-relaxed">
          Only class teachers can access the attendance register.
          Ask your admin to appoint you as class teacher for a class.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {readOnly && (
        <ReadOnlyBanner message="Only admins and teachers can submit attendance." />
      )}

      <PageHeader
        title="Attendance"
        subtitle="Morning and afternoon register"
        action={
          selectedClass ? (
            <Button
              size="sm"
              variant="secondary"
              loading={exporting}
              onClick={handleExport}
            >
              <Download size={14} />
              Export register
            </Button>
          ) : undefined
        }
      />

      {/* Controls */}
      <Card padding="sm">
        <div className="flex flex-wrap items-center gap-4">
          {/* Class selector */}
          <div className="flex-1 min-w-48">
            <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">
              Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full h-9 px-3 text-sm border border-border rounded bg-surface text-text-primary focus:outline-2 focus:outline-navy-600"
            >
              <option value="">Select a class</option>
              {availableClasses.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Date navigation */}
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">
              Date
            </label>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setDate(offsetDate(date, -1))}
                className="h-9 w-9 flex items-center justify-center rounded border border-border hover:bg-surface-secondary transition-colors cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <input
                type="date"
                value={date}
                max={today}
                onChange={(e) => setDate(e.target.value)}
                className="h-9 px-3 text-sm border border-border rounded bg-surface text-text-primary focus:outline-2 focus:outline-navy-600"
              />
              <button
                onClick={() => setDate(offsetDate(date, 1))}
                disabled={date >= today}
                className="h-9 w-9 flex items-center justify-center rounded border border-border hover:bg-surface-secondary transition-colors cursor-pointer disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Active session indicator — today only */}
          {isToday && !sessionLoading && sessionInfo && (
            <div className="self-end">
              <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">
                Current session
              </label>
              <SessionBadge
                session={sessionInfo.session}
                isMorningLocked={isMorningLocked}
              />
            </div>
          )}
        </div>

        <p className="text-xs text-text-muted mt-3">
          {formatDisplayDate(date)}{isToday && " — Today"}
        </p>
      </Card>

      {!selectedClass ? (
        <Card>
          <EmptyState
            icon={ClipboardList}
            title="Select a class to begin"
            description="Choose a class above to take attendance."
          />
        </Card>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex gap-1 border-b border-border">
            {(["register", "summary"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={classNames(
                  "px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors cursor-pointer",
                  activeTab === tab
                    ? "border-navy-600 text-navy-600"
                    : "border-transparent text-text-muted hover:text-text-primary",
                )}
              >
                {tab === "register" ? "Take Register" : "Daily Summary"}
              </button>
            ))}
          </div>

          {activeTab === "register" && (
            <div className="flex flex-col gap-4">
              {!isToday && (
                <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                  <AlertCircle size={16} className="shrink-0" />
                  You are editing a past date. Changes will overwrite existing records.
                </div>
              )}

              {/* Morning register */}
              <Card padding="none">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Sun size={16} className="text-amber-500" />
                    <h3 className="text-sm font-semibold text-text-primary">Morning register</h3>
                    <span className="text-xs text-text-muted">· closes at 11:00</span>
                  </div>
                  {morningLocked && (
                    <Badge label="Closed" variant="warning" />
                  )}
                </div>
                <div className="p-5">
                  <RegisterView
                    classId={selectedClass}
                    date={date}
                    session="morning"
                    readOnly={readOnly}
                    locked={morningLocked}
                    lockReason="Morning registration closed at 11:00. Records are read-only."
                  />
                </div>
              </Card>

              {/* Afternoon register */}
              <Card padding="none">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                  <div className="flex items-center gap-2">
                    <CloudSun size={16} className="text-blue-500" />
                    <h3 className="text-sm font-semibold text-text-primary">Afternoon register</h3>
                    <span className="text-xs text-text-muted">· opens at 11:00</span>
                  </div>
                  {afternoonLocked && (
                    <Badge label="Not yet open" variant="default" />
                  )}
                </div>
                <div className="p-5">
                  <RegisterView
                    classId={selectedClass}
                    date={date}
                    session="afternoon"
                    readOnly={readOnly}
                    locked={afternoonLocked}
                    lockReason="Afternoon registration opens at 11:00."
                  />
                </div>
              </Card>
            </div>
          )}

          {activeTab === "summary" && (
            <DailySummaryView classId={selectedClass} date={date} />
          )}
        </>
      )}
    </div>
  );
}