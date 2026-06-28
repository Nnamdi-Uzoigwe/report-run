import { apiClient, setTokens, clearTokens } from "@/lib/api-client";
import {
  mockUser, mockSchool, mockStaff, mockDutyAssignments,
  mockStudents, mockClasses, mockSubjects, mockResults,
  mockPayments, mockFeeCategories, mockReminderConfigs,
  mockMessages, mockDashboardMetrics, mockSchoolSettings,
} from "@/lib/mock-data";

import type {
  User, StaffMember, DutyAssignment, Student, Class,
  Subject, Result, Payment, FeeCategory, ReminderConfig,
  Message, DashboardMetrics, SchoolSettings, LoginCredentials,
  ContactFormData,
} from "@/types";

const delay = (ms = 600) => new Promise((res) => setTimeout(res, ms));

// ── Auth ──────────────────────────────────────────────────────
// ── Auth ──────────────────────────────────────────────────────

interface AuthResponse {
  accessToken:  string;
  refreshToken: string;
  user: {
    id:               string;
    firstName:        string;
    lastName?:        string;
    email:            string;
    role:             string;
    schoolId:         string;
    isEmailVerified:  boolean;
  };
}

export async function login(credentials: LoginCredentials): Promise<User> {
  const res = await apiClient.post<AuthResponse>("/auth/login", {
    email:    credentials.email,
    password: credentials.password,
  }, { skipAuth: true });

  setTokens(res.accessToken, res.refreshToken);

  return {
    id:          res.user.id,
    email:       res.user.email,
    firstName:   res.user.firstName,
    lastName:    res.user.lastName ?? "",
    role:        res.user.role as User["role"],
    schoolId:    res.user.schoolId,
    createdAt:   new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };
}

export async function logout(): Promise<void> {
  try {
    await apiClient.post("/auth/logout");
  } finally {
    clearTokens();
  }
}

// ── Dashboard ─────────────────────────────────────────────────
export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  await delay();
  return mockDashboardMetrics;
}

// ── Staff ─────────────────────────────────────────────────────
export async function fetchStaff(): Promise<StaffMember[]> {
  await delay();
  return mockStaff;
}

export async function fetchStaffMember(id: string): Promise<StaffMember> {
  await delay();
  const member = mockStaff.find((s) => s.id === id);
  if (!member) throw new Error("Staff member not found.");
  return member;
}

export async function createStaffMember(data: Omit<StaffMember, "id">): Promise<StaffMember> {
  await delay();
  return { ...data, id: `stf_${Date.now()}` };
}

export async function updateStaffMember(id: string, data: Partial<StaffMember>): Promise<StaffMember> {
  await delay();
  const member = mockStaff.find((s) => s.id === id);
  if (!member) throw new Error("Staff member not found.");
  return { ...member, ...data };
}

// ── Duty Assignments ──────────────────────────────────────────
export async function fetchDutyAssignments(): Promise<DutyAssignment[]> {
  await delay();
  return mockDutyAssignments;
}

export async function createDutyAssignment(data: Omit<DutyAssignment, "id">): Promise<DutyAssignment> {
  await delay();
  return { ...data, id: `duty_${Date.now()}` };
}

export async function deleteDutyAssignment(id: string): Promise<void> {
  await delay();
  console.log(`Deleted duty assignment ${id}`);
}

// ── Students ──────────────────────────────────────────────────
export async function fetchStudents(): Promise<Student[]> {
  await delay();
  return mockStudents;
}

export async function fetchStudent(id: string): Promise<Student> {
  await delay();
  const student = mockStudents.find((s) => s.id === id);
  if (!student) throw new Error("Student not found.");
  return student;
}

export async function createStudent(data: Omit<Student, "id">): Promise<Student> {
  await delay();
  return { ...data, id: `stu_${Date.now()}` };
}

export async function updateStudent(id: string, data: Partial<Student>): Promise<Student> {
  await delay();
  const student = mockStudents.find((s) => s.id === id);
  if (!student) throw new Error("Student not found.");
  return { ...student, ...data };
}

// ── Classes ───────────────────────────────────────────────────
export async function fetchClasses(): Promise<Class[]> {
  await delay();
  return mockClasses;
}

export async function fetchClass(id: string): Promise<Class> {
  await delay();
  const cls = mockClasses.find((c) => c.id === id);
  if (!cls) throw new Error("Class not found.");
  return cls;
}

// ── Subjects ──────────────────────────────────────────────────
export async function fetchSubjects(): Promise<Subject[]> {
  await delay();
  return mockSubjects;
}

// ── Results ───────────────────────────────────────────────────
export async function fetchResults(studentId?: string): Promise<Result[]> {
  await delay();
  if (studentId) return mockResults.filter((r) => r.studentId === studentId);
  return mockResults;
}

export async function upsertResult(data: Omit<Result, "id">): Promise<Result> {
  await delay();
  return { ...data, id: `res_${Date.now()}` };
}

// ── Payments ──────────────────────────────────────────────────
export async function fetchPayments(): Promise<Payment[]> {
  await delay();
  return mockPayments;
}

export async function fetchFeeCategories(): Promise<FeeCategory[]> {
  await delay();
  return mockFeeCategories;
}

export async function recordPayment(data: Partial<Payment>): Promise<Payment> {
  await delay();
  const base = mockPayments.find((p) => p.studentId === data.studentId);
  if (!base) throw new Error("Payment record not found.");
  return { ...base, ...data, id: `pay_${Date.now()}` };
}

// ── Reminders ─────────────────────────────────────────────────
export async function fetchReminderConfigs(): Promise<ReminderConfig[]> {
  await delay();
  return mockReminderConfigs;
}

export async function upsertReminderConfig(data: Partial<ReminderConfig>): Promise<ReminderConfig> {
  await delay();
  const base = mockReminderConfigs.find((r) => r.id === data.id);
  if (base) return { ...base, ...data };
  return {
    id: `rem_${Date.now()}`,
    feeCategoryId: data.feeCategoryId ?? "",
    feeCategoryName: data.feeCategoryName ?? "",
    channel: data.channel ?? "both",
    triggerDaysBefore: data.triggerDaysBefore ?? 7,
    message: data.message ?? "",
    isActive: data.isActive ?? true,
  };
}

// ── Messages ──────────────────────────────────────────────────
export async function fetchMessages(): Promise<Message[]> {
  await delay();
  return mockMessages;
}

export async function sendMessage(data: Partial<Message>): Promise<Message> {
  await delay();
  return {
    id: `msg_${Date.now()}`,
    subject: data.subject ?? "",
    body: data.body ?? "",
    channel: data.channel ?? "email",
    recipients: data.recipients ?? [{ type: "all" }],
    recipientCount: data.recipientCount ?? 0,
    status: "sent",
    sentAt: new Date().toISOString(),
    createdBy: mockUser.firstName + " " + mockUser.lastName,
    createdAt: new Date().toISOString(),
  };
}

// ── Settings ──────────────────────────────────────────────────
export async function fetchSettings(): Promise<SchoolSettings> {
  await delay();
  return mockSchoolSettings;
}

export async function updateSettings(data: Partial<SchoolSettings>): Promise<SchoolSettings> {
  await delay();
  return { ...mockSchoolSettings, ...data };
}

// ── Public / Contact ──────────────────────────────────────────
export async function submitContactForm(data: ContactFormData): Promise<void> {
  await delay(800);
  console.log("Contact form submitted:", data);
}