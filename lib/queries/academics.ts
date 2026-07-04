"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getActiveSession,
  getDailySummary,
  getAttendance,
  getAttendanceStats,
  submitAttendance,
  getScoresBySubject,
  submitScores,
  getReports,
  generateReports,
  updateReportTeacherInput,
  publishReports,
} from "@/lib/api";
import { keys } from "./keys";
import { useAuthStore } from "@/lib/store";
import type { AttendanceEntry } from "@/types";

// ─────────────────────────────────────────────────────────────
// ATTENDANCE SESSION (morning/afternoon clock)
// ─────────────────────────────────────────────────────────────

export function useActiveSession() {
  return useQuery({
    queryKey: keys.attendance.activeSession(),
    queryFn:  getActiveSession,
    refetchInterval: 60 * 1000,
    staleTime:       30 * 1000,
  });
}

export function useDailySummary(classId: string, date: string) {
  return useQuery({
    queryKey: keys.attendance.daily(classId, date),
    queryFn:  () => getDailySummary(classId, date),
    enabled:  !!classId && !!date,
  });
}

export function useSessionAttendance(
  classId: string,
  date:    string,
  session: "morning" | "afternoon" | undefined,
) {
  return useQuery({
    queryKey: keys.attendance.bySession(classId, date, session ?? ""),
    queryFn:  () => getAttendance(classId, date, session!),
    enabled:  !!classId && !!date && !!session,
  });
}

export function useSubmitAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      classId:  string;
      date:     string;
      session?: "morning" | "afternoon";
      entries:  AttendanceEntry[];
    }) => submitAttendance(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: keys.attendance.daily(variables.classId, variables.date),
      });
      if (variables.session) {
        queryClient.invalidateQueries({
          queryKey: keys.attendance.bySession(
            variables.classId, variables.date, variables.session,
          ),
        });
      }
    },
  });
}

export function useAttendanceStats(classId: string, from: string, to: string) {
  return useQuery({
    queryKey: keys.attendance.stats(classId, from, to),
    queryFn:  () => getAttendanceStats(classId, from, to),
    enabled:  !!classId && !!from && !!to,
  });
}

// ─────────────────────────────────────────────────────────────
// SCORES — term/year auto-resolved from active session by backend
// ─────────────────────────────────────────────────────────────

export function useScoresBySubject(subjectId: string, schoolId: string) {
  return useQuery({
    queryKey: keys.scores.bySubject(subjectId, "active", schoolId),
    queryFn:  () => getScoresBySubject(subjectId, schoolId),
    enabled:  !!subjectId && !!schoolId,
  });
}

export function useSubmitScores() {
  const queryClient = useQueryClient();
  const schoolId    = useAuthStore((s) => s.schoolId);

  return useMutation({
    mutationFn: (data: {
      subjectId: string;
      schoolId:  string;
      entries:   { studentId: string; caScore: number; examScore: number }[];
    }) => submitScores(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: keys.scores.bySubject(variables.subjectId, "active", variables.schoolId),
      });
    },
  });
}

// ─────────────────────────────────────────────────────────────
// REPORTS — term/year auto-resolved from active session by backend
// ─────────────────────────────────────────────────────────────

export function useReports(
  classId:      string,
  schoolId:     string,
  term?:        string,
  academicYear?: string,
) {
  const sessionKey = term && academicYear ? `${term}-${academicYear}` : "active";
  return useQuery({
    queryKey: keys.reports.byClass(classId, sessionKey, schoolId),
    queryFn:  () => getReports(classId, schoolId, term, academicYear),
    enabled:  !!classId && !!schoolId,
  });
}

export function useGenerateReports() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { classId: string; schoolId: string }) =>
      generateReports(data),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({
        queryKey: keys.reports.byClass(v.classId, "active", v.schoolId),
      });
    },
  });
}

export function useUpdateReportTeacherInput() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      reportId,
      classId,
      schoolId,
      data,
    }: {
      reportId:  string;
      classId:   string;
      schoolId:  string;
      data:      Parameters<typeof updateReportTeacherInput>[1];
    }) => updateReportTeacherInput(reportId, data),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({
        queryKey: keys.reports.byClass(v.classId, "active", v.schoolId),
      });
    },
  });
}

export function usePublishReports() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { classId: string; schoolId: string }) =>
      publishReports(data.classId, undefined as any, undefined as any),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({
        queryKey: keys.reports.byClass(v.classId, "active", v.schoolId),
      });
    },
  });
}