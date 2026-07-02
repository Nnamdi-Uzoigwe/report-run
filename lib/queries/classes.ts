"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/store";
import {
  getClasses,
  createClass,
  updateClass,
  deleteClass,
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  getGradingSchemes,
  createGradingScheme,
  updateGradingScheme,
  setDefaultGradingScheme,
  deleteGradingScheme,
} from "@/lib/api";
import { keys } from "./keys";
import type { GradingScheme } from "@/types";

// ── Classes ───────────────────────────────────────────────────

export function useClasses() {
  const schoolId = useAuthStore((s) => s.schoolId);

  return useQuery({
    queryKey: keys.classes.all(schoolId ?? ""),
    queryFn:  () => getClasses(schoolId!),
    enabled:  !!schoolId,
  });
}

export function useCreateClass() {
  const schoolId    = useAuthStore((s) => s.schoolId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      createClass({ ...data, schoolId: schoolId! }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: keys.classes.all(schoolId!),
      });
    },
  });
}

export function useUpdateClass() {
  const schoolId    = useAuthStore((s) => s.schoolId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      classId,
      data,
    }: {
      classId: string;
      data: Parameters<typeof updateClass>[1];
    }) => updateClass(classId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: keys.classes.all(schoolId!),
      });
    },
  });
}

export function useDeleteClass() {
  const schoolId    = useAuthStore((s) => s.schoolId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (classId: string) => deleteClass(classId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: keys.classes.all(schoolId!),
      });
    },
  });
}

// ── Subjects ──────────────────────────────────────────────────

export function useSubjects(classId: string) {
  return useQuery({
    queryKey: keys.subjects.byClass(classId),
    queryFn:  () => getSubjects(classId),
    enabled:  !!classId,
  });
}

export function useCreateSubject() {
  const schoolId    = useAuthStore((s) => s.schoolId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof createSubject>[0]) =>
      createSubject({ ...data, schoolId: schoolId! }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: keys.subjects.byClass(variables.classId),
      });
    },
  });
}

export function useUpdateSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      subjectId,
      classId,
      data,
    }: {
      subjectId: string;
      classId: string;
      data: Parameters<typeof updateSubject>[1];
    }) => updateSubject(subjectId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: keys.subjects.byClass(variables.classId),
      });
    },
  });
}

export function useDeleteSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      subjectId,
      classId,
    }: {
      subjectId: string;
      classId: string;
    }) => deleteSubject(subjectId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: keys.subjects.byClass(variables.classId),
      });
    },
  });
}

// ── Grading Schemes ───────────────────────────────────────────

export function useGradingSchemes() {
  const schoolId = useAuthStore((s) => s.schoolId);

  return useQuery({
    queryKey: keys.grading.all(schoolId ?? ""),
    queryFn:  () => getGradingSchemes(schoolId!),
    enabled:  !!schoolId,
  });
}

export function useCreateGradingScheme() {
  const schoolId    = useAuthStore((s) => s.schoolId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<Parameters<typeof createGradingScheme>[0], "schoolId">) =>
      createGradingScheme({ ...data, schoolId: schoolId! }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: keys.grading.all(schoolId!),
      });
    },
  });
}

export function useUpdateGradingScheme() {
  const schoolId    = useAuthStore((s) => s.schoolId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ schemeId, data }: {
      schemeId: string;
      data:     Parameters<typeof updateGradingScheme>[1];
    }) => updateGradingScheme(schemeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.grading.all(schoolId!) });
    },
  });
}

export function useSetDefaultGradingScheme() {
  const schoolId    = useAuthStore((s) => s.schoolId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (schemeId: string) => setDefaultGradingScheme(schemeId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: keys.grading.all(schoolId!),
      });
    },
  });
}

export function useDeleteGradingScheme() {
  const schoolId    = useAuthStore((s) => s.schoolId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (schemeId: string) => deleteGradingScheme(schemeId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: keys.grading.all(schoolId!),
      });
    },
  });
}