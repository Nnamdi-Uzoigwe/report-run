"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/store";
import {
  getSchoolUsers,
  inviteUser,
  resendInvite,
  deactivateUser,
  updateUser,
  assignStaff,
  getAssignmentsByClass,
  getAssignmentsByUser,
  removeAssignment,
} from "@/lib/api";
import { keys } from "./keys";
import type { InviteStaffPayload, AssignStaffPayload } from "@/types";

// ── Staff list ────────────────────────────────────────────────

export function useSchoolUsers() {
  const schoolId = useAuthStore((s) => s.schoolId);

  return useQuery({
    queryKey: keys.users.school(schoolId ?? ""),
    queryFn:  () => getSchoolUsers(schoolId!),
    enabled:  !!schoolId,
  });
}

// ── Invite ────────────────────────────────────────────────────

export function useInviteUser() {
  const schoolId    = useAuthStore((s) => s.schoolId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<InviteStaffPayload, "schoolId">) =>
      inviteUser({ ...data, schoolId: schoolId! }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: keys.users.school(schoolId!),
      });
    },
  });
}

export function useResendInvite() {
  const schoolId    = useAuthStore((s) => s.schoolId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => resendInvite(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: keys.users.school(schoolId!),
      });
    },
  });
}

export function useDeactivateUser() {
  const schoolId    = useAuthStore((s) => s.schoolId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => deactivateUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: keys.users.school(schoolId!),
      });
    },
  });
}

export function useUpdateUser() {
  const schoolId    = useAuthStore((s) => s.schoolId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      data,
    }: {
      userId: string;
      data: Parameters<typeof updateUser>[1];
    }) => updateUser(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: keys.users.school(schoolId!),
      });
    },
  });
}

// ── Staff assignments ─────────────────────────────────────────

export function useAssignmentsByClass(classId: string) {
  return useQuery({
    queryKey: keys.assignments.byClass(classId),
    queryFn:  () => getAssignmentsByClass(classId),
    enabled:  !!classId,
  });
}

export function useAssignmentsByUser(userId: string) {
  return useQuery({
    queryKey: keys.assignments.byUser(userId),
    queryFn:  () => getAssignmentsByUser(userId),
    enabled:  !!userId,
  });
}

export function useAssignStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AssignStaffPayload) => assignStaff(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: keys.assignments.byClass(variables.classId),
      });
      queryClient.invalidateQueries({
        queryKey: keys.assignments.byUser(variables.userId),
      });
    },
  });
}

export function useRemoveAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      assignmentId,
      classId,
      userId,
    }: {
      assignmentId: string;
      classId: string;
      userId: string;
    }) => removeAssignment(assignmentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: keys.assignments.byClass(variables.classId),
      });
      queryClient.invalidateQueries({
        queryKey: keys.assignments.byUser(variables.userId),
      });
    },
  });
}