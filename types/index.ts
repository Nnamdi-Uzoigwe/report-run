// ============================================================
// GLOBAL / SHARED
// ============================================================

export type Status = "active" | "inactive" | "pending" | "archived";


export type UserRole =
  | "super_admin"
  | "admin"
  | "teacher"
  | "accountant"
  | "parent";

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface SelectOption {
  label: string;
  value: string;
}

// ============================================================
// AUTH
// ============================================================

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatarUrl?: string;
  schoolId: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SetupFormData {
  schoolName: string;
  schoolAddress: string;
  schoolPhone: string;
  schoolEmail: string;
  principalName: string;
  adminEmail: string;
  adminPassword: string;
  confirmPassword: string;
  term: string;
  session: string;
}

// ============================================================
// SCHOOL
// ============================================================

export interface School {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  logoUrl?: string;
  currentTerm: string;
  currentSession: string;
  createdAt: string;
}

// ============================================================
// STAFF
// ============================================================

export interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  subject?: string;
  classAssigned?: string;
  status: Status;
  joinDate: string;
  avatarUrl?: string;
}

export interface DutyAssignment {
  id: string;
  staffId: string;
  staffName: string;
  dutyType: DutyType;
  location: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  term: string;
  session: string;
}

export type DutyType =
  | "morning_assembly"
  | "gate_duty"
  | "cafeteria"
  | "exam_supervision"
  | "extracurricular"
  | "sanitation"
  | "library";

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday";

// ============================================================
// STUDENTS
// ============================================================

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  admissionNumber: string;
  classId: string;
  className: string;
  sectionId?: string;
  sectionName?: string;
  gender: "male" | "female";
  dateOfBirth: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  address: string;
  status: Status;
  admissionDate: string;
  avatarUrl?: string;
}

export interface ScrapedStudentResult {
  studentName: string;
  admissionNumber: string;
  subjects: ScrapedSubjectResult[];
  totalScore: number;
  average: number;
  grade: string;
  position: number;
  term: string;
  session: string;
}

export interface ScrapedSubjectResult {
  subject: string;
  ca: number;
  exam: number;
  total: number;
  grade: string;
  remark: string;
}

// ============================================================
// CLASSES & SECTIONS
// ============================================================

export interface Class {
  id: string;
  name: string;
  level: number;
  sections: Section[];
  studentCount: number;
  formTeacherId?: string;
  formTeacherName?: string;
}

export interface Section {
  id: string;
  classId: string;
  name: string;
  studentCount: number;
  formTeacherId?: string;
  formTeacherName?: string;
}

// ============================================================
// ACADEMICS & RESULTS
// ============================================================

export interface Subject {
  id: string;
  name: string;
  code: string;
  classIds: string[];
  teacherId?: string;
  teacherName?: string;
}

export interface Result {
  id: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  ca: number;
  exam: number;
  total: number;
  grade: string;
  remark: string;
  term: string;
  session: string;
  publishedAt?: string;
}

export interface GradeScale {
  id: string;
  label: string;
  minScore: number;
  maxScore: number;
  remark: string;
}

// ============================================================
// COLLECTIONS / FEES
// ============================================================

export type PaymentStatus = "paid" | "partial" | "unpaid" | "waived";
export type PaymentMethod = "cash" | "bank_transfer" | "pos" | "online";

export interface FeeCategory {
  id: string;
  name: string;
  amount: number;
  term: string;
  session: string;
  classIds: string[];
  dueDate: string;
}

export interface Payment {
  id: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  className: string;
  feeCategoryId: string;
  feeCategoryName: string;
  amountDue: number;
  amountPaid: number;
  balance: number;
  status: PaymentStatus;
  method?: PaymentMethod;
  paidAt?: string;
  receiptNumber?: string;
  term: string;
  session: string;
}

export interface ReminderConfig {
  id: string;
  feeCategoryId: string;
  feeCategoryName: string;
  channel: "sms" | "email" | "both";
  triggerDaysBefore: number;
  message: string;
  isActive: boolean;
}

// ============================================================
// COMMUNICATION
// ============================================================

export type MessageChannel = "sms" | "email" | "push";
export type MessageStatus = "draft" | "sent" | "failed" | "scheduled";

export interface Message {
  id: string;
  subject: string;
  body: string;
  channel: MessageChannel;
  recipients: MessageRecipient[];
  recipientCount: number;
  status: MessageStatus;
  scheduledAt?: string;
  sentAt?: string;
  createdBy: string;
  createdAt: string;
}

export interface MessageRecipient {
  type: "all" | "class" | "individual";
  classId?: string;
  studentIds?: string[];
}

// ============================================================
// DASHBOARD METRICS
// ============================================================

export interface DashboardMetrics {
  totalStudents: number;
  totalStaff: number;
  collectionRate: number;
  pendingFees: number;
  activeClasses: number;
  recentPayments: Payment[];
  attendanceSummary: AttendanceSummary;
  feeCollectionByMonth: MonthlyCollection[];
}

export interface AttendanceSummary {
  present: number;
  absent: number;
  late: number;
  total: number;
}

export interface MonthlyCollection {
  month: string;
  collected: number;
  expected: number;
}

// ============================================================
// SETTINGS
// ============================================================

export interface SchoolSettings {
  school: School;
  gradeScales: GradeScale[];
  terms: TermConfig[];
  notificationPreferences: NotificationPreferences;
}

export interface TermConfig {
  id: string;
  name: string;
  session: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface NotificationPreferences {
  emailOnPayment: boolean;
  smsOnPayment: boolean;
  emailOnResult: boolean;
  reminderLeadDays: number;
}

// ============================================================
// CONTACT / PUBLIC FORMS
// ============================================================

export interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  schoolName?: string;
  message: string;
  subject: string;
}