"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { clientFetch } from "@/lib/client-fetch";
import { CheckCircle, AlertCircle, Loader2, CreditCard, Building2 } from "lucide-react";
import type { FeeInvoice } from "@/types";

// ── API calls (no auth needed — public portal) ────────────────

async function getPortalInvoice(token: string): Promise<FeeInvoice> {
  return clientFetch<FeeInvoice>(`/fees/portal/${token}`);
}

async function initiatePaystackPayment(
  token: string,
  amount: number,
): Promise<{ authorizationUrl: string; reference: string }> {
  return clientFetch(`/fees/portal/${token}/pay`, {
    method: "POST",
    body:   { amount },
  });
}

// ── Helpers ───────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style:    "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
}

function pctPaid(invoice: FeeInvoice): number {
  const total = Number(invoice.totalAmount);
  if (total === 0) return 0;
  return Math.round((Number(invoice.amountPaid) / total) * 100);
}

// ── Sub-components ────────────────────────────────────────────

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

// ── Page ──────────────────────────────────────────────────────

function PayPortalPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [amountInput, setAmountInput] = useState("");
  const [inputError,  setInputError ] = useState<string | null>(null);

  const {
    data:      invoice,
    isLoading: invoiceLoading,
    error:     invoiceError,
  } = useQuery({
    queryKey: ["portal-invoice", token],
    queryFn:  () => getPortalInvoice(token!),
    enabled:  !!token,
    retry:    false,
  });

  const initiatePay = useMutation({
    mutationFn: (amount: number) => initiatePaystackPayment(token!, amount),
    onSuccess: (data) => {
      window.location.href = data.authorizationUrl;
    },
  });

  // ── Invalid / missing token ───────────────────────────────

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-sm w-full text-center shadow-sm">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={24} className="text-red-500" />
          </div>
          <h1 className="text-lg font-semibold text-gray-900 mb-2">Invalid payment link</h1>
          <p className="text-sm text-gray-500">
            This link is missing a token. Please use the link from the email we sent you,
            or contact the school for a new payment link.
          </p>
        </div>
      </div>
    );
  }

  // ── Loading ───────────────────────────────────────────────

  if (invoiceLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={28} className="animate-spin text-blue-900" />
          <p className="text-sm text-gray-500">Loading your payment details...</p>
        </div>
      </div>
    );
  }

  // ── Error (invoice not found) ─────────────────────────────

  if (invoiceError || !invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-sm w-full text-center shadow-sm">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={24} className="text-red-500" />
          </div>
          <h1 className="text-lg font-semibold text-gray-900 mb-2">Payment link not found</h1>
          <p className="text-sm text-gray-500">
            This payment link may have expired or is invalid. Please contact
            the school bursar for a new one.
          </p>
        </div>
      </div>
    );
  }

  const balance      = Number(invoice.balance);
  const amountPaid   = Number(invoice.amountPaid);
  const totalAmount  = Number(invoice.totalAmount);
  const paid         = invoice.paymentStatus === "paid";
  const pct          = pctPaid(invoice);

  // ── Fully paid ────────────────────────────────────────────

  if (paid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-sm w-full text-center shadow-sm">
          <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={28} className="text-green-600" />
          </div>
          <h1 className="text-lg font-semibold text-gray-900 mb-1">Fully paid</h1>
          <p className="text-sm text-gray-500 mb-6">
            {invoice.student.firstName}&apos;s {invoice.termLabel} fees have been
            fully settled. Thank you!
          </p>
          <div className="bg-gray-50 rounded-lg p-4 text-left border border-gray-100">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-500">Total amount</span>
              <span className="font-medium text-gray-900">{formatCurrency(totalAmount)}</span>
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

  // ── Outstanding balance ───────────────────────────────────

  function handlePayOnline() {
    setInputError(null);
    const amount = Number(amountInput);

    if (!amountInput || isNaN(amount) || amount <= 0) {
      setInputError("Enter the amount you want to pay.");
      return;
    }
    if (amount > balance) {
      setInputError(`Amount cannot exceed the outstanding balance of ${formatCurrency(balance)}.`);
      return;
    }
    if (amount < 100) {
      setInputError("Minimum payment amount is ₦100.");
      return;
    }

    initiatePay.mutate(amount);
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
          <p className="text-sm text-gray-500 mt-1">Secure payment for school fees</p>
        </div>

        {/* Student info */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="font-semibold text-gray-900">
                {invoice.student.firstName} {invoice.student.lastName}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {invoice.student.admissionNumber
                  ? `Admission No: ${invoice.student.admissionNumber}`
                  : invoice.termLabel}
              </p>
            </div>
            <span className={`
              text-xs font-semibold px-2.5 py-1 rounded-full
              ${invoice.paymentStatus === "partially_paid"
                ? "bg-amber-50 text-amber-700"
                : "bg-red-50 text-red-700"}
            `}>
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
                  <span className="font-medium text-gray-900">{formatCurrency(item.amount)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Summary */}
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Total fees</span>
              <span className="font-medium text-gray-900">{formatCurrency(totalAmount)}</span>
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

          {/* Progress */}
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

        {/* Pay online */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Pay online</h2>
          <p className="text-xs text-gray-400 mb-4">
            Pay securely with your card, bank transfer, or USSD via Paystack.
          </p>

          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Amount to pay (₦)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₦</span>
              <input
                type="number"
                min={100}
                max={balance}
                value={amountInput}
                onChange={(e) => {
                  setAmountInput(e.target.value);
                  setInputError(null);
                }}
                placeholder={balance.toString()}
                className="w-full pl-7 pr-3 h-11 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent placeholder:text-gray-300"
              />
            </div>
            {inputError && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle size={11} />
                {inputError}
              </p>
            )}
            {initiatePay.error && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle size={11} />
                {(initiatePay.error as Error).message}
              </p>
            )}
          </div>

          {/* Quick amount buttons */}
          <div className="flex gap-2 mb-4">
            {[25, 50, 75, 100].map((pctBtn) => {
              const amt = Math.round((balance * pctBtn) / 100);
              if (amt < 100) return null;
              return (
                <button
                  key={pctBtn}
                  type="button"
                  onClick={() => { setAmountInput(String(amt)); setInputError(null); }}
                  className="flex-1 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 hover:border-blue-900 hover:text-blue-900 transition-colors cursor-pointer"
                >
                  {pctBtn === 100 ? "Full" : `${pctBtn}%`}
                </button>
              );
            })}
          </div>

          <button
            onClick={handlePayOnline}
            disabled={initiatePay.isPending}
            className="w-full h-11 bg-blue-900 hover:bg-blue-800 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {initiatePay.isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Redirecting to Paystack...
              </>
            ) : (
              <>
                <CreditCard size={16} />
                Pay with Paystack
              </>
            )}
          </button>

          <p className="text-center text-xs text-gray-400 mt-3">
            🔒 Secured by Paystack · Card · Bank Transfer · USSD
          </p>
        </div>

        {/* Pay at school */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Building2 size={16} className="text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900">Pay at school</h2>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            You can also pay in cash or by bank transfer at the bursar&apos;s office.
            Bring your teller or payment receipt — the bursar will update your account
            and issue a receipt.
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 pb-6">
          Having trouble? Contact the school bursar directly.
        </p>
      </div>
    </div>
  );
}

export function PayPortalMainPage() {
  return (
    <Suspense fallback={null}>
      <PayPortalPage />
    </Suspense>
  );
}