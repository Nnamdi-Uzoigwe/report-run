import { create } from "zustand";
import type { User, UserRole } from "@/types";

// ── Role permission helpers ───────────────────────────────────

const ROLE_HIERARCHY: Record<UserRole, number> = {
  super_admin: 100,
  admin:       80,
  teacher:     40,
  accountant:  40,
  parent:      10,
};

// What each role can do
export const ROLE_PERMISSIONS = {
  canManageStaff:    (role: UserRole) => ["super_admin", "admin"].includes(role),
  canManageStudents: (role: UserRole) => ["super_admin", "admin"].includes(role),
  canManageFees:     (role: UserRole) => ["super_admin", "admin", "accountant"].includes(role),
  canManageClasses:  (role: UserRole) => ["super_admin", "admin"].includes(role),
  canEnterScores:    (role: UserRole) => ["super_admin", "admin", "teacher"].includes(role),
  canViewReports:    (role: UserRole) => ["super_admin", "admin", "teacher", "accountant"].includes(role),
  canManageSettings: (role: UserRole) => ["super_admin", "admin"].includes(role),
  canSendMessages:   (role: UserRole) => ["super_admin", "admin"].includes(role),
  isAtLeast:         (role: UserRole, minimum: UserRole) =>
    ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[minimum],
} as const;

// ── Store ─────────────────────────────────────────────────────

interface AuthStore {
  user:            User | null;
  isAuthenticated: boolean;
  setUser:         (user: User) => void;
  clearUser:       () => void;
  // Convenience getters
  role:            UserRole | null;
  schoolId:        string | null;
  can:             typeof ROLE_PERMISSIONS;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user:            null,
  isAuthenticated: false,
  role:            null,
  schoolId:        null,
  can:             ROLE_PERMISSIONS,

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