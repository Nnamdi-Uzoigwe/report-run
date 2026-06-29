"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAttendance,
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
import type { AttendanceEntry, ScoreTerm } from "@/types";

// ─────────────────────────────────────────────────────────────
// ATTENDANCE
// ─────────────────────────────────────────────────────────────

export function useAttendance(classId: string, date: string) {
  return useQuery({
    queryKey: keys.attendance.byClassAndDate(classId, date),
    queryFn:  () => getAttendance(classId, date),
    enabled:  !!classId && !!date,
  });
}

export function useSubmitAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      classId: string;
      date: string;
      entries: AttendanceEntry[];
    }) => submitAttendance(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: keys.attendance.byClassAndDate(
          variables.classId,
          variables.date
        ),
      });
    },
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