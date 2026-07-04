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
  listBanks,
  verifyBankAccount,
  saveBankAccount,
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

export function usePlans(billingCycle?: "monthly" | "annually") {
  return useQuery({
    queryKey: [...keys.plans, billingCycle ?? "all"],
    queryFn:  () => getPlans(billingCycle),
    staleTime: 30 * 60 * 1000,
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

// ── Bank account ──────────────────────────────────────────────

export function useListBanks() {
  return useQuery({
    queryKey: ["banks"],
    queryFn:  listBanks,
    staleTime: 1000 * 60 * 60, // 1 hour — bank list rarely changes
  });
}

export function useVerifyBankAccount() {
  return useMutation({
    mutationFn: ({ accountNumber, bankCode }: { accountNumber: string; bankCode: string }) =>
      verifyBankAccount(accountNumber, bankCode),
  });
}

export function useSaveBankAccount() {
  const schoolId    = useAuthStore((s) => s.schoolId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      accountNumber: string;
      bankCode:      string;
      bankName:      string;
      accountName:   string;
    }) => saveBankAccount(schoolId!, data.accountNumber, data.bankCode, data.bankName, data.accountName),
    onSuccess: (updated) => {
      queryClient.setQueryData(["school", schoolId], updated);
    },
  });
}