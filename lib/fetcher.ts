"use server";

import { ApiError } from "@/lib/errors";
import { cookies } from "next/headers";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://school-mgt-server.vercel.app/api/v1";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

interface FetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  skipAuth?: boolean;
}

// ─────────────────────────────────────────────────────────────
// COOKIE HELPERS
// ─────────────────────────────────────────────────────────────

const COOKIE_OPTS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path:     "/",
};

export async function setAuthCookies(
  accessToken: string,
  refreshToken: string
): Promise<void> {
  const store = await cookies();
  // Access token: NOT httpOnly — browser reads it for Authorization headers
  store.set("rr_access", accessToken, {
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path:     "/",
    maxAge:   60 * 15, // 15 minutes
  });
  // Refresh token: NOT httpOnly — browser reads it to call /auth/refresh
  // It is still protected by sameSite:lax and secure:true in production
  store.set("rr_refresh", refreshToken, {
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path:     "/",
    maxAge:   60 * 60 * 24 * 30, // 30 days
  });
}

export async function clearAuthCookies(): Promise<void> {
  const store = await cookies();
  store.delete("rr_access");
  store.delete("rr_refresh");
}

async function getAccessToken(): Promise<string | null> {
  const store = await cookies();
  return store.get("rr_access")?.value ?? null;
}

async function getRefreshToken(): Promise<string | null> {
  const store = await cookies();
  return store.get("rr_refresh")?.value ?? null;
}

// ─────────────────────────────────────────────────────────────
// TOKEN REFRESH
// ─────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────
// CORE REQUEST BUILDER
// ─────────────────────────────────────────────────────────────

function buildRequest(
  body: unknown,
  init: Omit<RequestInit, "body">
): RequestInit {
  // FormData — let the browser set the correct multipart boundary
  if (body instanceof FormData) {
    return { ...init, body };
  }

  // JSON
  return {
    ...init,
    body:    body != null ? JSON.stringify(body) : undefined,
  };
}

function buildHeaders(
  body: unknown,
  token: string | null,
  skipAuth: boolean
): Headers {
  const headers = new Headers();

  // Only set JSON content type for non-FormData bodies
  if (!(body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token && !skipAuth) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return headers;
}

// ─────────────────────────────────────────────────────────────
// PUBLIC FETCH — no auth, no retry
// ─────────────────────────────────────────────────────────────

export async function publicFetch<T>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { body, ...init } = options;

  const headers = new Headers();
  if (!(body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...buildRequest(body, init),
    headers,
    cache: "no-store",
  });

  return parseResponse<T>(res);
}

// ─────────────────────────────────────────────────────────────
// AUTH FETCH — Bearer token, silent refresh on 401, one retry
// ─────────────────────────────────────────────────────────────

export async function authFetch<T>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { body, skipAuth = false, ...init } = options;

  const makeRequest = async (token: string | null): Promise<Response> =>
    fetch(`${BASE_URL}${path}`, {
      ...buildRequest(body, init),
      headers: buildHeaders(body, token, skipAuth),
      cache:   "no-store",
    });

  // First attempt
  let token = await getAccessToken();
  let res   = await makeRequest(token);

  // 401 — try a silent refresh then retry once
  if (res.status === 401 && !skipAuth) {
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

// ─────────────────────────────────────────────────────────────
// RESPONSE PARSER
// ─────────────────────────────────────────────────────────────

async function parseResponse<T>(res: Response): Promise<T> {
  let json: Record<string, unknown>;

  try {
    json = await res.json();
  } catch {
    throw new ApiError(res.status, "Invalid response from server.");
  }

  if (!res.ok) {
    const msg = Array.isArray(json.message)
      ? (json.message as string[]).join(", ")
      : (json.message as string | undefined) ?? "Something went wrong.";
    throw new ApiError(res.status, msg);
  }

  // Unwrap { success, data, timestamp } envelope
  return (json.data ?? json) as T;
}