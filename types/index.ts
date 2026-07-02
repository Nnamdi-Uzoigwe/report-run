// ─────────────────────────────────────────────────────────────
// SHARED PRIMITIVES
// ─────────────────────────────────────────────────────────────

export type Status = "active" | "inactive" | "pending" | "archived";

export interface SelectOption {
  label: string;
  value: string;
}

export interface PaginatedResponse<T> {
  data:       T[];
  total:      number;
  page:       number;
  pageSize:   number;
  totalPages: number;
}

// Standard envelope the backend wraps every response in
export interface ApiEnvelope<T> {
  success:   boolean;
  data:      T;
  timestamp: string;
}

// Standard error shape the backend returns on non-2xx
export interface ApiErrorBody {
  statusCode: number;
  message:    string | string[];
  error:      string;
  timestamp:  string;
  path:       string;
}

// ─────────────────────────────────────────────────────────────
// AUTH & USERS
// ─────────────────────────────────────────────────────────────

// Must stay in sync with the UserRole enum in the backend
export type UserRole =
  | "super_admin"
  | "admin"
  | "bursar"
  | "teacher"
  | "parent";

export type InviteStatus = "pending" | "accepted";

export type AuthProvider = "local" | "google";

// The user object as it comes back from the API
export interface User {
  id:              string;
  firstName:       string;
  lastName:        string;
  email:           string;
  role:            UserRole;
  schoolId:        string | null;
  avatarUrl?:      string;
  phoneNumber?:    string;
  isActive:        boolean;
  isEmailVerified: boolean;
  inviteStatus:    InviteStatus | null;
  authProvider:    AuthProvider;
  createdAt:       string;
  updatedAt:       string;
  lastLoginAt?:    any;
}

export interface LoginCredentials {
  email:    string;
  password: string;
}

export interface RegisterPayload {
  firstName:    string;
  lastName:     string;
  email:        string;
  password:     string;
  schoolName:   string;
  currencyCode: string;
  address?:     string;
  phone?:       string;
}

// What the backend returns on login / register / accept-invite
export interface AuthResponse {
  accessToken:  string;
  refreshToken: string;
  user:         User;
}

export interface TokenPair {
  accessToken:  string;
  refreshToken: string;
}

// ─────────────────────────────────────────────────────────────
// SCHOOL
// ─────────────────────────────────────────────────────────────

export interface School {
  id:           string;
  name:         string;
  currencyCode: string;
  adminEmail:   string;
  logoUrl?:     string;
  address?:     string;
  phone?:       string;
  isActive:     boolean;
  createdAt:    string;
  updatedAt:    string;
}

// ─────────────────────────────────────────────────────────────
// SUBSCRIPTIONS & PLANS
// ─────────────────────────────────────────────────────────────

export type BillingCycle = "monthly" | "termly" | "annually";

export type SubscriptionStatus = "pending" | "active" | "expired" | "cancelled";

export interface Plan {
  id:                 string;
  name:               string;
  slug:               string;
  description?:       string;
  priceKobo:          number;
  billingCycle:       BillingCycle;
  studentLimit:       number | null;
  staffLimit:         number | null;
  features:           string[];
  highlights:         string[];
  sortOrder:          number;
  isActive:           boolean;
  isCustom:           boolean;
  paystackPlanCode?:  string;
  createdAt:          string;
  updatedAt:          string;
}

export interface Subscription {
  id:                    string;
  schoolId:              string;
  planId:                string;
  plan:                  Plan;
  status:                SubscriptionStatus;
  paystackReference?:    string;
  paystackTransactionId?: string;
  amountPaidKobo:        number;
  startsAt?:             string;
  expiresAt?:            string;
  createdAt:             string;
  updatedAt:             string;
}

// ─────────────────────────────────────────────────────────────
// STAFF
// ─────────────────────────────────────────────────────────────

export interface StaffMember {
  id:           string;
  firstName:    string;
  lastName:     string;
  email:        string;
  role:         UserRole;
  phoneNumber?: string;
  isActive:     boolean;
  inviteStatus: InviteStatus | null;
  schoolId:     string | null;
  createdAt:    string;
}

export interface StaffAssignment {
  id:            string;
  userId:        string;
  user:          StaffMember;
  classId:       string;
  class:         ClassSection;
  isClassTeacher: boolean;
  subjects:      Subject[];
  createdAt:     string;
  updatedAt:     string;
}

export interface InviteStaffPayload {
  firstName:    string;
  lastName:     string;
  email:        string;
  role:         "teacher" | "bursar" | "admin";
  phoneNumber?: string;
  schoolId:     string;
}

export interface AssignStaffPayload {
  userId:        string;
  classId:       string;
  isClassTeacher?: boolean;
  subjectIds?:   string[];
}

// ─────────────────────────────────────────────────────────────
// CLASSES & SUBJECTS
// ─────────────────────────────────────────────────────────────

export interface ClassSection {
  id:          string;
  name:        string;
  description?: string;
  schoolId:    string;
  createdAt:   string;
  updatedAt:   string;
}

export interface Subject {
  id:           string;
  name:         string;
  description?: string;
  maxCaScore:   number;
  maxExamScore: number;
  classId:      string;
  schoolId:     string;
  createdAt:    string;
  updatedAt:    string;
}

// ─────────────────────────────────────────────────────────────
// STUDENTS
// ─────────────────────────────────────────────────────────────

export type Gender     = "male" | "female" | "other";
export type BloodGroup = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";

export interface Student {
  id:                     string;
  firstName:              string;
  middleName?:            string;
  lastName:               string;
  admissionNumber?:       string;
  dateOfBirth?:           string;
  gender?:                Gender;
  bloodGroup?:            BloodGroup;
  nationality?:           string;
  stateOfOrigin?:         string;
  religion?:              string;
  photoUrl?:              string;
  addressLine1?:          string;
  addressLine2?:          string;
  city?:                  string;
  state?:                 string;
  country?:               string;
  allergies?:             string;
  medicalConditions?:     string;
  emergencyContact?:      string;
  parentEmail:            string;
  parentPhone:            string;
  parentName?:            string;
  parentRelationship?:    string;
  secondaryGuardianName?: string;
  secondaryGuardianPhone?: string;
  admissionDate?:         string;
  previousSchool?:        string;
  schoolId:               string;
  classId?:               string;
  class?:                 ClassSection;
  isActive:               boolean;
  createdAt:              string;
  updatedAt:              string;
}

// ─────────────────────────────────────────────────────────────
// ATTENDANCE
// ─────────────────────────────────────────────────────────────

export type AttendanceStatus = "present" | "absent" | "late";

export interface AttendanceRecord {
  id:        string;
  studentId: string;
  student:   Student;
  classId:   string;
  status:    AttendanceStatus;
  date:      string;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceEntry {
  studentId: string;
  status:    AttendanceStatus;
}

// ─────────────────────────────────────────────────────────────
// SCORES & GRADING
// ─────────────────────────────────────────────────────────────

export type ScoreTerm = "first" | "second" | "third";

export interface Score {
  id:          string;
  studentId:   string;
  student:     Student;
  subjectId:   string;
  subject:     Subject;
  caScore:     number;
  examScore:   number;
  totalScore:  number;
  grade:       string;
  term:        ScoreTerm;
  academicYear: string;
  createdAt:   string;
  updatedAt:   string;
}

export interface GradeBand {
  grade:    string;
  minScore: number;
  maxScore: number;
  remark?:  string;
}

export interface GradingScheme {
  id:          string;
  name:        string;
  description?: string;
  bands:       GradeBand[];
  isDefault:   boolean;
  schoolId:    string;
  createdAt:   string;
  updatedAt:   string;
}

// ─────────────────────────────────────────────────────────────
// REPORTS
// ─────────────────────────────────────────────────────────────

export type ReportStatus = "draft" | "published";

export interface Report {
  id:             string;
  studentId:      string;
  student:        Student;
  classId:        string;
  class:          ClassSection;
  term:           ScoreTerm;
  academicYear:   string;
  average:        number;
  position?:      number;
  teacherComment?: string;
  conduct?:       number;
  punctuality?:   number;
  neatness?:      number;
  status:         ReportStatus;
  createdAt:      string;
  updatedAt:      string;
}

// ─────────────────────────────────────────────────────────────
// FEES & PAYMENTS
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// FEES & PAYMENTS
// ─────────────────────────────────────────────────────────────

export type PaymentStatus = "defaulter" | "partially_paid" | "paid";
export type PaymentMethod = "cash" | "bank_transfer" | "pos" | "paystack";

export interface LineItem {
  label:  string;
  amount: number;
}

export interface FeeTemplate {
  id:          string;
  schoolId:    string;
  classId?:    string;
  class?:      ClassSection;
  termLabel:   string;
  lineItems:   LineItem[];
  totalAmount: number;
  description?: string;
  isActive:    boolean;
  createdAt:   string;
  updatedAt:   string;
}

export interface FeeInvoice {
  id:            string;
  studentId:     string;
  student:       Student;
  schoolId:      string;
  templateId?:   string;
  template?:     FeeTemplate;
  termLabel:     string;
  totalAmount:   number;
  amountPaid:    number;
  balance:       number;
  paymentStatus: PaymentStatus;
  lineItems?:    LineItem[];
  portalToken?:  string;
  createdAt:     string;
  updatedAt:     string;
}

export interface Payment {
  id:                     string;
  receiptNumber:          string;
  invoiceId:              string;
  invoice:                FeeInvoice;
  amount:                 number;
  balanceAfter:           number;
  paymentMethod:          PaymentMethod;
  reference?:             string;
  paystackTransactionId?: string;
  recordedBy?:            string;
  note?:                  string;
  createdAt:              string;
}

export interface FeeDashboardMetrics {
  totalExpected:  number;
  totalSecured:   number;
  totalDebt:      number;
  paidCount:      number;
  partialCount:   number;
  defaulterCount: number;
}

export interface DunningConfig {
  id:             string;
  schoolId:       string;
  enabled:        boolean;
  daysBeforeExam: number;
  emailTemplate?: string;
  createdAt:      string;
  updatedAt:      string;
}

// ─────────────────────────────────────────────────────────────
// CONTACT / PUBLIC
// ─────────────────────────────────────────────────────────────

export interface ContactFormData {
  firstName:   string;
  lastName:    string;
  email:       string;
  phone?:      string;
  schoolName?: string;
  message:     string;
  subject:     string;
}