"use server";

import { authFetch } from "@/lib/fetcher";
import type { User, UserRole } from "@/types";

// ── Response shapes ───────────────────────────────────────────

interface ApiUser {
  id:              string;
  firstName:       string;
  lastName:        string;
  email:           string;
  role:            string;
  schoolId:        string;
  phoneNumber?:    string;
  isActive:        boolean;
  isEmailVerified: boolean;
  inviteStatus:    "pending" | "accepted" | null;
  createdAt:       string;
}

function normaliseUser(u: ApiUser): User {
  return {
  id: u.id,
  email: u.email,
  firstName: u.firstName,
  lastName: u.lastName ?? "",
  role: u.role as UserRole,
  schoolId: u.schoolId,
  createdAt: u.createdAt,
  lastLoginAt: new Date().toISOString(),
  isActive: false,
  isEmailVerified: false,
  inviteStatus: null,
  authProvider: "local",
  updatedAt: ""
};
}

// ── Actions ───────────────────────────────────────────────────

export async function getMeAction(): Promise<User> {
  const res = await authFetch<ApiUser>("/users/me");
  return normaliseUser(res);
}

export async function getSchoolUsersAction(schoolId: string): Promise<User[]> {
  const res = await authFetch<ApiUser[]>(`/users/school/${schoolId}`);
  return res.map(normaliseUser);
}

export async function inviteUserAction(data: {
  firstName: string;
  lastName:  string;
  email:     string;
  role:      "teacher" | "bursar" | "admin";
  schoolId:  string;
}): Promise<{ error?: string }> {
  try {
    await authFetch("/users/invite", {
      method: "POST",
      body:   data,
    });
    return {};
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Invite failed.",
    };
  }
}

export async function resendInviteAction(
  userId: string
): Promise<{ error?: string }> {
  try {
    await authFetch(`/users/${userId}/resend-invite`, { method: "POST" });
    return {};
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Resend failed.",
    };
  }
}