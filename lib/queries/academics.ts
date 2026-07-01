"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getActiveSession,
  getDailySummary,
  getAttendance,
  getAttendanceStats,
  submitAttendance,
  getScoresBySubject,
  getScoresByStudent,
  submitScores,
  getReports,
  generateReports,
  updateReportTeacherInput,
  publishReports,
} from "@/lib/api";
import { keys } from "./keys";
import type { AttendanceEntry, AttendanceRecord, ScoreTerm } from "@/types";
// ─────────────────────────────────────────────────────────────
// ATTENDANCE
// ─────────────────────────────────────────────────────────────

export function useActiveSession() {
  return useQuery({
    queryKey: keys.attendance.activeSession(),
    queryFn:  getActiveSession,
    // Refetch every minute so the session auto-switches at 11am
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

export const EMPTY_ATTENDANCE: AttendanceRecord[] = []; // declare once, outside the hook

export function useSessionAttendance(
  classId: string,
  date:    string,
  session: "morning" | "afternoon" | undefined,
) {
  return useQuery({
    queryKey:        keys.attendance.bySession(classId, date, session ?? ""),
    queryFn:         () => getAttendance(classId, date, session!),
    enabled:         !!classId && !!date && !!session,
    placeholderData: EMPTY_ATTENDANCE,   // <-- add this line
  });
}

export function useSubmitAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      classId: string;
      date:    string;
      session?: "morning" | "afternoon";
      entries: AttendanceEntry[];
    }) => submitAttendance(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: keys.attendance.daily(variables.classId, variables.date),
      });
      if (variables.session) {
        queryClient.invalidateQueries({
          queryKey: keys.attendance.bySession(
            variables.classId,
            variables.date,
            variables.session,
          ),
        });
      }
    },
  });
}

export function useAttendanceStats(
  classId: string,
  from:    string,
  to:      string,
) {
  return useQuery({
    queryKey: keys.attendance.stats(classId, from, to),
    queryFn:  () => getAttendanceStats(classId, from, to),
    enabled:  !!classId && !!from && !!to,
  });
}

// ─────────────────────────────────────────────────────────────
// SCORES
// ─────────────────────────────────────────────────────────────

export function useScoresBySubject(
  subjectId: string,
  term: ScoreTerm,
  academicYear: string
) {
  return useQuery({
    queryKey: keys.scores.bySubject(subjectId, term, academicYear),
    queryFn:  () => getScoresBySubject(subjectId, term, academicYear),
    enabled:  !!subjectId && !!term && !!academicYear,
  });
}

export function useScoresByStudent(
  studentId: string,
  term: ScoreTerm,
  academicYear: string
) {
  return useQuery({
    queryKey: keys.scores.byStudent(studentId, term, academicYear),
    queryFn:  () => getScoresByStudent(studentId, term, academicYear),
    enabled:  !!studentId && !!term && !!academicYear,
  });
}

export function useSubmitScores() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      subjectId: string;
      term: ScoreTerm;
      academicYear: string;
      entries: { studentId: string; caScore: number; examScore: number }[];
    }) => submitScores(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: keys.scores.bySubject(
          variables.subjectId,
          variables.term,
          variables.academicYear
        ),
      });
    },
  });
}

// ─────────────────────────────────────────────────────────────
// REPORTS
// ─────────────────────────────────────────────────────────────

export function useReports(
  classId: string,
  term: ScoreTerm,
  academicYear: string
) {
  return useQuery({
    queryKey: keys.reports.byClass(classId, term, academicYear),
    queryFn:  () => getReports(classId, term, academicYear),
    enabled:  !!classId && !!term && !!academicYear,
  });
}

export function useGenerateReports() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      classId: string;
      term: ScoreTerm;
      academicYear: string;
    }) => generateReports(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: keys.reports.byClass(
          variables.classId,
          variables.term,
          variables.academicYear
        ),
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
      term,
      academicYear,
      data,
    }: {
      reportId: string;
      classId: string;
      term: ScoreTerm;
      academicYear: string;
      data: Parameters<typeof updateReportTeacherInput>[1];
    }) => updateReportTeacherInput(reportId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: keys.reports.byClass(
          variables.classId,
          variables.term,
          variables.academicYear
        ),
      });
    },
  });
}

export function usePublishReports() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      classId: string;
      term: ScoreTerm;
      academicYear: string;
    }) => publishReports(data.classId, data.term, data.academicYear),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: keys.reports.byClass(
          variables.classId,
          variables.term,
          variables.academicYear
        ),
      });
    },
  });
}