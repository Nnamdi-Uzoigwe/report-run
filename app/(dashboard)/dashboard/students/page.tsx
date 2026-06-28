"use client";

import { useEffect, useState } from "react";
import { Plus, Search, AlertCircle, GraduationCap } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  PageHeader, Card, CardHeader, Badge, Button,
  Modal, Input, Select, EmptyState, Table,
} from "@/components/ui";
import { fetchStudents, fetchClasses, createStudent } from "@/lib/api";
import { getStatusColor, formatDate } from "@/lib/utils";
import type { Student, Class, SelectOption } from "@/types";
import { usePermission }  from "@/lib/hooks/usePermission";
import { ReadOnlyBanner } from "@/components/dashboard/ReadOnlyBanner";

// ── Schema ────────────────────────────────────────────────────

const schema = z.object({
  firstName:    z.string().min(1, "First name is required"),
  lastName:     z.string().min(1, "Last name is required"),
  admissionNumber: z.string().min(1, "Admission number is required"),
  classId:      z.string().min(1, "Select a class"),
  sectionId:    z.string().optional(),
  gender: z.enum(["male", "female"]).refine((v) => v !== undefined, { message: "Select gender" }),
  dateOfBirth:  z.string().min(1, "Date of birth is required"),
  parentName:   z.string().min(1, "Parent name is required"),
  parentPhone:  z.string().min(7, "Parent phone is required"),
  parentEmail:  z.string().email("Enter a valid email"),
  address:      z.string().min(5, "Address is required"),
});

type FormData = z.infer<typeof schema>;

// ── Page ──────────────────────────────────────────────────────

export default function StudentsPage() {
  const [students,   setStudents  ] = useState<Student[]>([]);
  const [classes,    setClasses   ] = useState<Class[]>([]);
  const [loading,    setLoading   ] = useState(true);
  const [error,      setError     ] = useState<string | null>(null);
  const [modalOpen,  setModalOpen ] = useState(false);
  const [saving,     setSaving    ] = useState(false);
  const [search,     setSearch    ] = useState("");
  const [classFilter,setClassFilter] = useState("");
  const [selected,   setSelected  ] = useState<Student | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const { can } = usePermission();
  const readOnly = !can.manageStudents;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const selectedClassId = watch("classId");

  useEffect(() => {
    Promise.all([fetchStudents(), fetchClasses()])
      .then(([s, c]) => { setStudents(s); setClasses(c); })
      .catch(() => setError("Failed to load students."))
      .finally(() => setLoading(false));
  }, []);

  async function onSubmit(data: FormData) {
    setSaving(true);
    try {
      const cls = classes.find((c) => c.id === data.classId);
      const sec = cls?.sections.find((s) => s.id === data.sectionId);
      const created = await createStudent({
        ...data,
        className:   cls?.name   ?? "",
        sectionName: sec?.name   ?? undefined,
        status:      "active",
        admissionDate: new Date().toISOString().split("T")[0],
      });
      setStudents((prev) => [...prev, created]);
      reset();
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  }

  // Filtered students
  const filtered = students.filter((s) => {
    const matchesSearch =
      search === "" ||
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      s.admissionNumber.toLowerCase().includes(search.toLowerCase());
    const matchesClass =
      classFilter === "" || s.classId === classFilter;
    return matchesSearch && matchesClass;
  });

  // Options
  const classOptions: SelectOption[] = classes.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  const sectionOptions: SelectOption[] =
    classes
      .find((c) => c.id === selectedClassId)
      ?.sections.map((s) => ({ value: s.id, label: s.name })) ?? [];

  const genderOptions: SelectOption[] = [
    { value: "male",   label: "Male"   },
    { value: "female", label: "Female" },
  ];

  const classFilterOptions: SelectOption[] = [
    { value: "", label: "All classes" },
    ...classOptions,
  ];

  // Table columns
  const columns = [
    {
      key: "name",
      header: "Student",
      render: (s: Student) => (
        <div>
          <p className="font-medium text-text-primary">
            {s.firstName} {s.lastName}
          </p>
          <p className="text-xs text-text-muted">{s.admissionNumber}</p>
        </div>
      ),
    },
    {
      key: "class",
      header: "Class",
      render: (s: Student) => (
        <span className="text-text-secondary">
          {s.className}{s.sectionName ? ` — ${s.sectionName}` : ""}
        </span>
      ),
    },
    {
      key: "gender",
      header: "Gender",
      render: (s: Student) => (
        <span className="text-text-secondary capitalize">{s.gender}</span>
      ),
    },
    {
      key: "parent",
      header: "Parent / Guardian",
      render: (s: Student) => (
        <div>
          <p className="text-text-primary">{s.parentName}</p>
          <p className="text-xs text-text-muted">{s.parentPhone}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (s: Student) => (
        <Badge
          label={s.status}
          className={getStatusColor(s.status)}
        />
      ),
    },
    {
      key: "actions",
      header: "",
      render: (s: Student) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => { setSelected(s); setDetailOpen(true); }}
        >
          View
        </Button>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="h-8 w-48 bg-surface-tertiary rounded animate-pulse" />
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
            <ReadOnlyBanner message="Only admins can add or edit students." />
        )}
        <PageHeader
          title="Students"
          subtitle={`${students.length} students enrolled`}
          action={
            !readOnly ? (
              <Button onClick={() => setModalOpen(true)}>
                <Plus size={15} />
                Add student
              </Button>
            ) : undefined
          }
        />

        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total enrolled", value: students.length },
            { label: "Active",         value: students.filter((s) => s.status === "active").length },
            { label: "Male",           value: students.filter((s) => s.gender === "male").length   },
            { label: "Female",         value: students.filter((s) => s.gender === "female").length },
          ].map((stat) => (
            <Card key={stat.label} padding="sm">
              <p className="text-xs text-text-muted mb-1">{stat.label}</p>
              <p className="text-2xl font-semibold text-text-primary">{stat.value}</p>
            </Card>
          ))}
        </div>

        {/* Table */}
        <Card padding="none">
          {/* Filters */}
          <div className="p-4 border-b border-border flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-48">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              />
              <input
                type="search"
                placeholder="Search by name or admission number..."
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
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title="No students found"
              description={
                search || classFilter
                  ? "Try adjusting your search or filter."
                  : "Add your first student to get started."
              }
              action={
                !search && !classFilter ? (
                  <Button size="sm" onClick={() => setModalOpen(true)}>
                    <Plus size={14} />
                    Add student
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <Table
              columns={columns}
              data={filtered}
              keyExtractor={(s) => s.id}
            />
          )}
        </Card>
      </div>

      {/* Add Student Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); reset(); }}
        title="Add student"
        subtitle="Enter the student's details below"
        size="lg"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => { setModalOpen(false); reset(); }}
            >
              Cancel
            </Button>
            <Button loading={saving} onClick={handleSubmit(onSubmit)}>
              Save student
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="First name"
              required
              error={errors.firstName?.message}
              {...register("firstName")}
            />
            <Input
              label="Last name"
              required
              error={errors.lastName?.message}
              {...register("lastName")}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="Admission number"
              placeholder="GFA/2024/001"
              required
              error={errors.admissionNumber?.message}
              {...register("admissionNumber")}
            />
            <Select
              label="Gender"
              required
              options={genderOptions}
              placeholder="Select gender"
              error={errors.gender?.message}
              {...register("gender")}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Select
              label="Class"
              required
              options={classOptions}
              placeholder="Select class"
              error={errors.classId?.message}
              {...register("classId")}
            />
            <Select
              label="Section"
              options={sectionOptions}
              placeholder="Select section"
              disabled={!selectedClassId || sectionOptions.length === 0}
              {...register("sectionId")}
            />
          </div>
          <Input
            label="Date of birth"
            type="date"
            required
            error={errors.dateOfBirth?.message}
            {...register("dateOfBirth")}
          />
          <div className="border-t border-border pt-4">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">
              Parent / Guardian
            </p>
            <div className="flex flex-col gap-4">
              <Input
                label="Full name"
                required
                error={errors.parentName?.message}
                {...register("parentName")}
              />
              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label="Phone number"
                  type="tel"
                  required
                  error={errors.parentPhone?.message}
                  {...register("parentPhone")}
                />
                <Input
                  label="Email address"
                  type="email"
                  required
                  error={errors.parentEmail?.message}
                  {...register("parentEmail")}
                />
              </div>
              <Input
                label="Home address"
                required
                error={errors.address?.message}
                {...register("address")}
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      {selected && (
        <Modal
          isOpen={detailOpen}
          onClose={() => setDetailOpen(false)}
          title={`${selected.firstName} ${selected.lastName}`}
          subtitle={selected.admissionNumber}
          size="md"
        >
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Class",        value: `${selected.className}${selected.sectionName ? ` — ${selected.sectionName}` : ""}` },
                { label: "Gender",       value: selected.gender,       capitalize: true },
                { label: "Date of birth",value: formatDate(selected.dateOfBirth) },
                { label: "Status",       value: selected.status,       capitalize: true },
                { label: "Admitted",     value: formatDate(selected.admissionDate) },
              ].map((row) => (
                <div key={row.label}>
                  <p className="text-xs text-text-muted mb-0.5">{row.label}</p>
                  <p className={`text-sm font-medium text-text-primary ${row.capitalize ? "capitalize" : ""}`}>
                    {row.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-4">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">
                Parent / Guardian
              </p>
              <div className="flex flex-col gap-2">
                {[
                  { label: "Name",    value: selected.parentName  },
                  { label: "Phone",   value: selected.parentPhone },
                  { label: "Email",   value: selected.parentEmail },
                  { label: "Address", value: selected.address     },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between gap-4">
                    <span className="text-xs text-text-muted shrink-0">{row.label}</span>
                    <span className="text-xs text-text-primary text-right">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}