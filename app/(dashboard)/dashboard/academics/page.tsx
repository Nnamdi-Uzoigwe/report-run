"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen, Save, Send, RefreshCw,
  ChevronDown, AlertCircle, CheckCircle, Printer, Download,
} from "lucide-react";
import {
  PageHeader, Card, CardHeader, Badge, Button, EmptyState,
} from "@/components/ui";
import {
  useScoresBySubject, useSubmitScores,
  useReports, useGenerateReports, usePublishReports,
  useUpdateReportTeacherInput,
} from "@/lib/queries/academics";
import { useClasses, useSubjects, useGradingSchemes } from "@/lib/queries/classes";
import { useStudents } from "@/lib/queries/students";
import { usePermission } from "@/lib/hooks/usePermission";
import { useAssignmentsByUser } from "@/lib/queries/staff";
import { useAuthStore } from "@/lib/store";
import { ReadOnlyBanner } from "@/components/dashboard/ReadOnlyBanner";
import { classNames } from "@/lib/utils";
import type { ScoreTerm, Score, Report, Subject } from "@/types";

// ── Constants ─────────────────────────────────────────────────

const TERM_OPTIONS = [
  { value: "first",  label: "First Term"  },
  { value: "second", label: "Second Term" },
  { value: "third",  label: "Third Term"  },
];

function gradeVariant(grade: string): "success" | "warning" | "error" | "default" {
  if (["A1", "B2", "B3"].includes(grade)) return "success";
  if (["C4", "C5", "C6"].includes(grade)) return "warning";
  if (["D7", "E8", "F9"].includes(grade)) return "error";
  return "default";
}

// ── Score Entry Table ─────────────────────────────────────────
// Inline editing — one row per student, CA and exam inputs side by side.

interface ScoreRow {
  studentId:  string;
  firstName:  string;
  lastName:   string;
  admissionNumber?: string;
  caScore:    string; // string so input is controlled cleanly
  examScore:  string;
  saved?:     Score;  // existing record if any
}

function ScoreEntryTable({
  classId,
  subject,
  term,
  academicYear,
  readOnly,
}: {
  classId:      string;
  subject:      Subject;
  term:         ScoreTerm;
  academicYear: string;
  readOnly:     boolean;
}) {
  const { data: students = [] }       = useStudents(classId);
  const { data: existing = [], isLoading } = useScoresBySubject(subject.id, term, academicYear);
  const submitScores = useSubmitScores();

  const [rows, setRows] = useState<ScoreRow[]>([]);
  const [dirty, setDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // Build rows from students + any existing scores.
  // We key on students.length and a stable string of existing IDs
  // to avoid depending on array references that change every render.
  const existingKey = existing.map((s) => `${s.studentId}:${s.caScore}:${s.examScore}`).join(",");

  useEffect(() => {
    const existingMap = new Map(existing.map((s) => [s.studentId, s]));
    setRows(
      students.map((st) => {
        const ex = existingMap.get(st.id);
        return {
          studentId:       st.id,
          firstName:       st.firstName,
          lastName:        st.lastName,
          admissionNumber: st.admissionNumber,
          caScore:         ex ? String(ex.caScore)  : "",
          examScore:       ex ? String(ex.examScore) : "",
          saved:           ex,
        };
      })
    );
    setDirty(false);
    setSaveStatus("idle");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students.length, existingKey]);

  function updateRow(idx: number, field: "caScore" | "examScore", value: string) {
    setRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
    setDirty(true);
    setSaveStatus("idle");
  }

  function validateRow(row: ScoreRow): string | null {
    const ca   = Number(row.caScore);
    const exam = Number(row.examScore);
    if (row.caScore !== "" && (isNaN(ca)   || ca   < 0 || ca   > subject.maxCaScore))
      return `CA must be 0–${subject.maxCaScore}`;
    if (row.examScore !== "" && (isNaN(exam) || exam < 0 || exam > subject.maxExamScore))
      return `Exam must be 0–${subject.maxExamScore}`;
    return null;
  }

  async function handleSave() {
    // Only submit rows that have at least one score entered
    const filled = rows.filter((r) => r.caScore !== "" || r.examScore !== "");
    if (filled.length === 0) return;

    // Validate all
    for (const row of filled) {
      const err = validateRow(row);
      if (err) {
        setSaveStatus("error");
        return;
      }
    }

    setSaveStatus("saving");
    try {
      await submitScores.mutateAsync({
        subjectId:    subject.id,
        term,
        academicYear,
        entries: filled.map((r) => ({
          studentId: r.studentId,
          caScore:   Number(r.caScore)   || 0,
          examScore: Number(r.examScore) || 0,
        })),
      });
      setDirty(false);
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 p-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-surface-tertiary rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="No students in this class"
        description="Add students to this class first."
      />
    );
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-surface-secondary">
        <div className="text-xs text-text-muted">
          CA max: <span className="font-semibold text-text-primary">{subject.maxCaScore}</span>
          &nbsp;·&nbsp;
          Exam max: <span className="font-semibold text-text-primary">{subject.maxExamScore}</span>
          &nbsp;·&nbsp;
          Total: <span className="font-semibold text-text-primary">{subject.maxCaScore + subject.maxExamScore}</span>
        </div>
        {!readOnly && (
          <div className="flex items-center gap-3">
            {saveStatus === "saved" && (
              <span className="flex items-center gap-1 text-xs text-success">
                <CheckCircle size={12} /> Saved
              </span>
            )}
            {saveStatus === "error" && (
              <span className="flex items-center gap-1 text-xs text-error">
                <AlertCircle size={12} /> Check scores
              </span>
            )}
            <Button
              size="sm"
              loading={saveStatus === "saving"}
              disabled={!dirty}
              onClick={handleSave}
            >
              <Save size={13} />
              Save scores
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-5 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Student</th>
              <th className="text-center px-3 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide w-28">CA /{subject.maxCaScore}</th>
              <th className="text-center px-3 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide w-28">Exam /{subject.maxExamScore}</th>
              <th className="text-center px-3 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide w-20">Total</th>
              <th className="text-center px-3 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide w-20">Grade</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const ca    = Number(row.caScore)   || 0;
              const exam  = Number(row.examScore) || 0;
              const total = ca + exam;
              const grade = row.saved?.grade ?? "—";
              const caErr   = row.caScore   !== "" && (isNaN(Number(row.caScore))   || Number(row.caScore)   > subject.maxCaScore   || Number(row.caScore)   < 0);
              const examErr = row.examScore !== "" && (isNaN(Number(row.examScore)) || Number(row.examScore) > subject.maxExamScore || Number(row.examScore) < 0);

              return (
                <tr
                  key={row.studentId}
                  className={classNames(
                    "border-b border-border last:border-0 transition-colors",
                    idx % 2 === 1 ? "bg-surface-secondary" : "",
                  )}
                >
                  <td className="px-5 py-2.5">
                    <p className="font-medium text-text-primary">{row.lastName}, {row.firstName}</p>
                    <p className="text-xs text-text-muted">{row.admissionNumber ?? "—"}</p>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {readOnly ? (
                      <span className="text-text-primary">{row.caScore || "—"}</span>
                    ) : (
                      <input
                        type="number"
                        min={0}
                        max={subject.maxCaScore}
                        value={row.caScore}
                        onChange={(e) => updateRow(idx, "caScore", e.target.value)}
                        className={classNames(
                          "w-20 h-8 text-center text-sm border rounded bg-surface focus:outline-2 focus:outline-navy-600",
                          caErr ? "border-error text-error" : "border-border",
                        )}
                        placeholder="—"
                      />
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {readOnly ? (
                      <span className="text-text-primary">{row.examScore || "—"}</span>
                    ) : (
                      <input
                        type="number"
                        min={0}
                        max={subject.maxExamScore}
                        value={row.examScore}
                        onChange={(e) => updateRow(idx, "examScore", e.target.value)}
                        className={classNames(
                          "w-20 h-8 text-center text-sm border rounded bg-surface focus:outline-2 focus:outline-navy-600",
                          examErr ? "border-error text-error" : "border-border",
                        )}
                        placeholder="—"
                      />
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={classNames(
                      "font-semibold",
                      row.caScore || row.examScore ? "text-text-primary" : "text-text-muted",
                    )}>
                      {row.caScore || row.examScore ? total : "—"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {row.saved ? (
                      <Badge label={grade} variant={gradeVariant(grade)} />
                    ) : (
                      <span className="text-text-muted text-xs">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Report Row ────────────────────────────────────────────────

function ReportRow({
  report,
  isClassTeacher,
  readOnly,
}: {
  report:         Report;
  isClassTeacher: boolean;
  readOnly:       boolean;
}) {
  const [expanded,  setExpanded ] = useState(false);
  const [comment,   setComment  ] = useState(report.teacherComment ?? "");
  const [conduct,   setConduct  ] = useState(report.conduct    ?? 3);
  const [punctuality,setPunctuality] = useState(report.punctuality ?? 3);
  const [neatness,  setNeatness ] = useState(report.neatness   ?? 3);
  const [saving,    setSaving   ] = useState(false);
  const [saved,     setSaved    ] = useState(false);

  const updateTeacher = useUpdateReportTeacherInput();

  async function handleSaveTeacherInput() {
    setSaving(true);
    try {
      await updateTeacher.mutateAsync({
        reportId:     report.id,
        classId:      report.classId,
        term:         report.term,
        academicYear: report.academicYear,
        data: { teacherComment: comment, conduct, punctuality, neatness },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  function TraitSlider({
    label,
    value,
    onChange,
  }: {
    label:    string;
    value:    number;
    onChange: (v: number) => void;
  }) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-xs text-text-muted w-20 shrink-0">{label}</span>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              disabled={readOnly}
              onClick={() => !readOnly && onChange(n)}
              className={classNames(
                "w-7 h-7 rounded text-xs font-semibold border transition-colors cursor-pointer disabled:cursor-default",
                value === n
                  ? "bg-navy-600 border-navy-600 text-white"
                  : "border-border text-text-muted hover:border-navy-400 hover:text-navy-600",
              )}
            >
              {n}
            </button>
          ))}
        </div>
        <span className="text-xs text-text-muted">{value}/5</span>
      </div>
    );
  }

  return (
    <div className="border-b border-border last:border-0">
      {/* Main row */}
      <div
        className="flex items-center gap-4 px-5 py-3 hover:bg-surface-secondary transition-colors cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary">
            {report.student.firstName} {report.student.lastName}
          </p>
          <p className="text-xs text-text-muted">{report.student.admissionNumber ?? "—"}</p>
        </div>
        <div className="flex items-center gap-6 shrink-0">
          <div className="text-center">
            <p className="text-xs text-text-muted">Position</p>
            <p className="text-sm font-semibold text-text-primary">
              {report.position ? `${report.position}${ordinal(report.position)}` : "—"}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-text-muted">Average</p>
            <p className="text-sm font-semibold text-text-primary">
              {Number(report.average).toFixed(1)}%
            </p>
          </div>
          <Badge
            label={report.status === "published" ? "Published" : "Draft"}
            variant={report.status === "published" ? "success" : "default"}
          />
          {isClassTeacher && (
            <ChevronDown
              size={16}
              className={classNames(
                "text-text-muted transition-transform duration-200",
                expanded ? "rotate-180" : "",
              )}
            />
          )}
        </div>
      </div>

      {/* Expanded teacher input */}
      {expanded && isClassTeacher && (
        <div className="px-5 pb-5 bg-surface-secondary border-t border-border">
          <div className="flex flex-col gap-4 pt-4">
            <div>
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wide block mb-1.5">
                Terminal comment
              </label>
              <textarea
                rows={3}
                value={comment}
                disabled={readOnly}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write a short comment about this student's performance this term..."
                className="w-full px-3 py-2 text-sm border border-border rounded bg-surface text-text-primary focus:outline-2 focus:outline-navy-600 placeholder:text-text-muted resize-none disabled:opacity-60"
              />
            </div>
            <div className="flex flex-col gap-3">
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wide">
                Character traits
              </label>
              <TraitSlider label="Conduct"     value={conduct}      onChange={setConduct}      />
              <TraitSlider label="Punctuality" value={punctuality}  onChange={setPunctuality}  />
              <TraitSlider label="Neatness"    value={neatness}     onChange={setNeatness}     />
            </div>
            {!readOnly && (
              <div className="flex items-center justify-end gap-3 pt-1">
                {saved && (
                  <span className="text-xs text-success flex items-center gap-1">
                    <CheckCircle size={12} /> Saved
                  </span>
                )}
                <Button size="sm" loading={saving} onClick={handleSaveTeacherInput}>
                  <Save size={13} />
                  Save comment
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] ?? s[v] ?? s[0];
}

// ── Page ──────────────────────────────────────────────────────

export default function AcademicsPage() {
  const [activeTab,        setActiveTab       ] = useState<"scores" | "reports">("scores");
  const [selectedClassId,  setSelectedClassId ] = useState("");
  const [selectedSubjectId,setSelectedSubjectId] = useState("");
  const [term,             setTerm            ] = useState<ScoreTerm>("first");
  const [academicYear,     setAcademicYear    ] = useState("2024/2025");

  const [exporting,    setExporting   ] = useState<"scores" | "transcript" | null>(null);

  const schoolId = useAuthStore((s) => s.schoolId);

  async function downloadExcel(url: string, filename: string) {
    const token = document.cookie
      .split("; ")
      .find((r) => r.startsWith("rr_access="))
      ?.substring("rr_access=".length);
    const base = process.env.NEXT_PUBLIC_API_URL ?? "https://school-mgt-server.vercel.app/api/v1";
    const res  = await fetch(`${base}${url}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Download failed");
    const blob   = await res.blob();
    const link   = document.createElement("a");
    link.href    = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  async function handleScoreSheetExport() {
    if (!selectedClassId || !selectedSubjectId || !schoolId) return;
    setExporting("scores");
    try {
      await downloadExcel(
        `/reports/export/subject-scores?subjectId=${selectedSubjectId}&classId=${selectedClassId}&schoolId=${schoolId}&term=${term}&academicYear=${academicYear}`,
        `scores_${selectedSubject?.name ?? "subject"}_${term}_${academicYear}.pdf`,
      );
    } finally {
      setExporting(null);
    }
  }

  async function handleTranscriptExport() {
    if (!selectedClassId || !schoolId) return;
    setExporting("transcript");
    try {
      await downloadExcel(
        `/reports/export/transcript?classId=${selectedClassId}&schoolId=${schoolId}&term=${term}&academicYear=${academicYear}`,
        `transcript_${availableClasses.find((c) => c.id === selectedClassId)?.name ?? "class"}_${term}_${academicYear}.pdf`,
      );
    } finally {
      setExporting(null);
    }
  }
  const router = useRouter();
  const { can, isTeacher } = usePermission();
  const readOnly = !can.enterScores;
  const user     = useAuthStore((s) => s.user);

  // Get teacher's own assignments to know which classes + subjects they teach
  const { data: myAssignments = [] } = useAssignmentsByUser(user?.id ?? "");

  const { data: allClasses = [] } = useClasses();
  const { data: allSubjects = [] } = useSubjects(selectedClassId);
  const { data: schemes     = [] } = useGradingSchemes();

  // Teachers only see classes they are assigned to
  const availableClasses = isTeacher
    ? allClasses.filter((c) => myAssignments.some((a) => a.classId === c.id))
    : allClasses;

  // Teachers only see subjects they personally teach in the selected class
  const assignmentForClass = myAssignments.find((a) => a.classId === selectedClassId);
  const mySubjectIds = assignmentForClass?.subjects?.map((s) => s.id) ?? [];
  const subjects = isTeacher && mySubjectIds.length > 0
    ? allSubjects.filter((s) => mySubjectIds.includes(s.id))
    : allSubjects;

  // Teacher is class teacher of the currently selected class
  const isClassTeacherOfSelected = isTeacher
    ? myAssignments.some((a) => a.classId === selectedClassId && a.isClassTeacher)
    : true; // admins always have access

  const { data: reports = [], isLoading: reportsLoading } = useReports(
    selectedClassId, term, academicYear,
  );

  const generateReports = useGenerateReports();
  const publishReports  = usePublishReports();

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);

  // Class teacher terminal access
  const isClassTeacher = isTeacher ? isClassTeacherOfSelected : true;

  const defaultScheme = schemes.find((s) => s.isDefault);

  return (
    <div className="flex flex-col gap-6">
      {readOnly && (
        <ReadOnlyBanner message="Only admins and teachers can enter scores." />
      )}

      <PageHeader
        title="Academics & Results"
        subtitle="Score entry, report generation and publishing"
      />

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1 uppercase tracking-wide">Class</label>
            <select
              value={selectedClassId}
              onChange={(e) => { setSelectedClassId(e.target.value); setSelectedSubjectId(""); }}
              className="h-9 px-3 text-sm border border-border rounded bg-surface text-text-primary focus:outline-2 focus:outline-navy-600"
            >
              <option value="">Select class</option>
              {availableClasses.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1 uppercase tracking-wide">Term</label>
            <select
              value={term}
              onChange={(e) => setTerm(e.target.value as ScoreTerm)}
              className="h-9 px-3 text-sm border border-border rounded bg-surface text-text-primary focus:outline-2 focus:outline-navy-600"
            >
              {TERM_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1 uppercase tracking-wide">Academic year</label>
            <input
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              placeholder="2024/2025"
              className="h-9 px-3 text-sm border border-border rounded bg-surface text-text-primary focus:outline-2 focus:outline-navy-600 w-28"
            />
          </div>
          {activeTab === "scores" && (
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1 uppercase tracking-wide">Subject</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                disabled={!selectedClassId}
                className="h-9 px-3 text-sm border border-border rounded bg-surface text-text-primary focus:outline-2 focus:outline-navy-600 disabled:opacity-50"
              >
                <option value="">Select subject</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </Card>

      {/* Grading scheme */}
      {defaultScheme && (
        <Card padding="sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wide mr-2">
              Grade scale:
            </span>
            {defaultScheme.bands.map((band) => (
              <div key={band.grade} className="flex items-center gap-1.5 px-2 py-1 border border-border rounded">
                <Badge label={band.grade} variant={gradeVariant(band.grade)} />
                <span className="text-xs text-text-muted">{band.minScore}–{band.maxScore}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        <button
          onClick={() => setActiveTab("scores")}
          className={classNames(
            "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer",
            activeTab === "scores"
              ? "border-navy-600 text-navy-600"
              : "border-transparent text-text-muted hover:text-text-primary",
          )}
        >
          Score Entry
        </button>
        {/* Reports tab — only visible to admins or class teachers of selected class */}
        {(!isTeacher || isClassTeacherOfSelected) && (
          <button
            onClick={() => setActiveTab("reports")}
            className={classNames(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer",
              activeTab === "reports"
                ? "border-navy-600 text-navy-600"
                : "border-transparent text-text-muted hover:text-text-primary",
            )}
          >
            Reports & Results
          </button>
        )}
      </div>

      {/* ── Score entry tab ── */}
      {activeTab === "scores" && (
        <Card padding="none">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-text-primary">
                {selectedSubject
                  ? `${selectedSubject.name} — ${availableClasses.find((c) => c.id === selectedClassId)?.name}`
                  : selectedClassId
                  ? "Select a subject to enter scores"
                  : "Select a class and subject to begin"}
              </p>
              {selectedSubject && (
                <p className="text-xs text-text-muted mt-0.5">
                  Click any cell and type the score. Click Save scores when done.
                </p>
              )}
              {isTeacher && selectedClassId && subjects.length === 0 && (
                <p className="text-xs text-text-muted mt-0.5">
                  No subjects assigned to you in this class. Ask your admin to assign subjects.
                </p>
              )}
            </div>
            {selectedClassId && selectedSubjectId && (
              <Button
                size="sm"
                variant="secondary"
                loading={exporting === "scores"}
                onClick={handleScoreSheetExport}
              >
                <Download size={13} />
                Export score sheet
              </Button>
            )}
          </div>

          {!selectedClassId || !selectedSubjectId ? (
            <div className="flex items-center justify-center h-48 text-text-muted text-sm">
              {!selectedClassId ? "Select a class above" : "Select a subject above"}
            </div>
          ) : (
            <ScoreEntryTable
              classId={selectedClassId}
              subject={selectedSubject!}
              term={term}
              academicYear={academicYear}
              readOnly={readOnly}
            />
          )}
        </Card>
      )}

      {/* ── Reports tab ── */}
      {activeTab === "reports" && (
        <Card padding="none">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div>
              <p className="text-sm font-semibold text-text-primary">
                {selectedClassId
                  ? `${availableClasses.find((c) => c.id === selectedClassId)?.name} — ${term.charAt(0).toUpperCase() + term.slice(1)} Term ${academicYear}`
                  : "Select a class to view reports"}
              </p>
              {selectedClassId && (
                <p className="text-xs text-text-muted mt-0.5">
                  {reports.length} report{reports.length !== 1 ? "s" : ""}
                  {" · "}
                  {reports.filter((r) => r.status === "published").length} published
                </p>
              )}
            </div>
            {!readOnly && selectedClassId && (
              <div className="flex items-center gap-2">
                {isClassTeacherOfSelected && (
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={exporting === "transcript"}
                    onClick={handleTranscriptExport}
                  >
                    <Download size={13} />
                    Export transcript
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="secondary"
                  loading={generateReports.isPending}
                  onClick={() => generateReports.mutate({ classId: selectedClassId, term, academicYear })}
                >
                  <RefreshCw size={13} />
                  Generate
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  loading={publishReports.isPending}
                  onClick={() => {
                    if (confirm("This will publish all reports and email a PDF report card to each parent. Continue?")) {
                      publishReports.mutate({ classId: selectedClassId, term, academicYear });
                    }
                  }}
                >
                  <Send size={13} />
                  Publish & email PDF
                </Button>
              </div>
            )}
          </div>

          {!selectedClassId ? (
            <div className="flex items-center justify-center h-48 text-text-muted text-sm">
              Select a class above
            </div>
          ) : reportsLoading ? (
            <div className="flex flex-col gap-2 p-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 bg-surface-tertiary rounded animate-pulse" />
              ))}
            </div>
          ) : reports.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No reports yet"
              description="Enter all scores first, then click Generate to compute positions and averages."
            />
          ) : (
            <>
              {/* Summary bar */}
              <div className="flex items-center gap-8 px-5 py-3 border-b border-border bg-surface-secondary text-xs text-text-muted">
                <span>
                  Total: <span className="font-semibold text-text-primary">{reports.length}</span>
                </span>
                <span>
                  Highest: <span className="font-semibold text-success">
                    {Math.max(...reports.map((r) => Number(r.average))).toFixed(1)}%
                  </span>
                </span>
                <span>
                  Lowest: <span className="font-semibold text-error">
                    {Math.min(...reports.map((r) => Number(r.average))).toFixed(1)}%
                  </span>
                </span>
                <span>
                  Class avg: <span className="font-semibold text-text-primary">
                    {(reports.reduce((s, r) => s + Number(r.average), 0) / reports.length).toFixed(1)}%
                  </span>
                </span>
              </div>

              {/* Report rows */}
              <div>
                {reports
                  .slice()
                  .sort((a, b) => (a.position ?? 999) - (b.position ?? 999))
                  .map((report) => (
                    <div key={report.id}>
                      <div className="flex items-center justify-between px-5 py-0.5 bg-surface-secondary border-b border-border">
                        <span />
                        <button
                          onClick={() => router.push(`/dashboard/academics/report/${report.id}`)}
                          className="flex items-center gap-1 text-xs text-text-muted hover:text-navy-600 transition-colors cursor-pointer py-1"
                        >
                          <Printer size={11} />
                          Print card
                        </button>
                      </div>
                      <ReportRow
                        report={report}
                        isClassTeacher={isClassTeacher}
                        readOnly={readOnly}
                      />
                    </div>
                  ))}
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  );
}