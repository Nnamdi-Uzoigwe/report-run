"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSessions,
  getActiveAcademicSession,
  createSession,
  activateSession,
  advanceTerm,
  updateSession,
  previewPromotion,
  executePromotion,
} from "@/lib/api";
import { keys } from "./keys";
import { useAuthStore } from "@/lib/store";
import type { AcademicSession, Term } from "@/types";

export function useSessions() {
  const schoolId = useAuthStore((s) => s.schoolId);
  return useQuery({
    queryKey: keys.sessions.all(schoolId!),
    queryFn:  () => getSessions(schoolId!),
    enabled:  !!schoolId,
  });
}

export function useActiveAcademicSession() {
  const schoolId = useAuthStore((s) => s.schoolId);
  return useQuery({
    queryKey: keys.sessions.active(schoolId!),
    queryFn:  () => getActiveAcademicSession(schoolId!),
    enabled:  !!schoolId,
    staleTime: 30_000,
  });
}

export function useCreateSession() {
  const schoolId    = useAuthStore((s) => s.schoolId);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      academicYear: string;
      currentTerm:  Term;
      startDate?:   string;
      endDate?:     string;
      notes?:       string;
    }) => createSession({ ...data, schoolId: schoolId! }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.sessions.all(schoolId!) });
    },
  });
}

export function useActivateSession() {
  const schoolId    = useAuthStore((s) => s.schoolId);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => activateSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.sessions.all(schoolId!) });
      queryClient.invalidateQueries({ queryKey: keys.sessions.active(schoolId!) });
    },
  });
}

export function useAdvanceTerm() {
  const schoolId    = useAuthStore((s) => s.schoolId);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => advanceTerm(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.sessions.all(schoolId!) });
      queryClient.invalidateQueries({ queryKey: keys.sessions.active(schoolId!) });
    },
  });
}

export function useUpdateSession() {
  const schoolId    = useAuthStore((s) => s.schoolId);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: {
      id:   string;
      data: Parameters<typeof updateSession>[1];
    }) => updateSession(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.sessions.all(schoolId!) });
    },
  });
}

export function usePreviewPromotion() {
  return useMutation({
    mutationFn: previewPromotion,
  });
}

export function useExecutePromotion() {
  const schoolId    = useAuthStore((s) => s.schoolId);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: executePromotion,
    onSuccess: () => {
      // Invalidate sessions (new one was activated) and students (classes changed)
      queryClient.invalidateQueries({ queryKey: keys.sessions.all(schoolId!) });
      queryClient.invalidateQueries({ queryKey: keys.sessions.active(schoolId!) });
      queryClient.invalidateQueries({ queryKey: keys.students.all(schoolId!) });
    },
  });
}