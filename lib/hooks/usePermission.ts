"use client";

import { useAuthStore, ROLE_PERMISSIONS } from "@/lib/store";
import type { UserRole } from "@/types";

export function usePermission() {
  const role = useAuthStore((s) => s.role);
  const user = useAuthStore((s) => s.user);

  return {
    role,
    user,
    can: {
      manageStaff:    role ? ROLE_PERMISSIONS.canManageStaff(role)    : false,
      manageStudents: role ? ROLE_PERMISSIONS.canManageStudents(role)  : false,
      manageFees:     role ? ROLE_PERMISSIONS.canManageFees(role)      : false,
      manageClasses:  role ? ROLE_PERMISSIONS.canManageClasses(role)   : false,
      enterScores:    role ? ROLE_PERMISSIONS.canEnterScores(role)     : false,
      viewReports:    role ? ROLE_PERMISSIONS.canViewReports(role)     : false,
      manageSettings: role ? ROLE_PERMISSIONS.canManageSettings(role)  : false,
      sendMessages:   role ? ROLE_PERMISSIONS.canSendMessages(role)    : false,
    },
    isAdmin:      role === "admin" || role === "super_admin",
    isTeacher:    role === "teacher",
    isAccountant: role === "accountant",
  };
}