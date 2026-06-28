// Centralised fetch wrapper with:
// - Bearer token injection
// - Automatic token refresh on 401
// - Redirect to /login on refresh failure

const BASE_URL = "https://school-mgt-server.vercel.app/api/v1";

// In-memory token store — never localStorage for access tokens
let accessToken:  string | null = null;
let refreshToken: string | null = null;

export function setTokens(access: string, refresh: string) {
  accessToken  = access;
  refreshToken = refresh;
  localStorage.setItem("rr_refresh", refresh);
}

export function clearTokens() {
  accessToken  = null;
  refreshToken = null;
  localStorage.removeItem("rr_refresh");
}

export function loadRefreshToken(): string | null {
  if (refreshToken) return refreshToken;
  const stored = localStorage.getItem("rr_refresh");
  if (stored) { refreshToken = stored; }
  return refreshToken;
}

export function getAccessToken(): string | null {
  return accessToken;
}

// ── Core fetch ────────────────────────────────────────────────

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { skipAuth = false, ...init } = options;

  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");

  if (!skipAuth && accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers });

  // Token expired — try refresh
  if (res.status === 401 && !skipAuth) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      // Retry original request with new token
      headers.set("Authorization", `Bearer ${accessToken}`);
      const retry = await fetch(`${BASE_URL}${path}`, { ...init, headers });
      if (!retry.ok) {
        const err = await retry.json().catch(() => ({}));
        throw new ApiError(retry.status, err.message ?? "Request failed");
      }
      const retryData = await retry.json();
      return retryData.data ?? retryData;
    } else {
      // Refresh failed — force logout
      clearTokens();
      window.location.href = "/login";
      throw new ApiError(401, "Session expired. Please sign in again.");
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const message = Array.isArray(err.message)
      ? err.message.join(", ")
      : err.message ?? "Something went wrong.";
    throw new ApiError(res.status, message);
  }

  const json = await res.json();
  // Unwrap the standard { success, data, timestamp } envelope
  return json.data ?? json;
}

async function tryRefresh(): Promise<boolean> {
  const token = loadRefreshToken();
  if (!token) return false;

  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ refreshToken: token }),
    });
    if (!res.ok) return false;
    const json = await res.json();
    const data = json.data ?? json;
    setTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

// ── Error class ───────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ── HTTP helpers ──────────────────────────────────────────────

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "GET" }),

  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, {
      ...options,
      method: "POST",
      body: body != null ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, {
      ...options,
      method: "PATCH",
      body: body != null ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "DELETE" }),
};