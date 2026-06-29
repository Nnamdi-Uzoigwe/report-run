/**
 * lib/api.ts
 *
 * Domain-level API functions. Every function here is a thin wrapper around
 * authFetch / publicFetch from lib/fetcher.ts. No business logic lives here —
 * just the mapping between frontend call sites and backend endpoints.
 *
 * All functions are async and throw ApiError on failure.
 * Callers (TanStack Query hooks) are responsible for error handling.
 */

import { authFetch, publicFetch } from "@/lib/fetcher";
import type {
  User,
  School,
  Plan,
  Subscription,
  StaffMember,
  StaffAssignment,
  AssignStaffPayload,
  InviteStaffPayload,
  ClassSection,
  Subject,
  Student,
  AttendanceRecord,
  AttendanceEntry,
  Score,
  ScoreTerm,
  GradingScheme,
  Report,
  FeeInvoice,
  Payment,
  FeeDashboardMetrics,
  DunningConfig,
} from "@/types";

// ─────────────────────────────────────────────────────────────
// SCHOOL
// ─────────────────────────────────────────────────────────────

export async function getSchool(schoolId: string): Promise<School> {
  return authFetch<School>(`/schools/${schoolId}`);
}

export async function updateSchool(
  schoolId: string,
  data: Partial<Pick<School, "name" | "address" | "phone">>
): Promise<School> {
  return authFetch<School>(`/schools/${schoolId}`, {
    method: "PATCH",
    body: data,
  });
}

export async function uploadSchoolLogo(
  schoolId: string,
  file: File
): Promise<School> {
  // Logo upload is multipart — bypass the JSON body helper
  const form = new FormData();
  form.append("logo", file);
  return authFetch<School>(`/schools/${schoolId}/logo`, {
    method: "PATCH",
    body: form as unknown as Record<string, unknown>,
  });
}

// ─────────────────────────────────────────────────────────────
// SUBSCRIPTIONS & PLANS
// ─────────────────────────────────────────────────────────────

export async function getPlans(): Promise<Plan[]> {
  return publicFetch<Plan[]>("/subscriptions/plans");
}

export async function getActiveSubscription(
  schoolId: string
): Promise<Subscription | null> {
  return authFetch<Subscription | null>(
    `/subscriptions/school/${schoolId}/active`
  );
}

export async function getSubscriptionHistory(
  schoolId: string
): Promise<Subscription[]> {
  return authFetch<Subscription[]>(
    `/subscriptions/school/${schoolId}/history`
  );
}

export async function initiateSubscription(
  planId: string,
  schoolId: string
): Promise<{ authorizationUrl: string; reference: string }> {
  return authFetch("/subscriptions/initiate", {
    method: "POST",
    body: { planId, schoolId },
  });
}

// ─────────────────────────────────────────────────────────────
// USERS / STAFF
// ─────────────────────────────────────────────────────────────

export async function getMe(): Promise<User> {
  return authFetch<User>("/users/me");
}

export async function getSchoolUsers(schoolId: string): Promise<User[]> {
  return authFetch<User[]>(`/users/school/${schoolId}`);
}

export async function inviteUser(
  data: InviteStaffPayload
): Promise<{ message: string; user: StaffMember }> {
  return authFetch("/users/invite", {
    method: "POST",
    body: data,
  });
}

export async function resendInvite(
  userId: string
): Promise<{ message: string }> {
  return authFetch(`/users/${userId}/resend-invite`, { method: "POST" });
}

export async function deactivateUser(userId: string): Promise<User> {
  return authFetch<User>(`/users/${userId}`, { method: "DELETE" });
}

export async function updateUser(
  userId: string,
  data: Partial<Pick<User, "firstName" | "lastName" | "phoneNumber">>
): Promise<User> {
  return authFetch<User>(`/users/${userId}`, {
    method: "PATCH",
    body: data,
  });
}

// ─────────────────────────────────────────────────────────────
// STAFF ASSIGNMENTS
// ─────────────────────────────────────────────────────────────

export async function assignStaff(
  data: AssignStaffPayload
): Promise<StaffAssignment> {
  return authFetch<StaffAssignment>("/staff/assign", {
    method: "POST",
    body: data,
  });
}

export async function getAssignmentsByClass(
  classId: string
): Promise<StaffAssignment[]> {
  return authFetch<StaffAssignment[]>(`/staff/by-class?classId=${classId}`);
}

export async function getAssignmentsByUser(
  userId: string
): Promise<StaffAssignment[]> {
  return authFetch<StaffAssignment[]>(`/staff/by-user?userId=${userId}`);
}

export async function removeAssignment(assignmentId: string): Promise<void> {
  return authFetch(`/staff/${assignmentId}`, { method: "DELETE" });
}

// ─────────────────────────────────────────────────────────────
// CLASSES
// ─────────────────────────────────────────────────────────────

export async function getClasses(schoolId: string): Promise<ClassSection[]> {
  return authFetch<ClassSection[]>(`/classes?schoolId=${schoolId}`);
}

export async function createClass(data: {
  name: string;
  description?: string;
  schoolId: string;
}): Promise<ClassSection> {
  return authFetch<ClassSection>("/classes", {
    method: "POST",
    body: data,
  });
}

export async function updateClass(
  classId: string,
  data: Partial<Pick<ClassSection, "name" | "description">>
): Promise<ClassSection> {
  return authFetch<ClassSection>(`/classes/${classId}`, {
    method: "PATCH",
    body: data,
  });
}

export async function deleteClass(classId: string): Promise<void> {
  return authFetch(`/classes/${classId}`, { method: "DELETE" });
}

// ─────────────────────────────────────────────────────────────
// SUBJECTS
// ─────────────────────────────────────────────────────────────

export async function getSubjects(classId: string): Promise<Subject[]> {
  return authFetch<Subject[]>(`/subjects?classId=${classId}`);
}

export async function createSubject(data: {
  name: string;
  classId: string;
  schoolId: string;
  maxCaScore?: number;
  maxExamScore?: number;
  description?: string;
}): Promise<Subject> {
  return authFetch<Subject>("/subjects", {
    method: "POST",
    body: data,
  });
}

export async function updateSubject(
  subjectId: string,
  data: Partial<Pick<Subject, "name" | "maxCaScore" | "maxExamScore" | "description">>
): Promise<Subject> {
  return authFetch<Subject>(`/subjects/${subjectId}`, {
    method: "PATCH",
    body: data,
  });
}

export async function deleteSubject(subjectId: string): Promise<void> {
  return authFetch(`/subjects/${subjectId}`, { method: "DELETE" });
}

// ─────────────────────────────────────────────────────────────
// GRADING SCHEMES
// ─────────────────────────────────────────────────────────────

export async function getGradingSchemes(
  schoolId: string
): Promise<GradingScheme[]> {
  return authFetch<GradingScheme[]>(`/grading?schoolId=${schoolId}`);
}

export async function createGradingScheme(data: {
  name: string;
  schoolId: string;
  bands: GradingScheme["bands"];
  isDefault?: boolean;
  description?: string;
}): Promise<GradingScheme> {
  return authFetch<GradingScheme>("/grading", {
    method: "POST",
    body: data,
  });
}

export async function setDefaultGradingScheme(
  schemeId: string
): Promise<GradingScheme> {
  return authFetch<GradingScheme>(`/grading/${schemeId}/set-default`, {
    method: "PATCH",
  });
}

export async function deleteGradingScheme(schemeId: string): Promise<void> {
  return authFetch(`/grading/${schemeId}`, { method: "DELETE" });
}

// ─────────────────────────────────────────────────────────────
// STUDENTS
// ─────────────────────────────────────────────────────────────

export async function getStudents(
  schoolId: string,
  classId?: string
): Promise<Student[]> {
  const params = new URLSearchParams({ schoolId });
  if (classId) params.set("classId", classId);
  return authFetch<Student[]>(`/students?${params.toString()}`);
}

export async function getStudent(studentId: string): Promise<Student> {
  return authFetch<Student>(`/students/${studentId}`);
}

export async function createStudent(
  data: Omit<Student, "id" | "createdAt" | "updatedAt" | "class" | "isActive">
): Promise<Student> {
  return authFetch<Student>("/students", {
    method: "POST",
    body: data,
  });
}

export async function updateStudent(
  studentId: string,
  data: Partial<Student>
): Promise<Student> {
  return authFetch<Student>(`/students/${studentId}`, {
    method: "PATCH",
    body: data,
  });
}

export async function deactivateStudent(studentId: string): Promise<Student> {
  return authFetch<Student>(`/students/${studentId}`, { method: "DELETE" });
}

export async function previewExcelImport(
  file: File
): Promise<Partial<Student>[]> {
  const form = new FormData();
  form.append("file", file);
  return authFetch<Partial<Student>[]>("/students/import/excel/preview", {
    method: "POST",
    body: form as unknown as Record<string, unknown>,
  });
}

export async function confirmStudentImport(
  schoolId: string,
  students: Partial<Student>[]
): Promise<{ imported: number }> {
  return authFetch<{ imported: number }>("/students/import/confirm", {
    method: "POST",
    body: { schoolId, students },
  });
}

// ─────────────────────────────────────────────────────────────
// ATTENDANCE
// ─────────────────────────────────────────────────────────────

export async function getAttendance(
  classId: string,
  date: string
): Promise<AttendanceRecord[]> {
  return authFetch<AttendanceRecord[]>(
    `/attendance?classId=${classId}&date=${date}`
  );
}

export async function submitAttendance(data: {
  classId: string;
  date: string;
  entries: AttendanceEntry[];
}): Promise<{ saved: number }> {
  return authFetch<{ saved: number }>("/attendance", {
    method: "POST",
    body: data,
  });
}

// ─────────────────────────────────────────────────────────────
// SCORES
// ─────────────────────────────────────────────────────────────

export async function getScoresBySubject(
  subjectId: string,
  term: ScoreTerm,
  academicYear: string
): Promise<Score[]> {
  const params = new URLSearchParams({ subjectId, term, academicYear });
  return authFetch<Score[]>(`/scores/by-subject?${params.toString()}`);
}

export async function getScoresByStudent(
  studentId: string,
  term: ScoreTerm,
  academicYear: string
): Promise<Score[]> {
  const params = new URLSearchParams({ studentId, term, academicYear });
  return authFetch<Score[]>(`/scores/by-student?${params.toString()}`);
}

export async function submitScores(data: {
  subjectId: string;
  term: ScoreTerm;
  academicYear: string;
  entries: { studentId: string; caScore: number; examScore: number }[];
}): Promise<{ saved: number }> {
  return authFetch<{ saved: number }>("/scores", {
    method: "POST",
    body: data,
  });
}

// ─────────────────────────────────────────────────────────────
// REPORTS
// ─────────────────────────────────────────────────────────────

export async function getReports(
  classId: string,
  term: ScoreTerm,
  academicYear: string
): Promise<Report[]> {
  const params = new URLSearchParams({ classId, term, academicYear });
  return authFetch<Report[]>(`/reports?${params.toString()}`);
}

export async function generateReports(data: {
  classId: string;
  term: ScoreTerm;
  academicYear: string;
}): Promise<{ generated: number }> {
  return authFetch<{ generated: number }>("/reports/generate", {
    method: "POST",
    body: data,
  });
}

export async function updateReportTeacherInput(
  reportId: string,
  data: {
    teacherComment?: string;
    conduct?: number;
    punctuality?: number;
    neatness?: number;
  }
): Promise<Report> {
  return authFetch<Report>(`/reports/${reportId}/teacher-input`, {
    method: "PATCH",
    body: data,
  });
}

export async function publishReports(
  classId: string,
  term: ScoreTerm,
  academicYear: string
): Promise<{ published: number }> {
  const params = new URLSearchParams({ classId, term, academicYear });
  return authFetch<{ published: number }>(
    `/reports/publish?${params.toString()}`,
    { method: "POST" }
  );
}

// ─────────────────────────────────────────────────────────────
// FEES & PAYMENTS
// ─────────────────────────────────────────────────────────────

export async function getFeeDashboard(
  schoolId: string,
  termLabel?: string
): Promise<FeeDashboardMetrics> {
  const params = new URLSearchParams({ schoolId });
  if (termLabel) params.set("termLabel", termLabel);
  return authFetch<FeeDashboardMetrics>(`/fees/dashboard?${params.toString()}`);
}

export async function getInvoices(
  schoolId: string,
  status?: string,
  termLabel?: string
): Promise<FeeInvoice[]> {
  const params = new URLSearchParams({ schoolId });
  if (status) params.set("status", status);
  if (termLabel) params.set("termLabel", termLabel);
  return authFetch<FeeInvoice[]>(`/fees/invoices?${params.toString()}`);
}

export async function getInvoice(invoiceId: string): Promise<FeeInvoice> {
  return authFetch<FeeInvoice>(`/fees/invoices/${invoiceId}`);
}

export async function createInvoice(data: {
  studentId: string;
  schoolId: string;
  termLabel: string;
  totalAmount: number;
  lineItems?: { label: string; amount: number }[];
}): Promise<FeeInvoice> {
  return authFetch<FeeInvoice>("/fees/invoices", {
    method: "POST",
    body: data,
  });
}

export async function getInvoicePayments(invoiceId: string): Promise<Payment[]> {
  return authFetch<Payment[]>(`/fees/invoices/${invoiceId}/payments`);
}

export async function recordPayment(data: {
  invoiceId: string;
  percentageToPay: number;
  paymentMethod?: string;
  reference?: string;
  recordedBy?: string;
  note?: string;
}): Promise<{ invoice: FeeInvoice; payment: Payment; receiptNumber: string }> {
  return authFetch("/fees/payments", {
    method: "POST",
    body: data,
  });
}

export function getReceiptUrl(paymentId: string): string {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "https://school-mgt-server.vercel.app/api/v1";
  return `${base}/fees/payments/${paymentId}/receipt`;
}

export async function getDunningConfig(
  schoolId: string
): Promise<DunningConfig | null> {
  return authFetch<DunningConfig | null>(`/fees/dunning/${schoolId}`);
}

export async function updateDunningConfig(
  schoolId: string,
  data: Partial<Pick<DunningConfig, "enabled" | "daysBeforeExam" | "emailTemplate">>
): Promise<DunningConfig> {
  return authFetch<DunningConfig>(`/fees/dunning/${schoolId}`, {
    method: "PATCH",
    body: data,
  });
}