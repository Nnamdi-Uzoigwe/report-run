"use server";

import { ApiError } from "@/lib/errors";

import { cookies } from "next/headers";

const BASE_URL = "https://school-mgt-server.vercel.app/api/v1";

// ── Types ─────────────────────────────────────────────────────

interface FetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  skipAuth?: boolean;
}

// ── Cookie helpers ────────────────────────────────────────────

const COOKIE_OPTS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path:     "/",
};

export async function setAuthCookies(
  accessToken: string,
  refreshToken: string
) {
  const cookieStore = await cookies();

  cookieStore.set("rr_access", accessToken, {
    ...COOKIE_OPTS,
    maxAge: 60 * 15, // 15 minutes
  });

  cookieStore.set("rr_refresh", refreshToken, {
    ...COOKIE_OPTS,
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.delete("rr_access");
  cookieStore.delete("rr_refresh");
}

async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("rr_access")?.value ?? null;
}

async function getRefreshToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("rr_refresh")?.value ?? null;
}

// ── Token refresh ─────────────────────────────────────────────

async function refreshTokens(): Promise<boolean> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ refreshToken }),
      cache:   "no-store",
    });

    if (!res.ok) return false;

    const json = await res.json();
    const data = json.data ?? json;

    await setAuthCookies(data.accessToken, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

// ── Core fetchers ─────────────────────────────────────────────

/**
 * authFetch — for all authenticated API calls.
 * Automatically injects Bearer token from httpOnly cookie.
 * On 401, silently refreshes tokens and retries once.
 * On second failure, clears cookies (user must re-login).
 */
export async function authFetch<T>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { body, skipAuth = false, ...init } = options;

  const makeRequest = async (token: string | null) => {
    const headers = new Headers(init.headers);
    headers.set("Content-Type", "application/json");
    if (token && !skipAuth) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return fetch(`${BASE_URL}${path}`, {
      ...init,
      headers,
      body:  body != null ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
  };

  // First attempt
  let token = await getAccessToken();
  let res   = await makeRequest(token);

  // 401 — try refresh then retry once
  if (res.status === 401) {
    const refreshed = await refreshTokens();
    if (!refreshed) {
      await clearAuthCookies();
      throw new ApiError(401, "Session expired. Please sign in again.");
    }
    token = await getAccessToken();
    res   = await makeRequest(token);
  }

  return parseResponse<T>(res);
}

/**
 * publicFetch — for endpoints that need no auth token.
 * (login, register, forgot-password, pricing plans, etc.)
 */
export async function publicFetch<T>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { body, ...init } = options;

  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers,
    body:  body != null ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  return parseResponse<T>(res);
}

// ── Response parser ───────────────────────────────────────────

async function parseResponse<T>(res: Response): Promise<T> {
  let json: Record<string, unknown>;

  try {
    json = await res.json();
  } catch {
    throw new ApiError(res.status, "Invalid response from server.");
  }

  if (!res.ok) {
    const message = Array.isArray(json.message)
      ? (json.message as string[]).join(", ")
      : (json.message as string) ?? "Something went wrong.";
    throw new ApiError(res.status, message);
  }

  // Unwrap standard { success, data, timestamp } envelope
  return ((json.data ?? json) as T);
}