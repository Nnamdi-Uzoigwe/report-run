"use client";

import { useAuthStore, PERMISSIONS } from "@/lib/store";

/**
 * usePermission
 *
 * Returns the current user's role and a set of boolean permission flags
 * derived from PERMISSIONS. Components should use these flags rather than
 * checking role strings directly — if the backend changes a permission,
 * only PERMISSIONS needs updating.
 *
 * Usage:
 *   const { can, isAdmin, role } = usePermission();
 *   if (can.manageStudents) { ... }
 */
export function usePermission() {
  const role = useAuthStore((s) => s.role);
  const user = useAuthStore((s) => s.user);

  const can = role
    ? {
        inviteStaff:       PERMISSIONS.canInviteStaff(role),
        manageStaff:       PERMISSIONS.canManageStaff(role),
        manageStudents:    PERMISSIONS.canManageStudents(role),
        manageClasses:     PERMISSIONS.canManageClasses(role),
        manageSubjects:    PERMISSIONS.canManageSubjects(role),
        manageGrading:     PERMISSIONS.canManageGrading(role),
        enterScores:       PERMISSIONS.canEnterScores(role),
        submitAttendance:  PERMISSIONS.canSubmitAttendance(role),
        generateReports:   PERMISSIONS.canGenerateReports(role),
        publishReports:    PERMISSIONS.canPublishReports(role),
        manageFees:        PERMISSIONS.canManageFees(role),
        recordPayments:    PERMISSIONS.canRecordPayments(role),
        viewFeeMetrics:    PERMISSIONS.canViewFeeMetrics(role),
        manageSettings:    PERMISSIONS.canManageSettings(role),
        managePlans:       PERMISSIONS.canManagePlans(role),
      }
    : {
        inviteStaff:       false,
        manageStaff:       false,
        manageStudents:    false,
        manageClasses:     false,
        manageSubjects:    false,
        manageGrading:     false,
        enterScores:       false,
        submitAttendance:  false,
        generateReports:   false,
        publishReports:    false,
        manageFees:        false,
        recordPayments:    false,
        viewFeeMetrics:    false,
        manageSettings:    false,
        managePlans:       false,
      };

  return {
    role,
    user,
    can,
    isAdmin:      role === "admin" || role === "super_admin",
    isSuperAdmin: role === "super_admin",
    isTeacher:    role === "teacher",
    isBursar:     role === "bursar",
  };
}