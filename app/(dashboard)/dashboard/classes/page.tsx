"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  AlertCircle,
  School,
  Users,
  ChevronDown,
  ChevronRight,
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
  Modal,
  Input,
  Select,
  EmptyState,
} from "@/components/ui";
import { fetchClasses, fetchStaff } from "@/lib/api";
import { classNames } from "@/lib/utils";
import type { Class, Section, StaffMember, SelectOption } from "@/types";
import { usePermission } from "@/lib/hooks/usePermission";
import { ReadOnlyBanner } from "@/components/dashboard/ReadOnlyBanner";

// ── Schemas ───────────────────────────────────────────────────

const classSchema = z.object({
  name: z.string().min(1, "Class name is required"),
  level: z.coerce.number().min(1).max(12),
  formTeacherId: z.string().optional(),
});

const sectionSchema = z.object({
  classId: z.string().min(1, "Select a class"),
  name: z.string().min(1, "Section name is required"),
  formTeacherId: z.string().optional(),
});

type ClassForm = z.infer<typeof classSchema>;
type SectionForm = z.infer<typeof sectionSchema>;

// ── Sub-components ────────────────────────────────────────────

function ClassCard({
  cls,
  staff,
  readOnly,
  onAddSection,
}: {
  cls: Class;
  staff: StaffMember[];
  readOnly: boolean;
  onAddSection: (classId: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  const formTeacher = staff.find((s) => s.id === cls.formTeacherId);

  return (
    <Card padding="none">
      {/* Class header */}
      <div
        className="flex items-center justify-between gap-4 p-4 cursor-pointer hover:bg-surface-secondary transition-colors duration-150"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <button
            className="text-text-muted hover:text-text-primary transition-colors"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          <div className="w-9 h-9 rounded-lg bg-navy-50 border border-navy-100 flex items-center justify-center shrink-0">
            <School size={16} className="text-navy-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">
              {cls.name}
            </p>
            <p className="text-xs text-text-muted">
              {cls.sections.length}{" "}
              {cls.sections.length === 1 ? "section" : "sections"} —{" "}
              {cls.studentCount} students
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {formTeacher && (
            <span className="hidden sm:block text-xs text-text-muted">
              {formTeacher.firstName} {formTeacher.lastName}
            </span>
          )}
          <Badge label={`Level ${cls.level}`} variant="navy" />
          <Button
            size="sm"
            variant="secondary"
            disabled={readOnly}
            onClick={(e) => {
              e.stopPropagation();
              if (!readOnly) onAddSection(cls.id);
            }}
          >
            <Plus size={13} />
            Add section
          </Button>
        </div>
      </div>

      {/* Sections */}
      {expanded && (
        <div className="border-t border-border">
          {cls.sections.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className="text-sm text-text-muted mb-3">No sections yet</p>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onAddSection(cls.id)}
              >
                <Plus size={13} />
                Add first section
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {cls.sections.map((section) => (
                <SectionRow key={section.id} section={section} staff={staff} />
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function SectionRow({
  section,
  staff,
}: {
  section: Section;
  staff: StaffMember[];
}) {
  const formTeacher = staff.find((s) => s.id === section.formTeacherId);

  return (
    <div className="flex items-center justify-between gap-4 px-6 py-3 hover:bg-surface-secondary transition-colors duration-150">
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-1.5 rounded-full bg-navy-300 ml-5" />
        <div>
          <p className="text-sm font-medium text-text-primary">
            {section.name}
          </p>
          {formTeacher && (
            <p className="text-xs text-text-muted">
              Form teacher: {formTeacher.firstName} {formTeacher.lastName}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <Users size={12} />
          {section.studentCount} students
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────

export default function ClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [classModal, setClassModal] = useState(false);
  const [sectionModal, setSectionModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [targetClassId, setTargetClassId] = useState<string>("");

  const { can } = usePermission();
  const readOnly = !can.manageClasses;

  const classForm = useForm<ClassForm>({
    resolver: zodResolver(classSchema) as any,
  });

  const sectionForm = useForm<SectionForm>({
    resolver: zodResolver(sectionSchema) as any,
    defaultValues: { classId: targetClassId },
  });

  useEffect(() => {
    Promise.all([fetchClasses(), fetchStaff()])
      .then(([c, s]) => {
        setClasses(c);
        setStaff(s);
      })
      .catch(() => setError("Failed to load classes."))
      .finally(() => setLoading(false));
  }, []);

  function openAddSection(classId: string) {
    setTargetClassId(classId);
    sectionForm.setValue("classId", classId);
    setSectionModal(true);
  }

  async function onClassSubmit(data: ClassForm) {
    setSaving(true);
    try {
      const newClass: Class = {
        id: `cls_${Date.now()}`,
        name: data.name,
        level: data.level,
        formTeacherId: data.formTeacherId || undefined,
        formTeacherName: data.formTeacherId
          ? (() => {
              const t = staff.find((s) => s.id === data.formTeacherId);
              return t ? `${t.firstName} ${t.lastName}` : undefined;
            })()
          : undefined,
        studentCount: 0,
        sections: [],
      };
      setClasses((prev) => [...prev, newClass]);
      classForm.reset();
      setClassModal(false);
    } finally {
      setSaving(false);
    }
  }

  async function onSectionSubmit(data: SectionForm) {
    setSaving(true);
    try {
      const newSection: Section = {
        id: `sec_${Date.now()}`,
        classId: data.classId,
        name: data.name,
        studentCount: 0,
        formTeacherId: data.formTeacherId || undefined,
        formTeacherName: data.formTeacherId
          ? (() => {
              const t = staff.find((s) => s.id === data.formTeacherId);
              return t ? `${t.firstName} ${t.lastName}` : undefined;
            })()
          : undefined,
      };
      setClasses((prev) =>
        prev.map((c) =>
          c.id === data.classId
            ? { ...c, sections: [...c.sections, newSection] }
            : c,
        ),
      );
      sectionForm.reset();
      setSectionModal(false);
    } finally {
      setSaving(false);
    }
  }

  // Options
  const staffOptions: SelectOption[] = [
    { value: "", label: "No form teacher" },
    ...staff.map((s) => ({
      value: s.id,
      label: `${s.firstName} ${s.lastName}`,
    })),
  ];

  const classOptions: SelectOption[] = classes.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  // Summary stats
  const totalStudents = classes.reduce((sum, c) => sum + c.studentCount, 0);
  const totalSections = classes.reduce((sum, c) => sum + c.sections.length, 0);

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="h-8 w-48 bg-surface-tertiary rounded animate-pulse" />
        <div className="flex flex-col gap-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-40 bg-surface-tertiary rounded-lg animate-pulse"
            />
          ))}
        </div>
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
          <ReadOnlyBanner message="Only admins can manage classes and sections." />
        )}
        <PageHeader
          title="Classes & Sections"
          subtitle={`${classes.length} classes — ${totalSections} sections`}
          action={
            !readOnly ? (
              <Button onClick={() => setClassModal(true)}>
                <Plus size={15} />
                Add class
              </Button>
            ) : undefined
          }
        />

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total classes", value: classes.length },
            { label: "Total sections", value: totalSections },
            { label: "Total students", value: totalStudents },
          ].map((stat) => (
            <Card key={stat.label} padding="sm">
              <p className="text-xs text-text-muted mb-1">{stat.label}</p>
              <p className="text-2xl font-semibold text-text-primary">
                {stat.value}
              </p>
            </Card>
          ))}
        </div>

        {/* Class list */}
        {classes.length === 0 ? (
          <Card>
            <EmptyState
              icon={School}
              title="No classes yet"
              description="Add your first class to get started."
              action={
                <Button size="sm" onClick={() => setClassModal(true)}>
                  <Plus size={14} />
                  Add class
                </Button>
              }
            />
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {classes.map((cls) => (
              <ClassCard
                key={cls.id}
                cls={cls}
                staff={staff}
                readOnly={readOnly}
                onAddSection={openAddSection}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Class Modal */}
      <Modal
        isOpen={classModal}
        onClose={() => {
          setClassModal(false);
          classForm.reset();
        }}
        title="Add class"
        subtitle="Create a new class level"
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setClassModal(false);
                classForm.reset();
              }}
            >
              Cancel
            </Button>
            <Button
              loading={saving}
              onClick={classForm.handleSubmit(onClassSubmit as any)}
            >
              Save class
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Class name"
            placeholder="e.g. JSS 1, SSS 2"
            required
            error={classForm.formState.errors.name?.message}
            {...classForm.register("name")}
          />
          <Input
            label="Level"
            type="number"
            placeholder="e.g. 1"
            required
            hint="Used for ordering classes (1 = lowest)"
            error={classForm.formState.errors.level?.message}
            {...classForm.register("level")}
          />
          <Select
            label="Form teacher"
            options={staffOptions}
            error={classForm.formState.errors.formTeacherId?.message}
            {...classForm.register("formTeacherId")}
          />
        </div>
      </Modal>

      {/* Add Section Modal */}
      <Modal
        isOpen={sectionModal}
        onClose={() => {
          setSectionModal(false);
          sectionForm.reset();
        }}
        title="Add section"
        subtitle="Add a section to an existing class"
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setSectionModal(false);
                sectionForm.reset();
              }}
            >
              Cancel
            </Button>
            <Button
              loading={saving}
              onClick={sectionForm.handleSubmit(onSectionSubmit as any)}
            >
              Save section
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
            error={sectionForm.formState.errors.classId?.message}
            {...sectionForm.register("classId")}
          />
          <Input
            label="Section name"
            placeholder="e.g. JSS 1A, JSS 1B"
            required
            error={sectionForm.formState.errors.name?.message}
            {...sectionForm.register("name")}
          />
          <Select
            label="Form teacher"
            options={staffOptions}
            error={sectionForm.formState.errors.formTeacherId?.message}
            {...sectionForm.register("formTeacherId")}
          />
        </div>
      </Modal>
    </>
  );
}
