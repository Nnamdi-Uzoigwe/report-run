"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/store";
import {
  getSchool,
  updateSchool,
  uploadSchoolLogo,
  getPlans,
  getActiveSubscription,
  getSubscriptionHistory,
  initiateSubscription,
} from "@/lib/api";
import { keys } from "./keys";

// ── School ────────────────────────────────────────────────────

export function useSchool() {
  const schoolId = useAuthStore((s) => s.schoolId);

  return useQuery({
    queryKey: keys.school.detail(schoolId ?? ""),
    queryFn:  () => getSchool(schoolId!),
    enabled:  !!schoolId,
    staleTime: 10 * 60 * 1000,
  });
}

export function useUpdateSchool() {
  const schoolId    = useAuthStore((s) => s.schoolId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof updateSchool>[1]) =>
      updateSchool(schoolId!, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(keys.school.detail(schoolId!), updated);
    },
  });
}

export function useUploadSchoolLogo() {
  const schoolId    = useAuthStore((s) => s.schoolId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => uploadSchoolLogo(schoolId!, file),
    onSuccess: (updated) => {
      queryClient.setQueryData(keys.school.detail(schoolId!), updated);
    },
  });
}

// ── Plans ─────────────────────────────────────────────────────

export function usePlans() {
  return useQuery({
    queryKey: keys.plans,
    queryFn:  getPlans,
    staleTime: 30 * 60 * 1000, // Plans rarely change
  });
}

// ── Subscription ──────────────────────────────────────────────

export function useActiveSubscription() {
  const schoolId = useAuthStore((s) => s.schoolId);

  return useQuery({
    queryKey: keys.subscription.active(schoolId ?? ""),
    queryFn:  () => getActiveSubscription(schoolId!),
    enabled:  !!schoolId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSubscriptionHistory() {
  const schoolId = useAuthStore((s) => s.schoolId);

  return useQuery({
    queryKey: keys.subscription.history(schoolId ?? ""),
    queryFn:  () => getSubscriptionHistory(schoolId!),
    enabled:  !!schoolId,
  });
}

export function useInitiateSubscription() {
  const schoolId    = useAuthStore((s) => s.schoolId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (planId: string) => initiateSubscription(planId, schoolId!),
    onSuccess: () => {
      // Invalidate so the active subscription refreshes after Paystack callback
      queryClient.invalidateQueries({
        queryKey: keys.subscription.active(schoolId!),
      });
    },
  });
}