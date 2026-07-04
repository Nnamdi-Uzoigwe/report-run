"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { clientFetch } from "@/lib/client-fetch";
import { CheckCircle, AlertCircle, Loader2, Building2, CreditCard } from "lucide-react";
import type { FeeInvoice } from "@/types";

async function getPortalInvoice(token: string): Promise<FeeInvoice> {
  return clientFetch<FeeInvoice>(`/fees/portal/${token}`);
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency", currency: "NGN", minimumFractionDigits: 0,
  }).format(amount);
}

function pctPaid(invoice: FeeInvoice): number {
  const total = Number(invoice.totalAmount);
  return total === 0 ? 0 : Math.round((Number(invoice.amountPaid) / total) * 100);
}

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
      <div
        className="h-2 rounded-full transition-all duration-500"
        style={{
          width:      `${Math.min(pct, 100)}%`,
          background: pct >= 100 ? "#16a34a" : pct > 0 ? "#d97706" : "#dc2626",
        }}
      />
    </div>
  );
}

export default function PayPortalPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 size={28} className="animate-spin text-blue-900" />
      </div>
    }>
      <PayPortalContent />
    </Suspense>
  );
}

function PayPortalContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const { data: invoice, isLoading, error } = useQuery({
    queryKey: ["portal-invoice", token],
    queryFn:  () => getPortalInvoice(token!),
    enabled:  !!token,
    retry:    false,
  });

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-sm w-full text-center shadow-sm">
          <AlertCircle size={28} className="text-red-500 mx-auto mb-3" />
          <h1 className="text-lg font-semibold text-gray-900 mb-2">Invalid payment link</h1>
          <p className="text-sm text-gray-500">
            This link is missing a token. Please use the link from your email or contact the school.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 size={28} className="animate-spin text-blue-900" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-sm w-full text-center shadow-sm">
          <AlertCircle size={28} className="text-red-500 mx-auto mb-3" />
          <h1 className="text-lg font-semibold text-gray-900 mb-2">Link not found</h1>
          <p className="text-sm text-gray-500">
            This payment link may have expired. Please contact the school bursar.
          </p>
        </div>
      </div>
    );
  }

  const balance     = Number(invoice.balance);
  const amountPaid  = Number(invoice.amountPaid);
  const totalAmount = Number(invoice.totalAmount);
  const paid        = invoice.paymentStatus === "paid";
  const pct         = pctPaid(invoice);

  if (paid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-sm w-full text-center shadow-sm">
          <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={28} className="text-green-600" />
          </div>
          <h1 className="text-lg font-semibold text-gray-900 mb-1">Fully paid</h1>
          <p className="text-sm text-gray-500 mb-6">
            {invoice.student.firstName}&apos;s {invoice.termLabel} fees are fully settled. Thank you!
          </p>
          <div className="bg-gray-50 rounded-lg p-4 text-left border border-gray-100">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-500">Total amount</span>
              <span className="font-medium">{formatCurrency(totalAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Amount paid</span>
              <span className="font-semibold text-green-600">{formatCurrency(amountPaid)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center p-4 pt-10">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-blue-900 rounded-xl flex items-center justify-center mx-auto mb-3">
            <CreditCard size={22} className="text-white" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Fee Payment Portal</h1>
          <p className="text-sm text-gray-500 mt-1">School fee statement</p>
        </div>

        {/* Invoice details */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="font-semibold text-gray-900">
                {invoice.student.firstName} {invoice.student.lastName}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {invoice.student.admissionNumber
                  ? `Adm No: ${invoice.student.admissionNumber}`
                  : invoice.termLabel}
              </p>
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              invoice.paymentStatus === "partially_paid"
                ? "bg-amber-50 text-amber-700"
                : "bg-red-50 text-red-700"
            }`}>
              {invoice.paymentStatus === "partially_paid" ? "Partially Paid" : "Unpaid"}
            </span>
          </div>

          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            {invoice.termLabel}
          </p>

          {/* Line items */}
          {invoice.lineItems && invoice.lineItems.length > 0 && (
            <div className="border border-gray-100 rounded-lg overflow-hidden mb-4">
              {invoice.lineItems.map((item, i) => (
                <div
                  key={item.label}
                  className={`flex items-center justify-between px-4 py-2.5 text-sm ${
                    i < invoice.lineItems!.length - 1 ? "border-b border-gray-100" : ""
                  }`}
                >
                  <span className="text-gray-500">{item.label}</span>
                  <span className="font-medium">{formatCurrency(item.amount)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Summary */}
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Total fees</span>
              <span className="font-medium">{formatCurrency(totalAmount)}</span>
            </div>
            {amountPaid > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Already paid</span>
                <span className="font-medium text-green-600">{formatCurrency(amountPaid)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
              <span className="font-semibold text-gray-900">Outstanding balance</span>
              <span className="font-bold text-red-600 text-base">{formatCurrency(balance)}</span>
            </div>
          </div>

          {/* Progress bar */}
          {amountPaid > 0 && (
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Payment progress</span>
                <span>{pct}% paid</span>
              </div>
              <ProgressBar pct={pct} />
            </div>
          )}
        </div>

        {/* How to pay */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Building2 size={16} className="text-blue-900" />
            <h2 className="text-sm font-semibold text-gray-900">How to pay</h2>
          </div>
          <div className="flex flex-col gap-3 text-sm text-gray-600">
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <span className="font-bold text-blue-900 shrink-0">1.</span>
              <span>Visit the school bursar&apos;s office with the outstanding balance of <strong className="text-red-600">{formatCurrency(balance)}</strong>.</span>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="font-bold text-blue-900 shrink-0">2.</span>
              <span>You can pay in <strong>cash</strong>, via <strong>bank transfer</strong>, or at the <strong>POS terminal</strong>.</span>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="font-bold text-blue-900 shrink-0">3.</span>
              <span>The bursar will record your payment and issue you an <strong>official receipt</strong>.</span>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 pb-6">
          Questions? Contact the school bursar directly.
        </p>
      </div>
    </div>
  );
}