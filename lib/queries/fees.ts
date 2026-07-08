"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/store";
import {
  getFeeTemplates,
  createFeeTemplate,
  generateInvoicesFromTemplate,
  getFeeDashboard,
  getInvoices,
  getInvoice,
  createInvoice,
  getInvoicePayments,
  recordPayment,
  getReceiptUrl,
  sendFeeReminders,
  getDunningConfig,
  updateDunningConfig,
} from "@/lib/api";
import { keys } from "./keys";
import type { LineItem, PaymentMethod, PaymentStatus } from "@/types";

// ── Templates ─────────────────────────────────────────────────

export function useFeeTemplates() {
  const schoolId = useAuthStore((s) => s.schoolId);

  return useQuery({
    queryKey: keys.fees.templates(schoolId ?? ""),
    queryFn:  () => getFeeTemplates(schoolId!),
    enabled:  !!schoolId,
  });
}

export function useCreateFeeTemplate() {
  const schoolId    = useAuthStore((s) => s.schoolId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      classId?:    string;
      termLabel:   string;
      lineItems:   LineItem[];
      description?: string;
    }) => createFeeTemplate({ ...data, schoolId: schoolId! }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: keys.fees.templates(schoolId!),
      });
    },
  });
}

export function useGenerateInvoices() {
  const schoolId    = useAuthStore((s) => s.schoolId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (templateId: string) =>
      generateInvoicesFromTemplate(templateId),
    onSuccess: () => {
      // Invoices and dashboard both change after bulk generation
      queryClient.invalidateQueries({ queryKey: ["fees", "invoices", schoolId!] });
      queryClient.invalidateQueries({ queryKey: keys.fees.dashboard(schoolId!) });
    },
  });
}

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
    mutationFn: (data: {
      studentId:   string;
      termLabel:   string;
      totalAmount: number;
      lineItems?:  LineItem[];
    }) => createInvoice({ ...data, schoolId: schoolId! }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fees", "invoices", schoolId!] });
      queryClient.invalidateQueries({ queryKey: keys.fees.dashboard(schoolId!) });
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
    mutationFn: (data: {
      invoiceId:     string;
      amount:        number;
      paymentMethod: PaymentMethod;
      reference?:    string;
      recordedBy?:   string;
      note?:         string;
    }) => recordPayment({ ...data, amount: Number(data.amount) }),  // ensure number
    onSuccess: (result) => {
      // Update the specific invoice in cache immediately
      queryClient.setQueryData(keys.fees.invoice(result.invoice.id), result.invoice);
      // Use prefix invalidation to catch all filter variants of the invoices list
      queryClient.invalidateQueries({ queryKey: ["fees", "invoices", schoolId!] });
      queryClient.invalidateQueries({ queryKey: keys.fees.dashboard(schoolId!) });
      queryClient.invalidateQueries({ queryKey: keys.fees.payments(result.invoice.id) });
    },
  });
}

/**
 * Opens the printable HTML receipt in a new browser tab.
 */
export function openReceipt(paymentId: string): void {
  window.open(getReceiptUrl(paymentId), "_blank", "noopener,noreferrer");
}

// ── Reminders ─────────────────────────────────────────────────

export function useSendFeeReminders() {
  const schoolId = useAuthStore((s) => s.schoolId);

  return useMutation({
    mutationFn: () => sendFeeReminders(schoolId!),
  });
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