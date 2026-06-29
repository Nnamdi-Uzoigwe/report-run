"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { getMe } from "@/lib/api";
import { loginAction, logoutAction, registerAction } from "@/lib/actions/auth";
import { useAuthStore } from "@/lib/store";
import { keys } from "./keys";
import type { LoginCredentials, RegisterPayload, User } from "@/types";

/**
 * Fetches the current user from /users/me and syncs into Zustand.
 * Used in the dashboard layout to keep the store populated on every page load.
 */
export function useMe() {
  const setUser = useAuthStore((s) => s.setUser);

  return useQuery({
    queryKey: keys.me,
    queryFn:  async () => {
      const user = await getMe();
      setUser(user);
      return user;
    },
    staleTime: 5 * 60 * 1000,
    retry:     1,
  });
}

/**
 * Login mutation. On success, populates the Zustand store and
 * redirects to the dashboard. Accepts an optional redirect target
 * to support the ?from= param set by middleware.
 */
export function useLogin(redirectTo = "/dashboard") {
  const setUser     = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();
  const router      = useRouter();

  return useMutation({
    mutationFn: async (credentials: LoginCredentials): Promise<User> => {
      const result = await loginAction(credentials.email, credentials.password);
      if (result.error) throw new Error(result.error);
      return result.user as User;
    },
    onSuccess: (user: User) => {
      setUser(user);
      queryClient.setQueryData(keys.me, user);
      router.push(redirectTo);
    },
  });
}

/**
 * Register mutation. Creates the school + admin user, then redirects
 * to the dashboard. The free plan is assigned automatically by the backend.
 */
export function useRegister() {
  const setUser     = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();
  const router      = useRouter();

  return useMutation({
    mutationFn: async (data: RegisterPayload): Promise<User> => {
      const result = await registerAction(data);
      if (result.error) throw new Error(result.error);
      return result.user as User;
    },
    onSuccess: (user: User) => {
      setUser(user);
      queryClient.setQueryData(keys.me, user);
      router.push("/dashboard");
    },
  });
}

/**
 * Logout mutation. Clears cookies server-side, resets the Zustand
 * store, clears all cached queries, then redirects to login.
 */
export function useLogout() {
  const clearUser   = useAuthStore((s) => s.clearUser);
  const queryClient = useQueryClient();
  const router      = useRouter();

  return useMutation({
    mutationFn: logoutAction,
    onSettled: () => {
      clearUser();
      queryClient.clear();
      router.push("/login");
    },
  });
}