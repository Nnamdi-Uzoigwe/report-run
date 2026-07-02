"use client";

import { useState } from "react";
import {
  Plus, Users, Pencil, Trash2, RefreshCw,
  ChevronRight, X, AlertCircle, CheckCircle,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  PageHeader, Card, CardHeader, Badge,
  Button, Modal, Input, Select, EmptyState,
} from "@/components/ui";
import {
  useSchoolUsers, useInviteUser, useUpdateUser, useDeactivateUser,
  useResendInvite, useAssignmentsByClass, useAssignmentsByUser,
  useAssignStaff, useRemoveAssignment,
} from "@/lib/queries/staff";
import { useClasses, useSubjects } from "@/lib/queries/classes";
import { usePermission } from "@/lib/hooks/usePermission";
import { ReadOnlyBanner } from "@/components/dashboard/ReadOnlyBanner";
import { classNames } from "@/lib/utils";
import type { StaffMember, StaffAssignment } from "@/types";

// ── Schemas ───────────────────────────────────────────────────

const inviteSchema = z.object({
  firstName:   z.string().min(1, "First name is required"),
  lastName:    z.string().min(1, "Last name is required"),
  email:       z.string().email("Enter a valid email"),
  role:        z.enum(["teacher", "bursar", "admin"]),
  phoneNumber: z.string().optional(),
});

const editSchema = z.object({
  firstName:   z.string().min(1, "First name is required"),
  lastName:    z.string().min(1, "Last name is required"),
  email:       z.string().email("Enter a valid email"),
  role:        z.enum(["teacher", "bursar", "admin"]),
  phoneNumber: z.string().optional(),
});

const assignSchema = z.object({
  userId:         z.string().min(1, "Select a staff member"),
  classId:        z.string().min(1, "Select a class"),
  isClassTeacher: z.boolean().optional().default(false),
});

type InviteForm = z.infer<typeof inviteSchema>;
type EditForm   = z.infer<typeof editSchema>;
type AssignForm = {
  userId:         string;
  classId:        string;
  isClassTeacher: boolean;
};

// ── Role badge ────────────────────────────────────────────────

function roleBadge(role: string) {
  const map: Record<string, "default"|"navy"|"warning"> = {
    admin:       "navy",
    teacher:     "default",
    bursar:      "warning",
    super_admin: "navy",
  };
  return (
    <Badge
      label={role.replace("_", " ")}
      variant={map[role] ?? "default"}
    />
  );
}

// ── Edit staff slide-over ─────────────────────────────────────

function SubjectManager({
  assignment,
}: {
  assignment: StaffAssignment;
}) {
  const assignStaff    = useAssignStaff();
  const { data: allSubjects = [] } = useSubjects(assignment.classId);
  const [selected, setSelected]    = useState<string[]>(
    assignment.subjects.map((s) => s.id)
  );
  const [saved,   setSaved  ] = useState(false);
  const [saving,  setSaving ] = useState(false);

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await assignStaff.mutateAsync({
        userId:         assignment.userId,
        classId:        assignment.classId,
        isClassTeacher: assignment.isClassTeacher,
        subjectIds:     selected,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-surface-secondary border-b border-border">
        <div>
          <p className="text-xs font-semibold text-text-primary">{assignment.class?.name}</p>
          {assignment.isClassTeacher && (
            <p className="text-xs text-navy-600">Class Teacher</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="text-xs text-success flex items-center gap-1">
              <CheckCircle size={11} /> Saved
            </span>
          )}
          <Button
            size="sm"
            variant="secondary"
            loading={saving}
            onClick={handleSave}
          >
            Save
          </Button>
        </div>
      </div>

      {allSubjects.length === 0 ? (
        <p className="text-xs text-text-muted p-3">
          No subjects in this class yet.
        </p>
      ) : (
        <div className="p-3 flex flex-wrap gap-2">
          {allSubjects.map((subject) => {
            const on = selected.includes(subject.id);
            return (
              <button
                key={subject.id}
                type="button"
                onClick={() => toggle(subject.id)}
                className={classNames(
                  "flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-full border transition-colors cursor-pointer",
                  on
                    ? "bg-navy-600 border-navy-600 text-white"
                    : "border-border text-text-secondary hover:border-navy-400 hover:text-navy-600",
                )}
              >
                {on && <CheckCircle size={10} />}
                {subject.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EditStaffPanel({
  staff,
  onClose,
}: {
  staff:   StaffMember;
  onClose: () => void;
}) {
  const updateUser = useUpdateUser();
  const { data: assignments = [] } = useAssignmentsByUser(staff.id);
  const [saved,    setSaved  ] = useState(false);
  const [error,    setError  ] = useState<string | null>(null);
  const [tab,      setTab    ] = useState<"info" | "subjects">("info");

  const form = useForm<EditForm>({
    resolver:      zodResolver(editSchema) as any,
    defaultValues: {
      firstName:   staff.firstName,
      lastName:    staff.lastName,
      email:       staff.email,
      role:        staff.role as any,
      phoneNumber: staff.phoneNumber ?? "",
    },
  });

  async function onSubmit(data: EditForm) {
    setError(null);
    try {
      await updateUser.mutateAsync({ userId: staff.id, data });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
        <div>
          <p className="text-sm font-semibold text-text-primary">Edit staff</p>
          <p className="text-xs text-text-muted">{staff.firstName} {staff.lastName}</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded hover:bg-surface-secondary transition-colors cursor-pointer text-text-muted"
        >
          <X size={16} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border shrink-0">
        {(["info", "subjects"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={classNames(
              "flex-1 py-2.5 text-xs font-semibold uppercase tracking-wide border-b-2 -mb-px transition-colors cursor-pointer",
              tab === t
                ? "border-navy-600 text-navy-600"
                : "border-transparent text-text-muted hover:text-text-primary",
            )}
          >
            {t === "info" ? "Staff Info" : "Class Subjects"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5">

        {/* Info tab */}
        {tab === "info" && (
          <div className="flex flex-col gap-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-error-light border border-error rounded text-sm text-error">
                <AlertCircle size={14} className="shrink-0" />
                {error}
              </div>
            )}
            {saved && (
              <div className="flex items-center gap-2 p-3 bg-success-light border border-success rounded text-sm text-success">
                <CheckCircle size={14} className="shrink-0" />
                Changes saved successfully.
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First name"
                required
                error={form.formState.errors.firstName?.message}
                {...form.register("firstName")}
              />
              <Input
                label="Last name"
                required
                error={form.formState.errors.lastName?.message}
                {...form.register("lastName")}
              />
            </div>
            <Input
              label="Email address"
              type="email"
              required
              error={form.formState.errors.email?.message}
              {...form.register("email")}
            />
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1.5">
                Role <span className="text-error">*</span>
              </label>
              <select
                className="w-full h-9 px-3 text-sm border border-border rounded bg-surface text-text-primary focus:outline-2 focus:outline-navy-600"
                {...form.register("role")}
              >
                <option value="teacher">Teacher</option>
                <option value="bursar">Bursar</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <Input
              label="Phone number"
              type="tel"
              {...form.register("phoneNumber")}
            />
          </div>
        )}

        {/* Subjects tab */}
        {tab === "subjects" && (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-text-muted">
              Toggle subjects on or off for each class this teacher is assigned to.
              Click <strong>Save</strong> on each class separately.
            </p>
            {assignments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Users size={28} className="text-text-muted mb-2" />
                <p className="text-sm font-medium text-text-primary">No class assignments</p>
                <p className="text-xs text-text-muted mt-1">
                  Assign this teacher to a class first from the duties page.
                </p>
              </div>
            ) : (
              assignments.map((a) => (
                <SubjectManager key={a.id} assignment={a} />
              ))
            )}
          </div>
        )}
      </div>

      {/* Footer — only show save button on info tab */}
      {tab === "info" && (
        <div className="px-5 py-4 border-t border-border shrink-0">
          <Button
            fullWidth
            loading={updateUser.isPending}
            onClick={form.handleSubmit(onSubmit)}
          >
            Save changes
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Staff card ────────────────────────────────────────────────

function StaffCard({
  user,
  readOnly,
  onEdit,
  onDelete,
  onResend,
}: {
  user:     StaffMember;
  readOnly: boolean;
  onEdit:   (u: StaffMember) => void;
  onDelete: (u: StaffMember) => void;
  onResend: (userId: string) => void;
}) {
  const isPending = user.inviteStatus === "pending";

  return (
    <div className="flex items-center gap-4 px-4 py-3 hover:bg-surface-secondary transition-colors">
      {/* Avatar */}
      <div className="w-9 h-9 rounded-full bg-navy-100 flex items-center justify-center shrink-0">
        <span className="text-xs font-semibold text-navy-600">
          {user.firstName[0]}{user.lastName[0]}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary">
          {user.firstName} {user.lastName}
        </p>
        <p className="text-xs text-text-muted truncate">{user.email}</p>
      </div>

      {/* Badges */}
      <div className="flex items-center gap-2 shrink-0">
        {roleBadge(user.role)}
        <Badge
          label={isPending ? "Pending" : "Active"}
          variant={isPending ? "warning" : "success"}
        />
      </div>

      {/* Actions */}
      {!readOnly && (
        <div className="flex items-center gap-1 shrink-0">
          {isPending && (
            <button
              onClick={() => onResend(user.id)}
              title="Resend invite"
              className="p-1.5 rounded text-text-muted hover:text-navy-600 hover:bg-surface-secondary transition-colors cursor-pointer"
            >
              <RefreshCw size={14} />
            </button>
          )}
          <button
            onClick={() => onEdit(user)}
            title="Edit"
            className="p-1.5 rounded text-text-muted hover:text-navy-600 hover:bg-surface-secondary transition-colors cursor-pointer"
          >
            <Pencil size={14} />
          </button>
          {user.role !== "admin" && user.role !== "super_admin" && (
            <button
              onClick={() => onDelete(user)}
              title="Deactivate"
              className="p-1.5 rounded text-text-muted hover:text-error hover:bg-error-light transition-colors cursor-pointer"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────

export default function DutiesPage() {
  const [inviteModal,    setInviteModal   ] = useState(false);
  const [assignModal,    setAssignModal   ] = useState(false);
  const [editingStaff,   setEditingStaff  ] = useState<StaffMember | null>(null);
  const [deletingStaff,  setDeletingStaff ] = useState<StaffMember | null>(null);
  const [selectedClassId,setSelectedClassId] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  const { can } = usePermission();
  const readOnly = !can.manageStaff;

  const { data: users    = [], isLoading: usersLoading    } = useSchoolUsers();
  const { data: classes  = [], isLoading: classesLoading  } = useClasses();
  const { data: assignments = [] }                          = useAssignmentsByClass(selectedClassId);

  const inviteUser    = useInviteUser();
  const updateUser    = useUpdateUser();
  const deactivate    = useDeactivateUser();
  const resendInvite  = useResendInvite();
  const assignStaff   = useAssignStaff();
  const removeAssign  = useRemoveAssignment();

  const inviteForm = useForm<InviteForm>({ resolver: zodResolver(inviteSchema) });
  const assignForm = useForm<AssignForm>({
    resolver:      zodResolver(assignSchema) as any,
    defaultValues: { isClassTeacher: false },
  });

  // Must be after assignForm declaration
  const watchedClassId = assignForm.watch("classId");
  const { data: modalSubjects = [] } = useSubjects(watchedClassId ?? "");

  // ── Handlers ──────────────────────────────────────────────

  async function onInviteSubmit(data: InviteForm) {
    await inviteUser.mutateAsync(data);
    inviteForm.reset();
    setInviteModal(false);
  }

  async function onAssignSubmit(data: AssignForm) {
    await assignStaff.mutateAsync({
      userId:         data.userId,
      classId:        data.classId,
      isClassTeacher: data.isClassTeacher ?? false,
      subjectIds:     selectedSubjects,
    });
    assignForm.reset();
    setSelectedSubjects([]);
    setAssignModal(false);
  }

  async function handleDelete() {
    if (!deletingStaff) return;
    await deactivate.mutateAsync(deletingStaff.id);
    setDeletingStaff(null);
  }

  function toggleSubject(id: string) {
    setSelectedSubjects((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  const active  = users.filter((u) => u.inviteStatus === "accepted" || u.inviteStatus === null);
  const pending = users.filter((u) => u.inviteStatus === "pending");

  if (usersLoading || classesLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="h-8 w-48 bg-surface-tertiary rounded animate-pulse" />
        <div className="grid grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-64 bg-surface-tertiary rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        {readOnly && (
          <ReadOnlyBanner message="Only admins can manage staff and duty assignments." />
        )}

        <PageHeader
          title="Staff & Duties"
          subtitle={`${users.length} staff members`}
          action={
            !readOnly ? (
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => setAssignModal(true)}>
                  Assign to class
                </Button>
                <Button size="sm" onClick={() => setInviteModal(true)}>
                  <Plus size={15} />
                  Invite staff
                </Button>
              </div>
            ) : undefined
          }
        />

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total staff",    value: users.length   },
            { label: "Active",         value: active.length  },
            { label: "Pending invite", value: pending.length },
          ].map((stat) => (
            <Card key={stat.label} padding="sm">
              <p className="text-xs text-text-muted mb-1">{stat.label}</p>
              <p className="text-2xl font-semibold text-text-primary">{stat.value}</p>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Staff list */}
          <Card padding="none">
            <div className="p-4 border-b border-border">
              <CardHeader title="Staff members" subtitle="Click the pencil icon to edit" />
            </div>
            {users.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No staff yet"
                description="Invite your first staff member to get started."
                action={
                  !readOnly ? (
                    <Button size="sm" onClick={() => setInviteModal(true)}>
                      <Plus size={14} />
                      Invite staff
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <div className="divide-y divide-border">
                {users.map((u) => (
                  <StaffCard
                    key={u.id}
                    user={u}
                    readOnly={readOnly}
                    onEdit={setEditingStaff}
                    onDelete={setDeletingStaff}
                    onResend={(id) => resendInvite.mutate(id)}
                  />
                ))}
              </div>
            )}
          </Card>

          {/* Class assignments */}
          <Card padding="none">
            <div className="p-4 border-b border-border">
              <CardHeader
                title="Class assignments"
                subtitle="Select a class to see its teachers and their subjects"
              />
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="mt-3 w-full h-9 px-3 text-sm border border-border rounded bg-surface text-text-primary focus:outline-2 focus:outline-navy-600"
              >
                <option value="">Select a class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {!selectedClassId ? (
              <div className="flex items-center justify-center h-48 text-text-muted text-sm">
                Select a class above
              </div>
            ) : assignments.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No assignments"
                description="No teachers assigned to this class yet."
                action={
                  !readOnly ? (
                    <Button size="sm" onClick={() => setAssignModal(true)}>
                      <Plus size={14} />
                      Assign teacher
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <div className="divide-y divide-border">
                {assignments.map((a: StaffAssignment) => (
                  <div key={a.id} className="px-4 py-3 hover:bg-surface-secondary transition-colors">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-text-primary">
                            {a.user.firstName} {a.user.lastName}
                          </p>
                          {a.isClassTeacher && (
                            <Badge label="Class Teacher" variant="navy" />
                          )}
                        </div>
                        {a.subjects && a.subjects.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {a.subjects.map((s) => (
                              <span
                                key={s.id}
                                className="text-xs px-2 py-0.5 bg-surface-secondary border border-border rounded text-text-muted"
                              >
                                {s.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-text-muted">No subjects assigned</p>
                        )}
                      </div>
                      {!readOnly && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            removeAssign.mutate({
                              assignmentId: a.id,
                              classId:      a.classId,
                              userId:       a.userId,
                            })
                          }
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* ── Edit Staff Slide-over ── */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="flex-1 bg-black/40"
            onClick={() => setEditingStaff(null)}
          />
          {/* Panel */}
          <div className="w-full max-w-sm bg-surface shadow-xl flex flex-col border-l border-border">
            <EditStaffPanel
              staff={editingStaff}
              onClose={() => setEditingStaff(null)}
            />
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      <Modal
        isOpen={!!deletingStaff}
        onClose={() => setDeletingStaff(null)}
        title="Deactivate staff member"
        subtitle="This will prevent the staff member from logging in. Their data will be preserved."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeletingStaff(null)}>
              Cancel
            </Button>
            <Button
              loading={deactivate.isPending}
              onClick={handleDelete}
              className="bg-error! border-error! hover:bg-error-dark!"
            >
              <Trash2 size={14} />
              Deactivate
            </Button>
          </>
        }
      >
        {deletingStaff && (
          <div className="flex items-center gap-3 p-4 bg-error-light border border-error rounded-lg">
            <AlertCircle size={18} className="text-error shrink-0" />
            <p className="text-sm text-error">
              <span className="font-semibold">
                {deletingStaff.firstName} {deletingStaff.lastName}
              </span>{" "}
              will be deactivated and will no longer be able to log in.
            </p>
          </div>
        )}
      </Modal>

      {/* ── Invite Modal ── */}
      <Modal
        isOpen={inviteModal}
        onClose={() => { setInviteModal(false); inviteForm.reset(); }}
        title="Invite staff member"
        subtitle="They will receive an email to set their password"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setInviteModal(false); inviteForm.reset(); }}>
              Cancel
            </Button>
            <Button
              loading={inviteUser.isPending}
              onClick={inviteForm.handleSubmit(onInviteSubmit)}
            >
              Send invite
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {inviteUser.error && (
            <p className="text-sm text-error">{(inviteUser.error as Error).message}</p>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First name"
              required
              error={inviteForm.formState.errors.firstName?.message}
              {...inviteForm.register("firstName")}
            />
            <Input
              label="Last name"
              required
              error={inviteForm.formState.errors.lastName?.message}
              {...inviteForm.register("lastName")}
            />
          </div>
          <Input
            label="Email address"
            type="email"
            required
            error={inviteForm.formState.errors.email?.message}
            {...inviteForm.register("email")}
          />
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1.5">
              Role <span className="text-error">*</span>
            </label>
            <select
              className="w-full h-9 px-3 text-sm border border-border rounded bg-surface text-text-primary focus:outline-2 focus:outline-navy-600"
              {...inviteForm.register("role")}
            >
              <option value="">Select role</option>
              <option value="teacher">Teacher</option>
              <option value="bursar">Bursar</option>
              <option value="admin">Admin</option>
            </select>
            {inviteForm.formState.errors.role && (
              <p className="text-xs text-error mt-1">{inviteForm.formState.errors.role.message}</p>
            )}
          </div>
          <Input
            label="Phone number"
            type="tel"
            {...inviteForm.register("phoneNumber")}
          />
        </div>
      </Modal>

      {/* ── Assign Modal ── */}
      <Modal
        isOpen={assignModal}
        onClose={() => { setAssignModal(false); assignForm.reset(); setSelectedSubjects([]); }}
        title="Assign staff to class"
        subtitle="Select a teacher, their class, and the subjects they teach"
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => { setAssignModal(false); assignForm.reset(); setSelectedSubjects([]); }}
            >
              Cancel
            </Button>
            <Button
              loading={assignStaff.isPending}
              onClick={assignForm.handleSubmit(onAssignSubmit)}
            >
              Save assignment
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {assignStaff.error && (
            <p className="text-sm text-error">{(assignStaff.error as Error).message}</p>
          )}

          {/* Staff select */}
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1.5">
              Staff member <span className="text-error">*</span>
            </label>
            <select
              className="w-full h-9 px-3 text-sm border border-border rounded bg-surface text-text-primary focus:outline-2 focus:outline-navy-600"
              {...assignForm.register("userId")}
            >
              <option value="">Select staff</option>
              {users.filter((u) => u.role === "teacher").map((u) => (
                <option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName}
                </option>
              ))}
            </select>
            {assignForm.formState.errors.userId && (
              <p className="text-xs text-error mt-1">{assignForm.formState.errors.userId.message}</p>
            )}
          </div>

          {/* Class select */}
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1.5">
              Class <span className="text-error">*</span>
            </label>
            <select
              className="w-full h-9 px-3 text-sm border border-border rounded bg-surface text-text-primary focus:outline-2 focus:outline-navy-600"
              {...assignForm.register("classId")}
              onChange={(e) => {
                assignForm.setValue("classId", e.target.value);
                setSelectedSubjects([]);
              }}
            >
              <option value="">Select class</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {assignForm.formState.errors.classId && (
              <p className="text-xs text-error mt-1">{assignForm.formState.errors.classId.message}</p>
            )}
          </div>

          {/* Class teacher toggle */}
          <label className="flex items-center gap-3 cursor-pointer p-3 border border-border rounded-lg hover:bg-surface-secondary transition-colors">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-border accent-navy-600"
              {...assignForm.register("isClassTeacher")}
            />
            <div>
              <p className="text-sm font-medium text-text-primary">Appoint as class teacher</p>
              <p className="text-xs text-text-muted">Class teacher can add terminal comments and publish reports</p>
            </div>
          </label>

          {/* Subject assignment */}
          {watchedClassId && (
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-2 uppercase tracking-wide">
                Subjects taught in this class
              </label>
              {modalSubjects.length === 0 ? (
                <p className="text-xs text-text-muted">
                  No subjects found for this class. Add subjects in the Classes page first.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {modalSubjects.map((subject) => {
                    const selected = selectedSubjects.includes(subject.id);
                    return (
                      <button
                        key={subject.id}
                        type="button"
                        onClick={() => toggleSubject(subject.id)}
                        className={classNames(
                          "flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors text-left cursor-pointer",
                          selected
                            ? "bg-navy-600 border-navy-600 text-white"
                            : "border-border text-text-secondary hover:border-navy-400 hover:text-navy-600",
                        )}
                      >
                        <div className={classNames(
                          "w-4 h-4 rounded border-2 flex items-center justify-center shrink-0",
                          selected ? "border-white bg-white" : "border-current",
                        )}>
                          {selected && (
                            <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                              <path d="M1 3L3 5L7 1" stroke="#1A3A5C" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                          )}
                        </div>
                        {subject.name}
                      </button>
                    );
                  })}
                </div>
              )}
              {selectedSubjects.length > 0 && (
                <p className="text-xs text-navy-600 mt-2 font-medium">
                  {selectedSubjects.length} subject{selectedSubjects.length !== 1 ? "s" : ""} selected
                </p>
              )}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}