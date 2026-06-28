"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, AlertCircle, Users } from "lucide-react";
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
import {
  fetchDutyAssignments,
  fetchStaff,
  createDutyAssignment,
  deleteDutyAssignment,
} from "@/lib/api";
import type {
  DutyAssignment,
  StaffMember,
  DayOfWeek,
  DutyType,
  SelectOption,
} from "@/types";
import { usePermission } from "@/lib/hooks/usePermission";
import { ReadOnlyBanner } from "@/components/dashboard/ReadOnlyBanner";
import { classNames } from "@/lib/utils";

// ── Schema ────────────────────────────────────────────────────

const schema = z.object({
  staffId: z.string().min(1, "Select a staff member"),
  dutyType: z.string().min(1, "Select a duty type"),
  location: z.string().min(1, "Location is required"),
  dayOfWeek: z.string().min(1, "Select a day"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
});

type FormData = z.infer<typeof schema>;

// ── Constants ─────────────────────────────────────────────────

const DAYS: { value: DayOfWeek; label: string }[] = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
];

const DUTY_TYPES: { value: DutyType; label: string }[] = [
  { value: "morning_assembly", label: "Morning Assembly" },
  { value: "gate_duty", label: "Gate Duty" },
  { value: "cafeteria", label: "Cafeteria" },
  { value: "exam_supervision", label: "Exam Supervision" },
  { value: "extracurricular", label: "Extracurricular" },
  { value: "sanitation", label: "Sanitation" },
  { value: "library", label: "Library" },
];

const DUTY_COLORS: Record<DutyType, string> = {
  morning_assembly: "navy",
  gate_duty: "info",
  cafeteria: "warning",
  exam_supervision: "error",
  extracurricular: "success",
  sanitation: "default",
  library: "default",
};

function getDutyLabel(type: DutyType): string {
  return DUTY_TYPES.find((d) => d.value === type)?.label ?? type;
}

// ── Sub-components ────────────────────────────────────────────

function DayColumn({
  day,
  assignments,
  onDelete,
}: {
  day: { value: DayOfWeek; label: string };
  assignments: DutyAssignment[];
  onDelete: (id: string) => void;
}) {
  const dayAssignments = assignments.filter((a) => a.dayOfWeek === day.value);

  return (
    <div className="flex flex-col gap-2">
      <div className="px-3 py-2 bg-surface-secondary border border-border rounded text-xs font-semibold text-text-muted uppercase tracking-wide text-center">
        {day.label}
      </div>
      <div className="flex flex-col gap-2 min-h-32">
        {dayAssignments.length === 0 ? (
          <div className="flex-1 border border-dashed border-border rounded flex items-center justify-center min-h-24">
            <p className="text-xs text-text-muted">No duties</p>
          </div>
        ) : (
          dayAssignments.map((a) => (
            <div
              key={a.id}
              className="p-3 bg-surface border border-border rounded group relative hover:border-border-strong transition-colors duration-150"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <Badge
                  label={getDutyLabel(a.dutyType)}
                  variant={
                    DUTY_COLORS[a.dutyType] as
                      | "navy"
                      | "info"
                      | "warning"
                      | "error"
                      | "success"
                      | "default"
                  }
                />
                <button
                  onClick={() => onDelete(a.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-text-muted hover:text-error cursor-pointer"
                  aria-label="Delete duty"
                >
                  <Trash2 size={13} />
                </button>
              </div>
              <p className="text-xs font-medium text-text-primary truncate">
                {a.staffName}
              </p>
              <p className="text-xs text-text-muted">{a.location}</p>
              <p className="text-xs text-text-muted">
                {a.startTime} – {a.endTime}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────

export default function DutiesPage() {
  const [assignments, setAssignments] = useState<DutyAssignment[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const { can } = usePermission();
  const readOnly = !can.manageStaff;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    Promise.all([fetchDutyAssignments(), fetchStaff()])
      .then(([duties, members]) => {
        setAssignments(duties);
        setStaff(members);
      })
      .catch(() => setError("Failed to load duty assignments."))
      .finally(() => setLoading(false));
  }, []);

  async function onSubmit(data: FormData) {
    setSaving(true);
    try {
      const created = await createDutyAssignment({
        ...data,
        dutyType: data.dutyType as DutyType,
        dayOfWeek: data.dayOfWeek as DayOfWeek,
        staffName: staff.find((s) => s.id === data.staffId)
          ? `${staff.find((s) => s.id === data.staffId)!.firstName} ${staff.find((s) => s.id === data.staffId)!.lastName}`
          : "",
        term: "Third Term",
        session: "2024/2025",
      });
      setAssignments((prev) => [...prev, created]);
      reset();
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(id: string) {
    setAssignments((prev) => prev.filter((a) => a.id !== id));
    deleteDutyAssignment(id);
  }

  const staffOptions: SelectOption[] = staff.map((s) => ({
    value: s.id,
    label: `${s.firstName} ${s.lastName}`,
  }));

  const dutyTypeOptions: SelectOption[] = DUTY_TYPES.map((d) => ({
    value: d.value,
    label: d.label,
  }));

  const dayOptions: SelectOption[] = DAYS.map((d) => ({
    value: d.value,
    label: d.label,
  }));

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="h-8 w-48 bg-surface-tertiary rounded animate-pulse" />
        <div className="grid grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-64 bg-surface-tertiary rounded-lg animate-pulse"
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
          <ReadOnlyBanner message="Only admins can assign or remove duties." />
        )}
        <PageHeader
          title="Staff Duty Allocation"
          subtitle="Third Term, 2024/2025"
          action={
            !readOnly ? (
              <Button onClick={() => setModalOpen(true)}>
                <Plus size={15} />
                Assign duty
              </Button>
            ) : undefined
          }
        />

        {/* Summary row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {DUTY_TYPES.slice(0, 4).map((duty) => {
            const count = assignments.filter(
              (a) => a.dutyType === duty.value,
            ).length;
            return (
              <Card key={duty.value} padding="sm">
                <p className="text-xs text-text-muted mb-1">{duty.label}</p>
                <p className="text-2xl font-semibold text-text-primary">
                  {count}
                </p>
                <p className="text-xs text-text-muted">
                  {count === 1 ? "assignment" : "assignments"}
                </p>
              </Card>
            );
          })}
        </div>

        {/* Weekly grid */}
        <Card padding="none">
          <div className="p-4 border-b border-border">
            <CardHeader
              title="Weekly duty roster"
              subtitle="Current term assignments by day"
            />
          </div>
          {assignments.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No duties assigned"
              description="Start by assigning staff to duties for the week."
              action={
                <Button size="sm" onClick={() => setModalOpen(true)}>
                  <Plus size={14} />
                  Assign first duty
                </Button>
              }
            />
          ) : (
            <div className="p-4 overflow-x-auto">
              <div className="grid grid-cols-5 gap-3 min-w-160">
                {DAYS.map((day) => (
                  <DayColumn
                    key={day.value}
                    day={day}
                    assignments={assignments}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Staff duty list */}
        <Card>
          <CardHeader
            title="All assignments"
            subtitle={`${assignments.length} total this term`}
          />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Staff", "Duty", "Day", "Time", "Location", ""].map((h) => (
                    <th
                      key={h}
                      className="text-left text-xs font-semibold text-text-muted uppercase tracking-wide px-4 py-3 first:pl-0"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {assignments.map((a) => (
                  <tr
                    key={a.id}
                    className="border-b border-border last:border-0 hover:bg-surface-secondary transition-colors"
                  >
                    <td className="px-4 py-3 first:pl-0 font-medium text-text-primary">
                      {a.staffName}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        label={getDutyLabel(a.dutyType)}
                        variant={
                          DUTY_COLORS[a.dutyType] as
                            | "navy"
                            | "info"
                            | "warning"
                            | "error"
                            | "success"
                            | "default"
                        }
                      />
                    </td>
                    <td className="px-4 py-3 text-text-secondary capitalize">
                      {a.dayOfWeek}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {a.startTime} – {a.endTime}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {a.location}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(a.id)}
                        disabled={readOnly}
                        className={classNames(
                          "p-1.5 rounded transition-colors cursor-pointer",
                          readOnly
                            ? "text-border cursor-not-allowed"
                            : "text-text-muted hover:text-error hover:bg-error-light",
                        )}
                        aria-label="Delete assignment"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          reset();
        }}
        title="Assign duty"
        subtitle="Add a new duty assignment for this term"
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
            <Button loading={saving} onClick={handleSubmit(onSubmit)}>
              Save assignment
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Select
            label="Staff member"
            required
            options={staffOptions}
            placeholder="Select staff"
            error={errors.staffId?.message}
            {...register("staffId")}
          />
          <Select
            label="Duty type"
            required
            options={dutyTypeOptions}
            placeholder="Select duty type"
            error={errors.dutyType?.message}
            {...register("dutyType")}
          />
          <Input
            label="Location"
            placeholder="e.g. Main Gate, School Hall"
            required
            error={errors.location?.message}
            {...register("location")}
          />
          <Select
            label="Day of week"
            required
            options={dayOptions}
            placeholder="Select day"
            error={errors.dayOfWeek?.message}
            {...register("dayOfWeek")}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start time"
              type="time"
              required
              error={errors.startTime?.message}
              {...register("startTime")}
            />
            <Input
              label="End time"
              type="time"
              required
              error={errors.endTime?.message}
              {...register("endTime")}
            />
          </div>
        </div>
      </Modal>
    </>
  );
}
