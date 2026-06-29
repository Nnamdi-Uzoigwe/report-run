"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/store";
import {
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deactivateStudent,
  previewExcelImport,
  confirmStudentImport,
} from "@/lib/api";
import { keys } from "./keys";
import type { Student } from "@/types";

// ── List ──────────────────────────────────────────────────────

export function useStudents(classId?: string) {
  const schoolId = useAuthStore((s) => s.schoolId);

  return useQuery({
    queryKey: keys.students.all(schoolId ?? "", classId),
    queryFn:  () => getStudents(schoolId!, classId),
    enabled:  !!schoolId,
  });
}

// ── Single ────────────────────────────────────────────────────

export function useStudent(studentId: string) {
  return useQuery({
    queryKey: keys.students.detail(studentId),
    queryFn:  () => getStudent(studentId),
    enabled:  !!studentId,
  });
}

// ── Create ────────────────────────────────────────────────────

export function useCreateStudent() {
  const schoolId    = useAuthStore((s) => s.schoolId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      data: Omit<Student, "id" | "createdAt" | "updatedAt" | "class" | "isActive" | "schoolId">
    ) => createStudent({ ...data, schoolId: schoolId! }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: keys.students.all(schoolId!),
      });
    },
  });
}

// ── Update ────────────────────────────────────────────────────

export function useUpdateStudent() {
  const schoolId    = useAuthStore((s) => s.schoolId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      studentId,
      data,
    }: {
      studentId: string;
      data: Partial<Student>;
    }) => updateStudent(studentId, data),
    onSuccess: (updated) => {
      // Update both the list and the individual cache entry
      queryClient.setQueryData(keys.students.detail(updated.id), updated);
      queryClient.invalidateQueries({
        queryKey: keys.students.all(schoolId!),
      });
    },
  });
}

// ── Deactivate ────────────────────────────────────────────────

export function useDeactivateStudent() {
  const schoolId    = useAuthStore((s) => s.schoolId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (studentId: string) => deactivateStudent(studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: keys.students.all(schoolId!),
      });
    },
  });
}

// ── Excel import — two-step ───────────────────────────────────

/**
 * Step 1: upload the file, get a preview of parsed rows back.
 * Nothing is saved to the database at this point.
 */
export function usePreviewExcelImport() {
  return useMutation({
    mutationFn: (file: File) => previewExcelImport(file),
  });
}

/**
 * Step 2: admin reviews the preview table, then confirms.
 * This actually persists the students.
 */
export function useConfirmStudentImport() {
  const schoolId    = useAuthStore((s) => s.schoolId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (students: Partial<Student>[]) =>
      confirmStudentImport(schoolId!, students),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: keys.students.all(schoolId!),
      });
    },
  });
}