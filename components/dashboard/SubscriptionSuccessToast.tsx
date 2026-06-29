"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/store";
import { keys } from "@/lib/queries/keys";

function SubscriptionSuccessToastContent() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const schoolId = useAuthStore((s) => s.schoolId);

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (searchParams.get("subscription") !== "success") return;

    setVisible(true);

    // Refresh subscription data so the plan badge updates immediately
    if (schoolId) {
      queryClient.invalidateQueries({
        queryKey: keys.subscription.active(schoolId),
      });
    }

    // Clean the query param from the URL without a full navigation
    const url = new URL(window.location.href);
    url.searchParams.delete("subscription");
    window.history.replaceState({}, "", url.toString());

    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(timer);
  }, [searchParams, schoolId, queryClient]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-success text-white text-sm font-medium rounded-lg shadow-lg max-w-xs">
      <CheckCircle size={16} className="shrink-0" />
      <span>Subscription activated successfully.</span>
      <button
        onClick={() => setVisible(false)}
        className="ml-auto text-white/70 hover:text-white transition-colors cursor-pointer"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function SubscriptionSuccessToast() {
  return (
    <Suspense fallback={null}>
      <SubscriptionSuccessToastContent />
    </Suspense>
  );
}