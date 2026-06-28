"use client";

import { useEffect, useState } from "react";
import { Plus, Search, AlertCircle, BookOpen } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  PageHeader,
  Card,
  CardHeader,
  Badge,
  Button,
  Modal,
  Input,
  Select,
  EmptyState,
  Table,
} from "@/components/ui";
import {
  fetchResults,
  fetchStudents,
  fetchSubjects,
  fetchClasses,
  upsertResult,
} from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import type { Result, Student, Subject, Class, SelectOption } from "@/types";
import { usePermission } from "@/lib/hooks/usePermission";
import { ReadOnlyBanner } from "@/components/dashboard/ReadOnlyBanner";

// ── Schema ────────────────────────────────────────────────────

const schema = z.object({
  studentId: z.string().min(1, "Select a student"),
  subjectId: z.string().min(1, "Select a subject"),
  classId: z.string().min(1, "Select a class"),
  ca: z.coerce.number().min(0).max(40, "CA max is 40"),
  exam: z.coerce.number().min(0).max(60, "Exam max is 60"),
  term: z.string().min(1, "Select a term"),
  session: z.string().min(1, "Enter session"),
});

type FormData = z.infer<typeof schema>;

// ── Helpers ───────────────────────────────────────────────────

function getGrade(total: number): { grade: string; remark: string } {
  if (total >= 75) return { grade: "A1", remark: "Excellent" };
  if (total >= 70) return { grade: "B2", remark: "Very Good" };
  if (total >= 65) return { grade: "B3", remark: "Good" };
  if (total >= 60) return { grade: "C4", remark: "Credit" };
  if (total >= 55) return { grade: "C5", remark: "Credit" };
  if (total >= 50) return { grade: "C6", remark: "Credit" };
  if (total >= 45) return { grade: "D7", remark: "Pass" };
  if (total >= 40) return { grade: "E8", remark: "Pass" };
  return { grade: "F9", remark: "Fail" };
}

function gradeVariant(
  grade: string,
): "success" | "warning" | "error" | "default" {
  if (["A1", "B2", "B3"].includes(grade)) return "success";
  if (["C4", "C5", "C6"].includes(grade)) return "warning";
  if (["F9"].includes(grade)) return "error";
  return "default";
}

const TERM_OPTIONS: SelectOption[] = [
  { value: "First Term", label: "First Term" },
  { value: "Second Term", label: "Second Term" },
  { value: "Third Term", label: "Third Term" },
];

// ── Page ──────────────────────────────────────────────────────

export default function AcademicsPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [activeTab, setActiveTab] = useState<"results" | "subjects">("results");

  const { can } = usePermission();
  const readOnly = !can.enterScores;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { term: "Third Term", session: "2024/2025" },
  });

  const selectedClassId = watch("classId");

  useEffect(() => {
    Promise.all([
      fetchResults(),
      fetchStudents(),
      fetchSubjects(),
      fetchClasses(),
    ])
      .then(([r, s, sub, c]) => {
        setResults(r);
        setStudents(s);
        setSubjects(sub);
        setClasses(c);
      })
      .catch(() => setError("Failed to load academics data."))
      .finally(() => setLoading(false));
  }, []);

  async function onSubmit(data: FormData) {
    setSaving(true);
    try {
      const student = students.find((s) => s.id === data.studentId);
      const subject = subjects.find((s) => s.id === data.subjectId);
      const cls = classes.find((c) => c.id === data.classId);
      const total = data.ca + data.exam;
      const { grade, remark } = getGrade(total);

      const created = await upsertResult({
        studentId: data.studentId,
        studentName: student ? `${student.firstName} ${student.lastName}` : "",
        admissionNumber: student?.admissionNumber ?? "",
        classId: data.classId,
        className: cls?.name ?? "",
        subjectId: data.subjectId,
        subjectName: subject?.name ?? "",
        ca: data.ca,
        exam: data.exam,
        total,
        grade,
        remark,
        term: data.term,
        session: data.session,
      });
      setResults((prev) => [created, ...prev]);
      reset({ term: "Third Term", session: "2024/2025" });
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  }

  // Filtered results
  const filtered = results.filter((r) => {
    const matchesSearch =
      search === "" ||
      r.studentName.toLowerCase().includes(search.toLowerCase()) ||
      r.subjectName.toLowerCase().includes(search.toLowerCase());
    const matchesClass = classFilter === "" || r.classId === classFilter;
    return matchesSearch && matchesClass;
  });

  // Options
  const studentOptions: SelectOption[] = students.map((s) => ({
    value: s.id,
    label: `${s.firstName} ${s.lastName} (${s.admissionNumber})`,
  }));

  const subjectOptions: SelectOption[] = subjects
    .filter((s) => !selectedClassId || s.classIds.includes(selectedClassId))
    .map((s) => ({ value: s.id, label: s.name }));

  const classOptions: SelectOption[] = classes.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  const classFilterOptions: SelectOption[] = [
    { value: "", label: "All classes" },
    ...classOptions,
  ];

  // Summary stats
  const avgScore = results.length
    ? Math.round(results.reduce((s, r) => s + r.total, 0) / results.length)
    : 0;
  const passCount = results.filter((r) => r.total >= 50).length;
  const failCount = results.filter((r) => r.total < 50).length;

  // Table columns
  const resultColumns = [
    {
      key: "student",
      header: "Student",
      render: (r: Result) => (
        <div>
          <p className="font-medium text-text-primary">{r.studentName}</p>
          <p className="text-xs text-text-muted">{r.admissionNumber}</p>
        </div>
      ),
    },
    {
      key: "class",
      header: "Class",
      render: (r: Result) => (
        <span className="text-text-secondary">{r.className}</span>
      ),
    },
    {
      key: "subject",
      header: "Subject",
      render: (r: Result) => (
        <span className="text-text-secondary">{r.subjectName}</span>
      ),
    },
    {
      key: "ca",
      header: "CA",
      render: (r: Result) => (
        <span className="text-text-primary">{r.ca}/40</span>
      ),
    },
    {
      key: "exam",
      header: "Exam",
      render: (r: Result) => (
        <span className="text-text-primary">{r.exam}/60</span>
      ),
    },
    {
      key: "total",
      header: "Total",
      render: (r: Result) => (
        <span className="font-semibold text-text-primary">{r.total}/100</span>
      ),
    },
    {
      key: "grade",
      header: "Grade",
      render: (r: Result) => (
        <Badge
          label={`${r.grade} — ${r.remark}`}
          variant={gradeVariant(r.grade)}
        />
      ),
    },
    {
      key: "term",
      header: "Term",
      render: (r: Result) => (
        <span className="text-xs text-text-muted">{r.term}</span>
      ),
    },
  ];

  const subjectColumns = [
    {
      key: "name",
      header: "Subject",
      render: (s: Subject) => (
        <span className="font-medium text-text-primary">{s.name}</span>
      ),
    },
    {
      key: "code",
      header: "Code",
      render: (s: Subject) => (
        <span className="text-text-secondary">{s.code}</span>
      ),
    },
    {
      key: "teacher",
      header: "Teacher",
      render: (s: Subject) => (
        <span className="text-text-secondary">{s.teacherName ?? "—"}</span>
      ),
    },
    {
      key: "classes",
      header: "Classes",
      render: (s: Subject) => (
        <span className="text-text-secondary">
          {s.classIds.length} {s.classIds.length === 1 ? "class" : "classes"}
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="h-8 w-48 bg-surface-tertiary rounded animate-pulse" />
        <div className="grid sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-24 bg-surface-tertiary rounded-lg animate-pulse"
            />
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
        {readOnly && (
          <ReadOnlyBanner message="Only admins and teachers can enter results." />
        )}
        <PageHeader
          title="Academics & Results"
          subtitle="Third Term, 2024/2025"
          action={
            !readOnly ? (
              <Button onClick={() => setModalOpen(true)}>
                <Plus size={15} />
                Enter result
              </Button>
            ) : undefined
          }
        />

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { label: "Total results entered", value: results.length },
            { label: "Average score", value: `${avgScore}%` },
            { label: "Pass / Fail", value: `${passCount} / ${failCount}` },
          ].map((stat) => (
            <Card key={stat.label} padding="sm">
              <p className="text-xs text-text-muted mb-1">{stat.label}</p>
              <p className="text-2xl font-semibold text-text-primary">
                {stat.value}
              </p>
            </Card>
          ))}
        </div>

        {/* Grade scale reference */}
        <Card>
          <CardHeader
            title="Grade scale"
            subtitle="WAEC-compatible — applies to all results"
          />
          <div className="flex flex-wrap gap-2">
            {[
              { grade: "A1", range: "75–100", variant: "success" },
              { grade: "B2", range: "70–74", variant: "success" },
              { grade: "B3", range: "65–69", variant: "success" },
              { grade: "C4", range: "60–64", variant: "warning" },
              { grade: "C5", range: "55–59", variant: "warning" },
              { grade: "C6", range: "50–54", variant: "warning" },
              { grade: "D7", range: "45–49", variant: "default" },
              { grade: "E8", range: "40–44", variant: "default" },
              { grade: "F9", range: "0–39", variant: "error" },
            ].map((g) => (
              <div
                key={g.grade}
                className="flex items-center gap-2 px-3 py-1.5 border border-border rounded"
              >
                <Badge
                  label={g.grade}
                  variant={
                    g.variant as "success" | "warning" | "error" | "default"
                  }
                />
                <span className="text-xs text-text-muted">{g.range}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border">
          {(["results", "subjects"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors cursor-pointer ${
                activeTab === tab
                  ? "border-navy-600 text-navy-600"
                  : "border-transparent text-text-muted hover:text-text-primary"
              }`}
            >
              {tab === "results" ? "Result Entries" : "Subjects"}
            </button>
          ))}
        </div>

        {/* Results tab */}
        {activeTab === "results" && (
          <Card padding="none">
            <div className="p-4 border-b border-border flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-48">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                />
                <input
                  type="search"
                  placeholder="Search by student or subject..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-9 pl-8 pr-3 text-sm border border-border rounded bg-surface focus:outline-2 focus:outline-navy-600 placeholder:text-text-muted"
                />
              </div>
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="h-9 px-3 text-sm border border-border rounded bg-surface text-text-primary focus:outline-2 focus:outline-navy-600"
              >
                {classFilterOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            {filtered.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No results found"
                description={
                  search || classFilter
                    ? "Try adjusting your search or filter."
                    : "Enter the first result to get started."
                }
                action={
                  !search && !classFilter ? (
                    <Button size="sm" onClick={() => setModalOpen(true)}>
                      <Plus size={14} />
                      Enter result
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <Table
                columns={resultColumns}
                data={filtered}
                keyExtractor={(r) => r.id}
              />
            )}
          </Card>
        )}

        {/* Subjects tab */}
        {activeTab === "subjects" && (
          <Card padding="none">
            {subjects.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No subjects configured"
                description="Add subjects to start entering results."
              />
            ) : (
              <Table
                columns={subjectColumns}
                data={subjects}
                keyExtractor={(s) => s.id}
              />
            )}
          </Card>
        )}
      </div>

      {/* Enter Result Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          reset();
        }}
        title="Enter result"
        subtitle="CA max: 40 points — Exam max: 60 points"
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setModalOpen(false);
                reset();
              }}
            >
              Cancel
            </Button>
            <Button loading={saving} onClick={handleSubmit(onSubmit as any)}>
              Save result
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Select
            label="Class"
            required
            options={classOptions}
            placeholder="Select class"
            error={errors.classId?.message}
            {...register("classId")}
          />
          <Select
            label="Student"
            required
            options={studentOptions}
            placeholder="Select student"
            error={errors.studentId?.message}
            {...register("studentId")}
          />
          <Select
            label="Subject"
            required
            options={subjectOptions}
            placeholder="Select subject"
            disabled={!selectedClassId}
            error={errors.subjectId?.message}
            {...register("subjectId")}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="CA score (out of 40)"
              type="number"
              required
              placeholder="0"
              error={errors.ca?.message}
              {...register("ca")}
            />
            <Input
              label="Exam score (out of 60)"
              type="number"
              required
              placeholder="0"
              error={errors.exam?.message}
              {...register("exam")}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Term"
              required
              options={TERM_OPTIONS}
              error={errors.term?.message}
              {...register("term")}
            />
            <Input
              label="Session"
              required
              placeholder="2024/2025"
              error={errors.session?.message}
              {...register("session")}
            />
          </div>
        </div>
      </Modal>
    </>
  );
}
