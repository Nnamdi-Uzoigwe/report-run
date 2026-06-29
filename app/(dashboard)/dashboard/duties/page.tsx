"use client";

import { useState } from "react";
import { Plus, Users } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  PageHeader, Card, CardHeader, Badge,
  Button, Modal, Input, Select, EmptyState,
} from "@/components/ui";
import {
  useSchoolUsers, useInviteUser,
  useAssignmentsByClass, useAssignStaff, useRemoveAssignment,
} from "@/lib/queries/staff";
import { useClasses } from "@/lib/queries/classes";
import { usePermission } from "@/lib/hooks/usePermission";
import { ReadOnlyBanner } from "@/components/dashboard/ReadOnlyBanner";
import { useAuthStore } from "@/lib/store";
import type { SelectOption, StaffAssignment } from "@/types";

// ── Schemas ───────────────────────────────────────────────────

const inviteSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName:  z.string().min(1, "Last name is required"),
  email:     z.string().email("Enter a valid email"),
  role:      z.enum(["teacher", "bursar", "admin"]),
  phoneNumber: z.string().optional(),
});

const assignSchema = z.object({
  userId:         z.string().min(1, "Select a staff member"),
  classId:        z.string().min(1, "Select a class"),
  isClassTeacher: z.boolean().optional().default(false),
});

type InviteForm = z.infer<typeof inviteSchema>;
type AssignForm = {
  userId:         string;
  classId:        string;
  isClassTeacher: boolean;
};

// ── Page ──────────────────────────────────────────────────────

export default function DutiesPage() {
  const [inviteModal, setInviteModal] = useState(false);
  const [assignModal, setAssignModal] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState("");

  const { can } = usePermission();
  const readOnly = !can.manageStaff;

  const { data: users   = [], isLoading: usersLoading   } = useSchoolUsers();
  const { data: classes = [], isLoading: classesLoading } = useClasses();
  const { data: assignments = [] } = useAssignmentsByClass(selectedClassId);

  const inviteUser     = useInviteUser();
  const assignStaff    = useAssignStaff();
  const removeAssign   = useRemoveAssignment();

  const inviteForm = useForm<InviteForm>({ resolver: zodResolver(inviteSchema) });
  const assignForm = useForm<AssignForm>({
    resolver: zodResolver(assignSchema) as any,
    defaultValues: { isClassTeacher: false },
  });

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
    });
    assignForm.reset();
    setAssignModal(false);
  }

  const teachers = users.filter((u) => u.role === "teacher");
  const pending  = users.filter((u) => u.inviteStatus === "pending");
  const active   = users.filter((u) => u.inviteStatus === "accepted" || u.inviteStatus === null);

  const userOptions: SelectOption[] = teachers.map((u) => ({
    value: u.id,
    label: `${u.firstName} ${u.lastName}`,
  }));

  const classOptions: SelectOption[] = [
    { value: "", label: "Select a class to view assignments" },
    ...classes.map((c) => ({ value: c.id, label: c.name })),
  ];

  const roleOptions: SelectOption[] = [
    { value: "teacher", label: "Teacher" },
    { value: "bursar",  label: "Bursar"  },
    { value: "admin",   label: "Admin"   },
  ];

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
            { label: "Total staff",   value: users.length   },
            { label: "Active",        value: active.length  },
            { label: "Pending invite",value: pending.length },
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
              <CardHeader title="Staff members" subtitle="All users in your school" />
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
                  <div
                    key={u.id}
                    className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-surface-secondary transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-navy-100 flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-navy-600">
                          {u.firstName[0]}{u.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {u.firstName} {u.lastName}
                        </p>
                        <p className="text-xs text-text-muted">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        label={u.role.replace("_", " ")}
                        variant="default"
                      />
                      <Badge
                        label={u.inviteStatus === "pending" ? "Pending" : "Active"}
                        variant={u.inviteStatus === "pending" ? "warning" : "success"}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Class assignments */}
          <Card padding="none">
            <div className="p-4 border-b border-border">
              <CardHeader
                title="Class assignments"
                subtitle="Select a class to see its teachers"
              />
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="mt-3 w-full h-9 px-3 text-sm border border-border rounded bg-surface text-text-primary focus:outline-2 focus:outline-navy-600"
              >
                {classOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
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
                description="No teachers have been assigned to this class yet."
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
                  <div
                    key={a.id}
                    className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-surface-secondary transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {a.user.firstName} {a.user.lastName}
                      </p>
                      <p className="text-xs text-text-muted">
                        {a.subjects.map((s) => s.name).join(", ") || "No subjects"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {a.isClassTeacher && (
                        <Badge label="Class Teacher" variant="navy" />
                      )}
                      {!readOnly && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            removeAssign.mutate({
                              assignmentId: a.id,
                              classId: a.classId,
                              userId: a.userId,
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

      {/* Invite Modal */}
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
          {inviteUser.isSuccess && (
            <p className="text-sm text-success">Invite sent successfully.</p>
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
          <Select
            label="Role"
            required
            options={roleOptions}
            placeholder="Select role"
            error={inviteForm.formState.errors.role?.message}
            {...inviteForm.register("role")}
          />
          <Input
            label="Phone number"
            type="tel"
            {...inviteForm.register("phoneNumber")}
          />
        </div>
      </Modal>

      {/* Assign Modal */}
      <Modal
        isOpen={assignModal}
        onClose={() => { setAssignModal(false); assignForm.reset(); }}
        title="Assign staff to class"
        subtitle="Assign a teacher to a class section"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setAssignModal(false); assignForm.reset(); }}>
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
          <Select
            label="Staff member"
            required
            options={userOptions}
            placeholder="Select staff"
            error={assignForm.formState.errors.userId?.message}
            {...assignForm.register("userId")}
          />
          <Select
            label="Class"
            required
            options={classes.map((c) => ({ value: c.id, label: c.name }))}
            placeholder="Select class"
            error={assignForm.formState.errors.classId?.message}
            {...assignForm.register("classId")}
          />
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-border accent-navy-600"
              {...assignForm.register("isClassTeacher")}
            />
            <span className="text-sm text-text-primary">Appoint as class teacher</span>
          </label>
        </div>
      </Modal>
    </>
  );
}