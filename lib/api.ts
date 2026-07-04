/**
 * lib/api.ts
 *
 * Domain-level API functions. Every function here is a thin wrapper around
 * clientFetch from lib/client-fetch.ts. These run in the browser directly —
 * no Next.js server action routing.
 *
 * For auth actions that need to write cookies (login, logout, register),
 * use lib/actions/auth.ts instead.
 */

import { clientFetch } from "@/lib/client-fetch";
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
  FeeTemplate,
  FeeInvoice,
  LineItem,
  Payment,
  PaymentMethod,
  FeeDashboardMetrics,
  DunningConfig,
  AcademicSession,
  Term,
} from "@/types";

// ─────────────────────────────────────────────────────────────
// ACADEMIC SESSIONS
// ─────────────────────────────────────────────────────────────

export async function getSessions(schoolId: string): Promise<AcademicSession[]> {
  return clientFetch(`/academic-sessions?schoolId=${schoolId}`);
}

export async function getActiveAcademicSession(
  schoolId: string,
): Promise<AcademicSession | null> {
  return clientFetch<AcademicSession>(`/academic-sessions/active?schoolId=${schoolId}`).catch(() => null);
}

export async function createSession(data: {
  schoolId:     string;
  academicYear: string;
  currentTerm:  Term;
  startDate?:   string;
  endDate?:     string;
  notes?:       string;
}): Promise<AcademicSession> {
  return clientFetch("/academic-sessions", { method: "POST", body: data });
}

export async function activateSession(id: string): Promise<AcademicSession> {
  return clientFetch(`/academic-sessions/${id}/activate`, { method: "POST" });
}

export async function advanceTerm(id: string): Promise<AcademicSession> {
  return clientFetch(`/academic-sessions/${id}/advance-term`, { method: "POST" });
}

export async function updateSession(
  id:   string,
  data: Partial<Pick<AcademicSession, "academicYear" | "currentTerm" | "startDate" | "endDate" | "notes">>,
): Promise<AcademicSession> {
  return clientFetch(`/academic-sessions/${id}`, { method: "PATCH", body: data });
}

export async function previewPromotion(data: {
  schoolId:         string;
  mappings:         { fromClassId: string; toClassId: string }[];
  excludeStudentIds?: string[];
  newSessionId:     string;
}): Promise<{
  breakdown:     { fromClass: string; toClass: string; eligible: number; excluded: number }[];
  totalEligible: number;
}> {
  return clientFetch("/promotion/preview", { method: "POST", body: data });
}

export async function executePromotion(data: {
  schoolId:         string;
  mappings:         { fromClassId: string; toClassId: string }[];
  excludeStudentIds?: string[];
  newSessionId:     string;
}): Promise<{
  totalStudents: number;
  promoted:      number;
  excluded:      number;
  breakdown:     { fromClass: string; toClass: string; studentsCount: number }[];
  newSession:    { id: string; academicYear: string; currentTerm: string };
}> {
  return clientFetch("/promotion/execute", { method: "POST", body: data });
}

// ─────────────────────────────────────────────────────────────
// SCHOOL
// ─────────────────────────────────────────────────────────────

export async function getSchool(schoolId: string): Promise<School> {
  return clientFetch<School>(`/schools/${schoolId}`);
}

export async function updateSchool(
  schoolId: string,
  data: Partial<Pick<School, "name" | "address" | "phone" | "currencyCode">>
): Promise<School> {
  return clientFetch<School>(`/schools/${schoolId}`, {
    method: "PATCH",
    body: data,
  });
}

export async function uploadSchoolLogo(
  schoolId: string,
  file: File
): Promise<School> {
  const form = new FormData();
  form.append("logo", file);
  return clientFetch<School>(`/schools/${schoolId}/logo`, {
    method: "PATCH",
    body: form as unknown as Record<string, unknown>,
  });
}

export async function listBanks(): Promise<{ name: string; code: string; slug: string }[]> {
  return clientFetch("/schools/banks/list");
}

export async function verifyBankAccount(
  accountNumber: string,
  bankCode: string,
): Promise<{ accountName: string; accountNumber: string }> {
  return clientFetch(
    `/schools/banks/verify?accountNumber=${accountNumber}&bankCode=${bankCode}`,
  );
}

export async function saveBankAccount(
  schoolId:      string,
  accountNumber: string,
  bankCode:      string,
  bankName:      string,
  accountName:   string,
): Promise<School> {
  return clientFetch<School>(`/schools/${schoolId}/bank-account`, {
    method: "POST",
    body:   { accountNumber, bankCode, bankName, accountName },
  });
}

// ─────────────────────────────────────────────────────────────
// SUBSCRIPTIONS & PLANS
// ─────────────────────────────────────────────────────────────

export async function getPlans(billingCycle?: "monthly" | "annually"): Promise<Plan[]> {
  const params = billingCycle ? `?billingCycle=${billingCycle}` : "";
  return clientFetch<Plan[]>(`/subscriptions/plans${params}`);
}

export async function getActiveSubscription(
  schoolId: string
): Promise<Subscription | null> {
  return clientFetch<Subscription | null>(
    `/subscriptions/school/${schoolId}/active`
  );
}

export async function getSubscriptionHistory(
  schoolId: string
): Promise<Subscription[]> {
  return clientFetch<Subscription[]>(
    `/subscriptions/school/${schoolId}/history`
  );
}

export async function initiateSubscription(
  planId: string,
  schoolId: string
): Promise<{ authorizationUrl: string; reference: string }> {
  return clientFetch("/subscriptions/initiate", {
    method: "POST",
    body: { planId, schoolId },
  });
}

// ─────────────────────────────────────────────────────────────
// USERS / STAFF
// ─────────────────────────────────────────────────────────────

export async function getMe(): Promise<User> {
  return clientFetch<User>("/users/me");
}

export async function getSchoolUsers(schoolId: string): Promise<User[]> {
  return clientFetch<User[]>(`/users/school/${schoolId}`);
}

export async function inviteUser(
  data: InviteStaffPayload
): Promise<{ message: string; user: StaffMember }> {
  return clientFetch("/users/invite", {
    method: "POST",
    body: data,
  });
}

export async function resendInvite(
  userId: string
): Promise<{ message: string }> {
  return clientFetch(`/users/${userId}/resend-invite`, { method: "POST" });
}

export async function deactivateUser(userId: string): Promise<User> {
  return clientFetch<User>(`/users/${userId}`, { method: "DELETE" });
}

export async function updateUser(
  userId: string,
  data: Partial<Pick<User, "firstName" | "lastName" | "phoneNumber">>
): Promise<User> {
  return clientFetch<User>(`/users/${userId}`, {
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
  return clientFetch<StaffAssignment>("/staff/assign", {
    method: "POST",
    body: data,
  });
}

export async function getAssignmentsByClass(
  classId: string
): Promise<StaffAssignment[]> {
  return clientFetch<StaffAssignment[]>(`/staff/by-class?classId=${classId}`);
}

export async function getAssignmentsByUser(
  userId: string
): Promise<StaffAssignment[]> {
  return clientFetch<StaffAssignment[]>(`/staff/by-user?userId=${userId}`);
}

export async function removeAssignment(assignmentId: string): Promise<void> {
  return clientFetch(`/staff/${assignmentId}`, { method: "DELETE" });
}

// ─────────────────────────────────────────────────────────────
// CLASSES
// ─────────────────────────────────────────────────────────────

export async function getClasses(schoolId: string): Promise<ClassSection[]> {
  return clientFetch<ClassSection[]>(`/classes?schoolId=${schoolId}`);
}

export async function createClass(data: {
  name: string;
  description?: string;
  schoolId: string;
}): Promise<ClassSection> {
  return clientFetch<ClassSection>("/classes", {
    method: "POST",
    body: data,
  });
}

export async function updateClass(
  classId: string,
  data: Partial<Pick<ClassSection, "name" | "description">>
): Promise<ClassSection> {
  return clientFetch<ClassSection>(`/classes/${classId}`, {
    method: "PATCH",
    body: data,
  });
}

export async function deleteClass(classId: string): Promise<void> {
  return clientFetch(`/classes/${classId}`, { method: "DELETE" });
}

// ─────────────────────────────────────────────────────────────
// SUBJECTS
// ─────────────────────────────────────────────────────────────

export async function getSubjects(classId: string): Promise<Subject[]> {
  return clientFetch<Subject[]>(`/subjects?classId=${classId}`);
}

export async function createSubject(data: {
  name: string;
  classId: string;
  schoolId: string;
  maxCaScore?: number;
  maxExamScore?: number;
  description?: string;
}): Promise<Subject> {
  return clientFetch<Subject>("/subjects", {
    method: "POST",
    body: data,
  });
}

export async function updateSubject(
  subjectId: string,
  data: Partial<Pick<Subject, "name" | "maxCaScore" | "maxExamScore" | "description">>
): Promise<Subject> {
  return clientFetch<Subject>(`/subjects/${subjectId}`, {
    method: "PATCH",
    body: data,
  });
}

export async function deleteSubject(subjectId: string): Promise<void> {
  return clientFetch(`/subjects/${subjectId}`, { method: "DELETE" });
}

// ─────────────────────────────────────────────────────────────
// GRADING SCHEMES
// ─────────────────────────────────────────────────────────────

export async function getGradingSchemes(
  schoolId: string
): Promise<GradingScheme[]> {
  return clientFetch<GradingScheme[]>(`/grading?schoolId=${schoolId}`);
}

export async function createGradingScheme(data: {
  name: string;
  schoolId: string;
  bands: GradingScheme["bands"];
  isDefault?: boolean;
  description?: string;
}): Promise<GradingScheme> {
  return clientFetch<GradingScheme>("/grading", {
    method: "POST",
    body: data,
  });
}

export async function updateGradingScheme(
  schemeId: string,
  data: { name?: string; bands?: GradingScheme["bands"] }
): Promise<GradingScheme> {
  return clientFetch<GradingScheme>(`/grading/${schemeId}`, {
    method: "PATCH",
    body:   data,
  });
}

export async function setDefaultGradingScheme(
  schemeId: string
): Promise<GradingScheme> {
  return clientFetch<GradingScheme>(`/grading/${schemeId}/set-default`, {
    method: "PATCH",
  });
}

export async function deleteGradingScheme(schemeId: string): Promise<void> {
  return clientFetch(`/grading/${schemeId}`, { method: "DELETE" });
}

// ─────────────────────────────────────────────────────────────
// STUDENTS
// ─────────────────────────────────────────────────────────────

export async function getStudents(
  schoolId:        string,
  classId?:        string,
  includeInactive?: boolean,
): Promise<Student[]> {
  const params = new URLSearchParams({ schoolId });
  if (classId)        params.set("classId", classId);
  if (includeInactive) params.set("includeInactive", "true");
  return clientFetch<Student[]>(`/students?${params.toString()}`);
}

export async function getStudent(studentId: string): Promise<Student> {
  return clientFetch<Student>(`/students/${studentId}`);
}

export async function createStudent(
  data: Omit<Student, "id" | "createdAt" | "updatedAt" | "class" | "isActive">
): Promise<Student> {
  return clientFetch<Student>("/students", {
    method: "POST",
    body: data,
  });
}

export async function updateStudent(
  studentId: string,
  data: Partial<Student>
): Promise<Student> {
  return clientFetch<Student>(`/students/${studentId}`, {
    method: "PATCH",
    body: data,
  });
}

export async function graduateClass(
  classId:        string,
  schoolId:       string,
  graduationYear: number,
): Promise<{ graduated: number; alumniClassId: string }> {
  return clientFetch(
    `/students/graduate-class?classId=${classId}&schoolId=${schoolId}&graduationYear=${graduationYear}`,
    { method: "POST" },
  );
}

export async function deactivateStudent(studentId: string): Promise<Student> {
  return clientFetch<Student>(`/students/${studentId}`, { method: "DELETE" });
}

export async function previewExcelImport(
  file: File
): Promise<Partial<Student>[]> {
  const form = new FormData();
  form.append("file", file);
  return clientFetch<Partial<Student>[]>("/students/import/excel/preview", {
    method: "POST",
    body: form as unknown as Record<string, unknown>,
  });
}

export async function confirmStudentImport(
  schoolId: string,
  students: Partial<Student>[]
): Promise<{ imported: number }> {
  return clientFetch<{ imported: number }>("/students/import/confirm", {
    method: "POST",
    body: { schoolId, students },
  });
}

// ─────────────────────────────────────────────────────────────
// ATTENDANCE
// ─────────────────────────────────────────────────────────────

export interface ActiveSessionInfo {
  session:         "morning" | "afternoon";
  isMorningLocked: boolean;
  currentHour:     number;
  morningClosesAt: number;
}

export interface DailyAttendanceSummary {
  studentId:  string;
  student:    Student;
  morning?:   AttendanceRecord;
  afternoon?: AttendanceRecord;
}

export async function getActiveSession(): Promise<ActiveSessionInfo> {
  return clientFetch<ActiveSessionInfo>("/attendance/session/active");
}

export async function getDailySummary(
  classId: string,
  date: string,
): Promise<DailyAttendanceSummary[]> {
  // Fetch both sessions in parallel and merge on the frontend.
  // Once the backend /attendance/daily endpoint is deployed this can be
  // replaced with a single call to that endpoint.
  const [morning, afternoon] = await Promise.all([
    clientFetch<AttendanceRecord[]>(
      `/attendance?classId=${classId}&date=${date}&session=morning`,
    ).catch(() => [] as AttendanceRecord[]),
    clientFetch<AttendanceRecord[]>(
      `/attendance?classId=${classId}&date=${date}&session=afternoon`,
    ).catch(() => [] as AttendanceRecord[]),
  ]);

  const map = new Map<string, DailyAttendanceSummary>();

  for (const record of morning) {
    map.set(record.studentId, {
      studentId: record.studentId,
      student:   record.student,
      morning:   record,
    });
  }

  for (const record of afternoon) {
    if (map.has(record.studentId)) {
      map.get(record.studentId)!.afternoon = record;
    } else {
      map.set(record.studentId, {
        studentId: record.studentId,
        student:   record.student,
        afternoon: record,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    a.student.lastName.localeCompare(b.student.lastName),
  );
}

export async function getAttendance(
  classId: string,
  date: string,
  session: "morning" | "afternoon",
): Promise<AttendanceRecord[]> {
  return clientFetch<AttendanceRecord[]>(
    `/attendance?classId=${classId}&date=${date}&session=${session}`,
  );
}

export async function submitAttendance(data: {
  classId: string;
  date: string;
  session?: "morning" | "afternoon";
  entries: AttendanceEntry[];
}): Promise<{ saved: number; session: string }> {
  // Strip session from the body — the backend auto-detects it from server time.
  // Remove this once the updated DTO is deployed and verified.
  const { session: _session, ...rest } = data;
  return clientFetch<{ saved: number; session: string }>("/attendance", {
    method: "POST",
    body: rest,
  });
}

export async function getAttendanceStats(
  classId: string,
  from: string,
  to: string,
): Promise<
  {
    studentId:        string;
    morningPresent:   number;
    morningAbsent:    number;
    morningLate:      number;
    afternoonPresent: number;
    afternoonAbsent:  number;
    afternoonLate:    number;
  }[]
> {
  const params = new URLSearchParams({ classId, from, to });
  return clientFetch(`/attendance/stats?${params.toString()}`);
}

// ─────────────────────────────────────────────────────────────
// SCORES
// ─────────────────────────────────────────────────────────────

export async function getClassRoster(
  subjectId:    string,
  classId:      string,
  schoolId:     string,
  term?:        string,
  academicYear?: string,
): Promise<{
  studentId:       string;
  firstName:       string;
  lastName:        string;
  admissionNumber: string | null;
  caScore:         number | null;
  examScore:       number | null;
  totalScore:      number | null;
  grade:           string | null;
}[]> {
  const params = new URLSearchParams({ subjectId, classId, schoolId });
  if (term)         params.set("term", term);
  if (academicYear) params.set("academicYear", academicYear);
  return clientFetch(`/scores/class-roster?${params.toString()}`);
}

export async function getScoresBySubject(
  subjectId: string,
  schoolId:  string,
): Promise<Score[]> {
  // term and academicYear omitted — backend auto-resolves from active session
  const params = new URLSearchParams({ subjectId, schoolId });
  return clientFetch<Score[]>(`/scores/by-subject?${params.toString()}`);
}

export async function getScoresByStudent(
  studentId: string,
  schoolId:  string,
): Promise<Score[]> {
  const params = new URLSearchParams({ studentId, schoolId });
  return clientFetch<Score[]>(`/scores/by-student?${params.toString()}`);
}

export async function submitScores(data: {
  subjectId: string;
  schoolId:  string;
  entries:   { studentId: string; caScore: number; examScore: number }[];
}): Promise<{ saved: number; term: string; academicYear: string }> {
  return clientFetch("/scores", { method: "POST", body: data });
}

// ─────────────────────────────────────────────────────────────
// REPORTS
// ─────────────────────────────────────────────────────────────

export async function getReports(
  classId:       string,
  schoolId:      string,
  term?:         string,
  academicYear?: string,
): Promise<Report[]> {
  const params = new URLSearchParams({ classId, schoolId });
  // Only pass term/year for historical sessions — omit to use active session
  if (term)         params.set("term",         term);
  if (academicYear) params.set("academicYear", academicYear);
  return clientFetch<Report[]>(`/reports?${params.toString()}`);
}

export async function generateReports(data: {
  classId:  string;
  schoolId: string;
}): Promise<{ generated: number; term: string; academicYear: string }> {
  return clientFetch("/reports/generate", { method: "POST", body: data });
}

export async function updateReportTeacherInput(
  reportId: string,
  data: {
    teacherComment?: string;
    conduct?:        number;
    punctuality?:    number;
    neatness?:       number;
  },
): Promise<Report> {
  return clientFetch<Report>(`/reports/${reportId}/teacher-input`, {
    method: "PATCH",
    body:   data,
  });
}

export async function publishReports(
classId: string, schoolId: string, p0: any,
): Promise<{ published: number; emailsSent: number }> {
  const params = new URLSearchParams({ classId, schoolId });
  return clientFetch(`/reports/publish?${params.toString()}`, { method: "POST" });
}

// ─────────────────────────────────────────────────────────────
// FEES & PAYMENTS
// ─────────────────────────────────────────────────────────────

// ── Templates ─────────────────────────────────────────────────

export async function getFeeTemplates(schoolId: string): Promise<FeeTemplate[]> {
  return clientFetch<FeeTemplate[]>(`/fees/templates?schoolId=${schoolId}`);
}

export async function createFeeTemplate(data: {
  schoolId:    string;
  classId?:    string;
  termLabel:   string;
  lineItems:   LineItem[];
  description?: string;
}): Promise<FeeTemplate> {
  return clientFetch<FeeTemplate>("/fees/templates", {
    method: "POST",
    body:   data,
  });
}

export async function generateInvoicesFromTemplate(
  templateId: string
): Promise<{ generated: number; skipped: number }> {
  return clientFetch(`/fees/templates/${templateId}/generate-invoices`, {
    method: "POST",
  });
}

// ── Invoices ──────────────────────────────────────────────────

export async function getFeeDashboard(
  schoolId:   string,
  termLabel?: string,
): Promise<FeeDashboardMetrics> {
  const params = new URLSearchParams({ schoolId });
  if (termLabel) params.set("termLabel", termLabel);
  return clientFetch<FeeDashboardMetrics>(`/fees/dashboard?${params.toString()}`);
}

export async function getInvoices(
  schoolId:   string,
  status?:    string,
  termLabel?: string,
): Promise<FeeInvoice[]> {
  const params = new URLSearchParams({ schoolId });
  if (status)    params.set("status",    status);
  if (termLabel) params.set("termLabel", termLabel);
  return clientFetch<FeeInvoice[]>(`/fees/invoices?${params.toString()}`);
}

export async function getInvoice(invoiceId: string): Promise<FeeInvoice> {
  return clientFetch<FeeInvoice>(`/fees/invoices/${invoiceId}`);
}

export async function createInvoice(data: {
  studentId:   string;
  schoolId:    string;
  termLabel:   string;
  totalAmount: number;
  lineItems?:  LineItem[];
}): Promise<FeeInvoice> {
  return clientFetch<FeeInvoice>("/fees/invoices", {
    method: "POST",
    body:   data,
  });
}

export async function getInvoicePayments(invoiceId: string): Promise<Payment[]> {
  return clientFetch<Payment[]>(`/fees/invoices/${invoiceId}/payments`);
}

// ── Payments ──────────────────────────────────────────────────

export async function recordPayment(data: {
  invoiceId:     string;
  amount:        number;
  paymentMethod: PaymentMethod;
  reference?:    string;
  recordedBy?:   string;
  note?:         string;
}): Promise<{ invoice: FeeInvoice; payment: Payment; receiptNumber: string }> {
  return clientFetch("/fees/payments", {
    method: "POST",
    body:   data,
  });
}

export function getReceiptUrl(paymentId: string): string {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "https://school-mgt-server.vercel.app/api/v1";
  return `${base}/fees/payments/${paymentId}/receipt`;
}

// ── Reminders ─────────────────────────────────────────────────

export async function sendFeeReminders(
  schoolId: string,
): Promise<{ sent: number }> {
  return clientFetch(`/fees/reminders/${schoolId}`, { method: "POST" });
}

// ── Dunning config ─────────────────────────────────────────────

export async function getDunningConfig(
  schoolId: string,
): Promise<DunningConfig | null> {
  return clientFetch<DunningConfig | null>(`/fees/dunning/${schoolId}`);
}

export async function updateDunningConfig(
  schoolId: string,
  data: Partial<Pick<DunningConfig, "enabled" | "daysBeforeExam" | "emailTemplate">>,
): Promise<DunningConfig> {
  return clientFetch<DunningConfig>(`/fees/dunning/${schoolId}`, {
    method: "PATCH",
    body:   data,
  });
}

export interface FullReportCard {
  report: import("@/types").Report & {
    student: import("@/types").Student;
    class:   import("@/types").ClassSection;
  };
  scores: (import("@/types").Score & {
    subject: import("@/types").Subject;
  })[];
  classSize:       number;
  classHighest:    number;
  classLowest:     number;
  classAverage:    number;
  totalObtained:   number;
  totalObtainable: number;
}

export async function getReportFull(reportId: string): Promise<FullReportCard> {
  return clientFetch<FullReportCard>(`/reports/${reportId}/full`);
}