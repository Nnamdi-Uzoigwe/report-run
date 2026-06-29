"use client";

import { useState } from "react";
import { Plus, Search, BookOpen } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  PageHeader, Card, CardHeader, Badge,
  Button, Modal, Input, Select, EmptyState, Table,
} from "@/components/ui";
import {
  useScoresBySubject, useSubmitScores,
  useReports, useGenerateReports, usePublishReports,
  useUpdateReportTeacherInput,
} from "@/lib/queries/academics";
import { useClasses, useSubjects } from "@/lib/queries/classes";
import { useStudents } from "@/lib/queries/students";
import { useGradingSchemes } from "@/lib/queries/classes";
import { usePermission } from "@/lib/hooks/usePermission";
import { ReadOnlyBanner } from "@/components/dashboard/ReadOnlyBanner";
import type { SelectOption, ScoreTerm, Score, Report } from "@/types";

// ── Schema ────────────────────────────────────────────────────

const scoreSchema = z.object({
  subjectId:    z.string().min(1, "Select a subject"),
  term:         z.enum(["first", "second", "third"]),
  academicYear: z.string().min(1, "Enter academic year"),
  entries: z.array(z.object({
    studentId: z.string(),
    caScore:   z.coerce.number().min(0),
    examScore: z.coerce.number().min(0),
  })),
});

type ScoreForm = {
  subjectId:    string;
  term:         "first" | "second" | "third";
  academicYear: string;
  entries: {
    studentId: string;
    caScore:   number;
    examScore: number;
  }[];
};

// ── Constants ─────────────────────────────────────────────────

const TERM_OPTIONS: SelectOption[] = [
  { value: "first",  label: "First Term"  },
  { value: "second", label: "Second Term" },
  { value: "third",  label: "Third Term"  },
];

function gradeVariant(grade: string): "success" | "warning" | "error" | "default" {
  if (["A", "A1", "B", "B2", "B3"].includes(grade)) return "success";
  if (["C", "C4", "C5", "C6"].includes(grade))       return "warning";
  if (["F", "F9"].includes(grade))                    return "error";
  return "default";
}

// ── Page ──────────────────────────────────────────────────────

export default function AcademicsPage() {
  const [activeTab,    setActiveTab   ] = useState<"scores" | "reports">("scores");
  const [scoreModal,   setScoreModal  ] = useState(false);
  const [selectedClassId,  setSelectedClassId ] = useState("");
  const [selectedSubjectId,setSelectedSubjectId] = useState("");
  const [term,         setTerm        ] = useState<ScoreTerm>("first");
  const [academicYear, setAcademicYear] = useState("2024/2025");

  const { can } = usePermission();
  const readOnly = !can.enterScores;

  const { data: classes  = [] } = useClasses();
  const { data: subjects = [] } = useSubjects(selectedClassId);
  const { data: students = [] } = useStudents(selectedClassId || undefined);
  const { data: schemes  = [] } = useGradingSchemes();

  const { data: scores  = [], isLoading: scoresLoading  } = useScoresBySubject(
    selectedSubjectId, term, academicYear
  );
  const { data: reports = [], isLoading: reportsLoading } = useReports(
    selectedClassId, term, academicYear
  );

  const submitScores   = useSubmitScores();
  const generateReports = useGenerateReports();
  const publishReports  = usePublishReports();
  const updateTeacher   = useUpdateReportTeacherInput();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ScoreForm>({
    resolver: zodResolver(scoreSchema) as any,
    defaultValues: { term: "first", academicYear: "2024/2025", entries: [] },
  });

  async function onScoreSubmit(data: ScoreForm) {
    // Build entries from students in the class
    const entries = students.map((s) => ({
      studentId: s.id,
      caScore:   0,
      examScore: 0,
    }));
    await submitScores.mutateAsync({ ...data, entries });
    reset();
    setScoreModal(false);
  }

  const classOptions: SelectOption[] = [
    { value: "", label: "Select class" },
    ...classes.map((c) => ({ value: c.id, label: c.name })),
  ];
  const subjectOptions: SelectOption[] = [
    { value: "", label: "Select subject" },
    ...subjects.map((s) => ({ value: s.id, label: s.name })),
  ];

  const scoreColumns = [
    {
      key: "student",
      header: "Student",
      render: (s: Score) => (
        <p className="font-medium text-text-primary">
          {s.student.firstName} {s.student.lastName}
        </p>
      ),
    },
    {
      key: "ca",
      header: "CA",
      render: (s: Score) => (
        <span className="text-text-primary">{s.caScore}</span>
      ),
    },
    {
      key: "exam",
      header: "Exam",
      render: (s: Score) => (
        <span className="text-text-primary">{s.examScore}</span>
      ),
    },
    {
      key: "total",
      header: "Total",
      render: (s: Score) => (
        <span className="font-semibold text-text-primary">{s.totalScore}</span>
      ),
    },
    {
      key: "grade",
      header: "Grade",
      render: (s: Score) => (
        <Badge label={s.grade} variant={gradeVariant(s.grade)} />
      ),
    },
  ];

  const reportColumns = [
    {
      key: "student",
      header: "Student",
      render: (r: Report) => (
        <p className="font-medium text-text-primary">
          {r.student.firstName} {r.student.lastName}
        </p>
      ),
    },
    {
      key: "position",
      header: "Position",
      render: (r: Report) => (
        <span className="font-semibold text-text-primary">{r.position ?? "—"}</span>
      ),
    },
    {
      key: "average",
      header: "Average",
      render: (r: Report) => (
        <span className="text-text-primary">{Number(r.average).toFixed(1)}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r: Report) => (
        <Badge
          label={r.status === "published" ? "Published" : "Draft"}
          variant={r.status === "published" ? "success" : "default"}
        />
      ),
    },
  ];

  return (
    <>
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
            <select
              value={selectedClassId}
              onChange={(e) => { setSelectedClassId(e.target.value); setSelectedSubjectId(""); }}
              className="h-9 px-3 text-sm border border-border rounded bg-surface text-text-primary focus:outline-2 focus:outline-navy-600"
            >
              {classOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              disabled={!selectedClassId}
              className="h-9 px-3 text-sm border border-border rounded bg-surface text-text-primary focus:outline-2 focus:outline-navy-600 disabled:opacity-50"
            >
              {subjectOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <select
              value={term}
              onChange={(e) => setTerm(e.target.value as ScoreTerm)}
              className="h-9 px-3 text-sm border border-border rounded bg-surface text-text-primary focus:outline-2 focus:outline-navy-600"
            >
              {TERM_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <input
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              placeholder="2024/2025"
              className="h-9 px-3 text-sm border border-border rounded bg-surface text-text-primary focus:outline-2 focus:outline-navy-600 w-28"
            />
          </div>
        </Card>

        {/* Grading scheme reference */}
        {schemes.find((s) => s.isDefault) && (
          <Card>
            <CardHeader
              title={`Grade scale — ${schemes.find((s) => s.isDefault)?.name}`}
              subtitle="Active grading scheme for your school"
            />
            <div className="flex flex-wrap gap-2">
              {schemes.find((s) => s.isDefault)?.bands.map((band) => (
                <div
                  key={band.grade}
                  className="flex items-center gap-2 px-3 py-1.5 border border-border rounded"
                >
                  <Badge label={band.grade} variant={gradeVariant(band.grade)} />
                  <span className="text-xs text-text-muted">
                    {band.minScore}–{band.maxScore}
                    {band.remark ? ` · ${band.remark}` : ""}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border">
          {(["scores", "reports"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors cursor-pointer ${
                activeTab === tab
                  ? "border-navy-600 text-navy-600"
                  : "border-transparent text-text-muted hover:text-text-primary"
              }`}
            >
              {tab === "scores" ? "Score Entry" : "Reports"}
            </button>
          ))}
        </div>

        {/* Scores tab */}
        {activeTab === "scores" && (
          <Card padding="none">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <p className="text-sm font-semibold text-text-primary">
                {selectedSubjectId
                  ? `Scores — ${subjects.find((s) => s.id === selectedSubjectId)?.name}`
                  : "Select a class and subject above"}
              </p>
              {!readOnly && selectedSubjectId && (
                <Button size="sm" onClick={() => setScoreModal(true)}>
                  <Plus size={14} />
                  Enter scores
                </Button>
              )}
            </div>

            {!selectedSubjectId ? (
              <div className="flex items-center justify-center h-48 text-text-muted text-sm">
                Select a class and subject to view scores
              </div>
            ) : scoresLoading ? (
              <div className="h-48 bg-surface-tertiary animate-pulse" />
            ) : scores.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No scores entered"
                description="Enter scores for this subject to get started."
              />
            ) : (
              <Table
                columns={scoreColumns}
                data={scores}
                keyExtractor={(s) => s.id}
              />
            )}
          </Card>
        )}

        {/* Reports tab */}
        {activeTab === "reports" && (
          <Card padding="none">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <p className="text-sm font-semibold text-text-primary">
                {selectedClassId
                  ? `Reports — ${classes.find((c) => c.id === selectedClassId)?.name}`
                  : "Select a class above"}
              </p>
              {!readOnly && selectedClassId && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={generateReports.isPending}
                    onClick={() =>
                      generateReports.mutate({ classId: selectedClassId, term, academicYear })
                    }
                  >
                    Generate
                  </Button>
                  <Button
                    size="sm"
                    loading={publishReports.isPending}
                    onClick={() => {
                      if (confirm("This will publish reports and email all parents. Continue?")) {
                        publishReports.mutate({ classId: selectedClassId, term, academicYear });
                      }
                    }}
                  >
                    Publish & email parents
                  </Button>
                </div>
              )}
            </div>

            {!selectedClassId ? (
              <div className="flex items-center justify-center h-48 text-text-muted text-sm">
                Select a class to view reports
              </div>
            ) : reportsLoading ? (
              <div className="h-48 bg-surface-tertiary animate-pulse" />
            ) : reports.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No reports generated"
                description="Click Generate after all scores are entered."
              />
            ) : (
              <Table
                columns={reportColumns}
                data={reports}
                keyExtractor={(r) => r.id}
              />
            )}
          </Card>
        )}
      </div>
    </>
  );
}