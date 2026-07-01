/**
 * lib/client-fetch.ts
 *
 * Browser-side HTTP client for all TanStack Query calls.
 *
 * Token strategy:
 *   rr_access   — NOT httpOnly. Browser reads it for Authorization headers.
 *                 Short-lived: 15 minutes.
 *   rr_refresh  — NOT httpOnly. Browser reads it to call /auth/refresh.
 *                 Long-lived: 30 days.
 *
 * On a 401 response this module:
 *   1. Calls POST /auth/refresh with the refresh token from the cookie
 *   2. Writes the new token pair back via the setAuthCookies server action
 *   3. Retries the original request once with the new access token
 *   4. If refresh fails — clears both cookies and throws so the app
 *      can redirect to login
 */

import { ApiError } from "@/lib/errors";
import { setAuthCookies, clearAuthCookies } from "@/lib/fetcher";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://school-mgt-server.vercel.app/api/v1";

// ── Cookie helpers ────────────────────────────────────────────

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return match ? match.substring(name.length + 1) : null;
}

// ── Token refresh ─────────────────────────────────────────────

// Module-level promise so concurrent 401s don't fire multiple refresh calls
let refreshPromise: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
  const refreshToken = getCookie("rr_refresh");
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ refreshToken }),
      cache:   "no-store",
    });

    if (!res.ok) return null;

    const json = await res.json();
    const data = json.data ?? json;

    // Write new cookies back via server action (the only way to set
    // httpOnly-safe cookies from a client component boundary)
    await setAuthCookies(data.accessToken, data.refreshToken);

    return data.accessToken as string;
  } catch {
    return null;
  }
}

async function refreshTokens(): Promise<string | null> {
  // Deduplicate concurrent refresh calls — only one in-flight at a time
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

// ── Request builder ───────────────────────────────────────────

function buildHeaders(body: unknown, token: string | null): Headers {
  const headers = new Headers();
  if (!(body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return headers;
}

function buildBody(body: unknown): BodyInit | undefined {
  if (body instanceof FormData) return body;
  if (body != null) return JSON.stringify(body);
  return undefined;
}

// ── Core fetch ────────────────────────────────────────────────

async function clientFetch<T>(path: string, options: {
  method?: string;
  body?:   unknown;
  cache?:  RequestCache;
} = {}): Promise<T> {
  const { body, method, cache = "no-store" } = options;

  const makeRequest = (token: string | null): Promise<Response> =>
    fetch(`${BASE_URL}${path}`, {
      method:  method ?? (body != null ? "POST" : "GET"),
      headers: buildHeaders(body, token),
      body:    buildBody(body),
      cache,
    });

  // First attempt
  let token = getCookie("rr_access");
  let res   = await makeRequest(token);

  // 401 — try refresh then retry once
  if (res.status === 401) {
    const newToken = await refreshTokens();

    if (!newToken) {
      // Refresh failed — clear cookies so middleware redirects to login
      await clearAuthCookies();
      throw new ApiError(401, "Your session has expired. Please sign in again.");
    }

    res = await makeRequest(newToken);
  }

  return parseResponse<T>(res);
}

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

  return (json.data ?? json) as T;
}

export { clientFetch };