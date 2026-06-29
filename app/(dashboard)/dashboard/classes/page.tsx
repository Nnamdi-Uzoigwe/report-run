"use client";

import { useState } from "react";
import { Plus, School, Users, ChevronDown, ChevronRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  PageHeader, Card, Badge, Button,
  Modal, Input, EmptyState,
} from "@/components/ui";
import {
  useClasses, useCreateClass,
  useSubjects, useCreateSubject,
} from "@/lib/queries/classes";
import { useSchoolUsers } from "@/lib/queries/staff";
import { usePermission } from "@/lib/hooks/usePermission";
import { ReadOnlyBanner } from "@/components/dashboard/ReadOnlyBanner";
import { useAuthStore } from "@/lib/store";
import type { ClassSection, Subject } from "@/types";

// ── Schemas ───────────────────────────────────────────────────

const classSchema = z.object({
  name:        z.string().min(1, "Class name is required"),
  description: z.string().optional(),
});

const subjectSchema = z.object({
  name:         z.string().min(1, "Subject name is required"),
  maxCaScore:   z.coerce.number().min(1).max(100).default(30),
  maxExamScore: z.coerce.number().min(1).max(100).default(70),
  classId:      z.string().min(1, "Select a class"),
});

type ClassForm = z.infer<typeof classSchema>;

type SubjectForm = {
  name:         string;
  maxCaScore:   number;
  maxExamScore: number;
  classId:      string;
};

// ── Sub-components ────────────────────────────────────────────

function ClassCard({
  cls,
  readOnly,
  onAddSubject,
}: {
  cls: ClassSection;
  readOnly: boolean;
  onAddSubject: (classId: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const { data: subjects = [] } = useSubjects(cls.id);

  return (
    <Card padding="none">
      <div
        className="flex items-center justify-between gap-4 p-4 cursor-pointer hover:bg-surface-secondary transition-colors duration-150"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <button className="text-text-muted hover:text-text-primary transition-colors">
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          <div className="w-9 h-9 rounded-lg bg-navy-50 border border-navy-100 flex items-center justify-center shrink-0">
            <School size={16} className="text-navy-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">{cls.name}</p>
            <p className="text-xs text-text-muted">
              {subjects.length} {subjects.length === 1 ? "subject" : "subjects"}
              {cls.description ? ` — ${cls.description}` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Button
            size="sm"
            variant="secondary"
            disabled={readOnly}
            onClick={(e) => {
              e.stopPropagation();
              if (!readOnly) onAddSubject(cls.id);
            }}
          >
            <Plus size={13} />
            Add subject
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border">
          {subjects.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className="text-sm text-text-muted mb-3">No subjects yet</p>
              {!readOnly && (
                <Button size="sm" variant="secondary" onClick={() => onAddSubject(cls.id)}>
                  <Plus size={13} />
                  Add first subject
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {subjects.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-4 px-6 py-3 hover:bg-surface-secondary transition-colors"
                >
                  <p className="text-sm font-medium text-text-primary">{s.name}</p>
                  <div className="flex items-center gap-4 text-xs text-text-muted">
                    <span>CA: {s.maxCaScore}</span>
                    <span>Exam: {s.maxExamScore}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────

export default function ClassesPage() {
  const schoolId = useAuthStore((s) => s.schoolId);
  const [classModal,   setClassModal  ] = useState(false);
  const [subjectModal, setSubjectModal] = useState(false);
  const [targetClassId,setTargetClassId] = useState("");

  const { can } = usePermission();
  const readOnly = !can.manageClasses;

  const { data: classes = [], isLoading, error } = useClasses();
  const createClass   = useCreateClass();
  const createSubject = useCreateSubject();

  const classForm = useForm<ClassForm>({
    resolver: zodResolver(classSchema),
  });

  const subjectForm = useForm<SubjectForm>({
    resolver: zodResolver(subjectSchema) as any,
    defaultValues: { maxCaScore: 30, maxExamScore: 70 },
  });

  function openAddSubject(classId: string) {
    setTargetClassId(classId);
    subjectForm.setValue("classId", classId);
    setSubjectModal(true);
  }

  async function onClassSubmit(data: ClassForm) {
    await createClass.mutateAsync(data);
    classForm.reset();
    setClassModal(false);
  }

  async function onSubjectSubmit(data: SubjectForm) {
    await createSubject.mutateAsync({
      name:         data.name,
      classId:      data.classId,
      schoolId:     schoolId!,
      maxCaScore:   data.maxCaScore,
      maxExamScore: data.maxExamScore,
    });
    subjectForm.reset({ maxCaScore: 30, maxExamScore: 70 });
    setSubjectModal(false);
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="h-8 w-48 bg-surface-tertiary rounded animate-pulse" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-40 bg-surface-tertiary rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-error text-sm">
        Failed to load classes.
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        {readOnly && (
          <ReadOnlyBanner message="Only admins can manage classes and subjects." />
        )}

        <PageHeader
          title="Classes & Subjects"
          subtitle={`${classes.length} classes`}
          action={
            !readOnly ? (
              <Button onClick={() => setClassModal(true)}>
                <Plus size={15} />
                Add class
              </Button>
            ) : undefined
          }
        />

        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Total classes",  value: classes.length },
            { label: "Total subjects", value: classes.reduce((n, _c) => n, 0) },
          ].map((stat) => (
            <Card key={stat.label} padding="sm">
              <p className="text-xs text-text-muted mb-1">{stat.label}</p>
              <p className="text-2xl font-semibold text-text-primary">{stat.value}</p>
            </Card>
          ))}
        </div>

        {classes.length === 0 ? (
          <Card>
            <EmptyState
              icon={School}
              title="No classes yet"
              description="Add your first class to get started."
              action={
                !readOnly ? (
                  <Button size="sm" onClick={() => setClassModal(true)}>
                    <Plus size={14} />
                    Add class
                  </Button>
                ) : undefined
              }
            />
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {classes.map((cls) => (
              <ClassCard
                key={cls.id}
                cls={cls}
                readOnly={readOnly}
                onAddSubject={openAddSubject}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Class Modal */}
      <Modal
        isOpen={classModal}
        onClose={() => { setClassModal(false); classForm.reset(); }}
        title="Add class"
        subtitle="Create a new class section"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setClassModal(false); classForm.reset(); }}>
              Cancel
            </Button>
            <Button
              loading={createClass.isPending}
              onClick={classForm.handleSubmit(onClassSubmit)}
            >
              Save class
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {createClass.error && (
            <p className="text-sm text-error">{(createClass.error as Error).message}</p>
          )}
          <Input
            label="Class name"
            placeholder="e.g. JSS 1, SSS 2A"
            required
            error={classForm.formState.errors.name?.message}
            {...classForm.register("name")}
          />
          <Input
            label="Description"
            placeholder="Optional"
            {...classForm.register("description")}
          />
        </div>
      </Modal>

      {/* Add Subject Modal */}
      <Modal
        isOpen={subjectModal}
        onClose={() => { setSubjectModal(false); subjectForm.reset({ maxCaScore: 30, maxExamScore: 70 }); }}
        title="Add subject"
        subtitle="Define score caps — the server enforces these on entry"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setSubjectModal(false); subjectForm.reset({ maxCaScore: 30, maxExamScore: 70 }); }}>
              Cancel
            </Button>
            <Button
              loading={createSubject.isPending}
              onClick={subjectForm.handleSubmit(onSubjectSubmit)}
            >
              Save subject
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {createSubject.error && (
            <p className="text-sm text-error">{(createSubject.error as Error).message}</p>
          )}
          <Input
            label="Subject name"
            placeholder="e.g. Mathematics, Physics"
            required
            error={subjectForm.formState.errors.name?.message}
            {...subjectForm.register("name")}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Max CA score"
              type="number"
              required
              hint="e.g. 30"
              error={subjectForm.formState.errors.maxCaScore?.message}
              {...subjectForm.register("maxCaScore")}
            />
            <Input
              label="Max exam score"
              type="number"
              required
              hint="e.g. 70"
              error={subjectForm.formState.errors.maxExamScore?.message}
              {...subjectForm.register("maxExamScore")}
            />
          </div>
        </div>
      </Modal>
    </>
  );
}