import { create } from "zustand";
import type { User, UserRole } from "@/types";

// ─────────────────────────────────────────────────────────────
// PERMISSIONS
// Mirrors what the backend enforces — keep these in sync.
// ─────────────────────────────────────────────────────────────

const ROLE_HIERARCHY: Record<UserRole, number> = {
  super_admin: 100,
  admin:       80,
  bursar:      50,
  teacher:     40,
  parent:      10,
};

export const PERMISSIONS = {
  // Staff management
  canInviteStaff:    (r: UserRole) => r === "super_admin" || r === "admin",
  canManageStaff:    (r: UserRole) => r === "super_admin" || r === "admin",

  // Students
  canManageStudents: (r: UserRole) => r === "super_admin" || r === "admin",

  // Classes & subjects
  canManageClasses:  (r: UserRole) => r === "super_admin" || r === "admin",
  canManageSubjects: (r: UserRole) => r === "super_admin" || r === "admin",

  // Grading
  canManageGrading:  (r: UserRole) => r === "super_admin" || r === "admin",

  // Academics — teachers can enter scores and submit attendance
  canEnterScores:    (r: UserRole) => r === "super_admin" || r === "admin" || r === "teacher",
  canSubmitAttendance: (r: UserRole) => r === "super_admin" || r === "admin" || r === "teacher",

  // Reports — class teachers can also publish
  canGenerateReports: (r: UserRole) => r === "super_admin" || r === "admin",
  canPublishReports:  (r: UserRole) => r === "super_admin" || r === "admin" || r === "teacher",

  // Fees — bursar has full access to this area
  canManageFees:     (r: UserRole) => r === "super_admin" || r === "admin" || r === "bursar",
  canRecordPayments: (r: UserRole) => r === "super_admin" || r === "admin" || r === "bursar",
  canViewFeeMetrics: (r: UserRole) => r === "super_admin" || r === "admin" || r === "bursar",

  // School settings & subscriptions
  canManageSettings: (r: UserRole) => r === "super_admin" || r === "admin",
  canManagePlans:    (r: UserRole) => r === "super_admin",

  // Utility — role comparison
  isAtLeast: (r: UserRole, min: UserRole) => ROLE_HIERARCHY[r] >= ROLE_HIERARCHY[min],
} as const;

// ─────────────────────────────────────────────────────────────
// AUTH STORE
// ─────────────────────────────────────────────────────────────

interface AuthStore {
  user:            User | null;
  isAuthenticated: boolean;
  setUser:         (user: User) => void;
  clearUser:       () => void;
  // Derived — recomputed on every setUser so components
  // can select these without recalculating inline
  role:            UserRole | null;
  schoolId:        string | null;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user:            null,
  isAuthenticated: false,
  role:            null,
  schoolId:        null,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: true,
      role:            user.role,
      schoolId:        user.schoolId,
    }),

  clearUser: () =>
    set({
      user:            null,
      isAuthenticated: false,
      role:            null,
      schoolId:        null,
    }),
}));