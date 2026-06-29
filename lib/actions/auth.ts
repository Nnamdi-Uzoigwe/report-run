"use server";

import { publicFetch, authFetch, setAuthCookies, clearAuthCookies } from "@/lib/fetcher";
import type { AuthResponse, User, RegisterPayload } from "@/types";

// ── Normalise ─────────────────────────────────────────────────
// Maps the raw API AuthResponse.user to our typed User shape.
// Any field the backend doesn't return gets a safe default so
// the rest of the app never sees undefined on required fields.

function normaliseUser(u: AuthResponse["user"]): User {
  return {
    id:              u.id,
    firstName:       u.firstName,
    lastName:        u.lastName,
    email:           u.email,
    role:            u.role,
    schoolId:        u.schoolId,
    avatarUrl:       u.avatarUrl,
    phoneNumber:     u.phoneNumber,
    isActive:        u.isActive        ?? true,
    isEmailVerified: u.isEmailVerified ?? false,
    inviteStatus:    u.inviteStatus    ?? null,
    authProvider:    u.authProvider    ?? "local",
    createdAt:       u.createdAt       ?? new Date().toISOString(),
    updatedAt:       u.updatedAt       ?? new Date().toISOString(),
  };
}

// ── Types ─────────────────────────────────────────────────────

type AuthSuccess = { user: User; error?: never };
type AuthFailure = { user?: never; error: string };
type AuthResult  = AuthSuccess | AuthFailure;

type OkResult    = { error?: never };
type ErrResult   = { error: string };
type SimpleResult = OkResult | ErrResult;

// ── Actions ───────────────────────────────────────────────────

export async function loginAction(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    const res = await publicFetch<AuthResponse>("/auth/login", {
      method: "POST",
      body:   { email, password },
    });
    await setAuthCookies(res.accessToken, res.refreshToken);
    return { user: normaliseUser(res.user) };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Login failed." };
  }
}

export async function registerAction(
  data: RegisterPayload
): Promise<AuthResult> {
  try {
    const res = await publicFetch<AuthResponse>("/auth/register", {
      method: "POST",
      body:   data,
    });
    await setAuthCookies(res.accessToken, res.refreshToken);
    return { user: normaliseUser(res.user) };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Registration failed." };
  }
}

export async function logoutAction(): Promise<void> {
  try {
    await authFetch("/auth/logout", { method: "POST" });
  } catch {
    // Even if the server call fails, clear cookies locally
  } finally {
    await clearAuthCookies();
  }
}

export async function forgotPasswordAction(
  email: string
): Promise<SimpleResult> {
  try {
    await publicFetch("/auth/forgot-password", {
      method: "POST",
      body:   { email },
    });
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Request failed." };
  }
}

export async function resetPasswordAction(
  token: string,
  newPassword: string
): Promise<SimpleResult> {
  try {
    await publicFetch("/auth/reset-password", {
      method: "POST",
      body:   { token, newPassword },
    });
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Reset failed." };
  }
}

export async function acceptInviteAction(
  token: string,
  password: string
): Promise<AuthResult> {
  try {
    const res = await publicFetch<AuthResponse>("/auth/accept-invite", {
      method: "POST",
      body:   { token, password },
    });
    await setAuthCookies(res.accessToken, res.refreshToken);
    return { user: normaliseUser(res.user) };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Invite acceptance failed." };
  }
}

export async function changePasswordAction(
  currentPassword: string,
  newPassword: string
): Promise<SimpleResult> {
  try {
    await authFetch("/auth/change-password", {
      method: "POST",
      body:   { currentPassword, newPassword },
    });
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Password change failed." };
  }
}