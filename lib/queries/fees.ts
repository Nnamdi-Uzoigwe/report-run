"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/store";
import {
  getFeeDashboard,
  getInvoices,
  getInvoice,
  createInvoice,
  getInvoicePayments,
  recordPayment,
  getReceiptUrl,
  getDunningConfig,
  updateDunningConfig,
} from "@/lib/api";
import { keys } from "./keys";
import type { PaymentStatus } from "@/types";

// ── Dashboard ─────────────────────────────────────────────────

export function useFeeDashboard(termLabel?: string) {
  const schoolId = useAuthStore((s) => s.schoolId);

  return useQuery({
    queryKey: keys.fees.dashboard(schoolId ?? "", termLabel),
    queryFn:  () => getFeeDashboard(schoolId!, termLabel),
    enabled:  !!schoolId,
  });
}

// ── Invoices ──────────────────────────────────────────────────

export function useInvoices(status?: PaymentStatus, termLabel?: string) {
  const schoolId = useAuthStore((s) => s.schoolId);

  return useQuery({
    queryKey: keys.fees.invoices(schoolId ?? "", status, termLabel),
    queryFn:  () => getInvoices(schoolId!, status, termLabel),
    enabled:  !!schoolId,
  });
}

export function useInvoice(invoiceId: string) {
  return useQuery({
    queryKey: keys.fees.invoice(invoiceId),
    queryFn:  () => getInvoice(invoiceId),
    enabled:  !!invoiceId,
  });
}

export function useCreateInvoice() {
  const schoolId    = useAuthStore((s) => s.schoolId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<Parameters<typeof createInvoice>[0], "schoolId">) =>
      createInvoice({ ...data, schoolId: schoolId! }),
    onSuccess: () => {
      // Invalidate all invoice lists for this school
      queryClient.invalidateQueries({
        queryKey: ["fees", "invoices", schoolId!],
      });
      queryClient.invalidateQueries({
        queryKey: keys.fees.dashboard(schoolId!),
      });
    },
  });
}

// ── Payments ──────────────────────────────────────────────────

export function useInvoicePayments(invoiceId: string) {
  return useQuery({
    queryKey: keys.fees.payments(invoiceId),
    queryFn:  () => getInvoicePayments(invoiceId),
    enabled:  !!invoiceId,
  });
}

export function useRecordPayment() {
  const schoolId    = useAuthStore((s) => s.schoolId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof recordPayment>[0]) =>
      recordPayment(data),
    onSuccess: (result) => {
      // Update the specific invoice in cache
      queryClient.setQueryData(
        keys.fees.invoice(result.invoice.id),
        result.invoice
      );
      // Bust invoice list and dashboard so metrics recalculate
      queryClient.invalidateQueries({
        queryKey: ["fees", "invoices", schoolId!],
      });
      queryClient.invalidateQueries({
        queryKey: keys.fees.dashboard(schoolId!),
      });
      queryClient.invalidateQueries({
        queryKey: keys.fees.payments(result.invoice.id),
      });
    },
  });
}

/**
 * Opens the printable receipt in a new browser tab.
 * The backend returns a full HTML page — no React rendering needed.
 */
export function openReceipt(paymentId: string): void {
  window.open(getReceiptUrl(paymentId), "_blank", "noopener,noreferrer");
}

// ── Dunning config ────────────────────────────────────────────

export function useDunningConfig() {
  const schoolId = useAuthStore((s) => s.schoolId);

  return useQuery({
    queryKey: keys.fees.dunning(schoolId ?? ""),
    queryFn:  () => getDunningConfig(schoolId!),
    enabled:  !!schoolId,
  });
}

export function useUpdateDunningConfig() {
  const schoolId    = useAuthStore((s) => s.schoolId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof updateDunningConfig>[1]) =>
      updateDunningConfig(schoolId!, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(keys.fees.dunning(schoolId!), updated);
    },
  });
}