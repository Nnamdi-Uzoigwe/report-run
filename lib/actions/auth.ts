"use server";

import { publicFetch, authFetch, setAuthCookies, clearAuthCookies } from "@/lib/fetcher";
import type { User } from "@/types";

// ── Response shapes ───────────────────────────────────────────

interface AuthResponse {
  accessToken:  string;
  refreshToken: string;
  user: {
    id:              string;
    firstName:       string;
    lastName:        string;
    email:           string;
    role:            string;
    schoolId:        string;
    isEmailVerified: boolean;
    inviteStatus:    string | null;
  };
}

// ── Normalise API user → our User type ────────────────────────

function normaliseUser(u: AuthResponse["user"]): User {
  return {
    id:          u.id,
    email:       u.email,
    firstName:   u.firstName,
    lastName:    u.lastName ?? "",
    role:        u.role as User["role"],
    schoolId:    u.schoolId,
    createdAt:   new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };
}

// ── Actions ───────────────────────────────────────────────────

export async function loginAction(
  email: string,
  password: string
): Promise<{ user: User; error?: never } | { user?: never; error: string }> {
  try {
    const res = await publicFetch<AuthResponse>("/auth/login", {
      method: "POST",
      body:   { email, password },
    });

    await setAuthCookies(res.accessToken, res.refreshToken);
    return { user: normaliseUser(res.user) };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Login failed.",
    };
  }
}

export async function registerAction(data: {
  firstName:    string;
  lastName:     string;
  email:        string;
  password:     string;
  schoolName:   string;
  currencyCode: string;
  address?:     string;
  phone?:       string;
}): Promise<{ user: User; error?: never } | { user?: never; error: string }> {
  try {
    const res = await publicFetch<AuthResponse>("/auth/register", {
      method: "POST",
      body:   data,
    });

    await setAuthCookies(res.accessToken, res.refreshToken);
    return { user: normaliseUser(res.user) };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Registration failed.",
    };
  }
}

export async function logoutAction(): Promise<void> {
  try {
    await authFetch("/auth/logout", { method: "POST" });
  } finally {
    await clearAuthCookies();
  }
}

export async function forgotPasswordAction(
  email: string
): Promise<{ error?: string }> {
  try {
    await publicFetch("/auth/forgot-password", {
      method: "POST",
      body:   { email },
    });
    return {};
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Request failed.",
    };
  }
}

export async function resetPasswordAction(
  token: string,
  newPassword: string
): Promise<{ error?: string }> {
  try {
    await publicFetch("/auth/reset-password", {
      method: "POST",
      body:   { token, newPassword },
    });
    return {};
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Reset failed.",
    };
  }
}

export async function acceptInviteAction(
  token: string,
  password: string
): Promise<{ user: User; error?: never } | { user?: never; error: string }> {
  try {
    const res = await publicFetch<AuthResponse>("/auth/accept-invite", {
      method: "POST",
      body:   { token, password },
    });

    await setAuthCookies(res.accessToken, res.refreshToken);
    return { user: normaliseUser(res.user) };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Invite acceptance failed.",
    };
  }
}

export async function changePasswordAction(
  currentPassword: string,
  newPassword: string
): Promise<{ error?: string }> {
  try {
    await authFetch("/auth/change-password", {
      method: "POST",
      body:   { currentPassword, newPassword },
    });
    return {};
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Password change failed.",
    };
  }
}