"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";

function SuccessContent() {
  const searchParams = useSearchParams();
  const token     = searchParams.get("token");
  const reference = searchParams.get("reference");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 max-w-sm w-full text-center">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-green-600" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
        <p className="text-sm text-gray-500 mb-6">
          Your payment has been received and is being processed.
          Your account will be updated shortly.
        </p>
        {reference && (
          <p className="text-xs text-gray-400 mb-6 font-mono bg-gray-50 rounded p-2">
            Ref: {reference}
          </p>
        )}
        {token && (
          <Link
            href={`/pay?token=${token}`}
            className="block w-full py-2.5 px-4 bg-blue-900 hover:bg-blue-800 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            View updated balance
          </Link>
        )}
      </div>
    </div>
  );
}

export default function PaySuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 size={28} className="animate-spin text-blue-900" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}