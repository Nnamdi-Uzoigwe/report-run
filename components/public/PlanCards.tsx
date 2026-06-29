"use client";

import { useRouter } from "next/navigation";
import { Check, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui";
import { useAuthStore } from "@/lib/store";
import { useInitiateSubscription } from "@/lib/queries/school";
import type { Plan } from "@/types";

// ── Helpers ───────────────────────────────────────────────────

function formatPrice(priceKobo: number): string {
  return `₦${(priceKobo / 100).toLocaleString("en-NG")}`;
}

// Determines the visual highlight for the "most popular" plan
function isHighlighted(plan: Plan): boolean {
  return plan.slug === "growth";
}

// ── Plan card ─────────────────────────────────────────────────

function PlanCard({
  plan,
  onSelect,
  isLoading,
}: {
  plan: Plan;
  onSelect: (planId: string) => void;
  isLoading: boolean;
}) {
  const highlighted = isHighlighted(plan);

  return (
    <div
      className={`relative flex flex-col rounded-lg border p-6 ${
        highlighted
          ? "border-navy-600 bg-navy-600"
          : "border-border bg-surface"
      }`}
    >
      {highlighted && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-navy-600 text-white text-xs font-semibold rounded-full border-2 border-white">
          Most popular
        </span>
      )}

      <div className="mb-6">
        <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${highlighted ? "text-navy-200" : "text-text-muted"}`}>
          {plan.name}
        </p>
        <div className="flex items-baseline gap-1 mb-2">
          {plan.priceKobo === 0 ? (
            <span className={`text-3xl font-semibold ${highlighted ? "text-white" : "text-text-primary"}`}>
              Free
            </span>
          ) : plan.isCustom ? (
            <span className={`text-3xl font-semibold ${highlighted ? "text-white" : "text-text-primary"}`}>
              Custom
            </span>
          ) : (
            <>
              <span className={`text-3xl font-semibold ${highlighted ? "text-white" : "text-text-primary"}`}>
                {formatPrice(plan.priceKobo)}
              </span>
              <span className={`text-sm ${highlighted ? "text-navy-200" : "text-text-muted"}`}>
                /per {plan.billingCycle}
              </span>
            </>
          )}
        </div>
        {plan.description && (
          <p className={`text-sm ${highlighted ? "text-navy-200" : "text-text-secondary"}`}>
            {plan.description}
          </p>
        )}
      </div>

      <ul className="flex flex-col gap-3 mb-8 flex-1">
        {plan.highlights.map((highlight) => (
          <li key={highlight} className="flex items-start gap-2.5">
            <Check
              size={14}
              className={`mt-0.5 shrink-0 ${highlighted ? "text-navy-200" : "text-success"}`}
            />
            <span className={`text-sm ${highlighted ? "text-navy-100" : "text-text-secondary"}`}>
              {highlight}
            </span>
          </li>
        ))}
      </ul>

      <Button
        fullWidth
        variant={highlighted ? "secondary" : "primary"}
        className={highlighted ? "bg-white! text-navy-600! hover:bg-navy-50! border-white!" : ""}
        loading={isLoading}
        onClick={() => onSelect(plan.id)}
      >
        {plan.isCustom ? "Contact us" : plan.priceKobo === 0 ? "Get started free" : "Get started"}
        <ArrowRight size={14} />
      </Button>
    </div>
  );
}

// ── PlanCards ─────────────────────────────────────────────────

export function PlanCards({ plans }: { plans: Plan[] }) {
  const router      = useRouter();
  const schoolId    = useAuthStore((s) => s.schoolId);
  const isAuthed    = useAuthStore((s) => s.isAuthenticated);
  const initiateSub = useInitiateSubscription();

  function handleSelect(plan: Plan) {
    // Enterprise — go to contact
    if (plan.isCustom) {
      router.push("/contact");
      return;
    }

    // Not logged in — go to setup to create account first
    if (!isAuthed || !schoolId) {
      router.push("/setup");
      return;
    }

    // Free plan — activate without payment
    if (plan.priceKobo === 0) {
      router.push("/dashboard");
      return;
    }

    // Paid plan — initiate Paystack flow
    initiateSub.mutate(plan.id, {
      onSuccess: (data) => {
        // Redirect to Paystack checkout
        window.location.href = data.authorizationUrl;
      },
      onError: (err) => {
        alert((err as Error).message);
      },
    });
  }

  if (plans.length === 0) {
    // Fallback if the API fetch failed — still show the setup CTA
    return (
      <div className="text-center py-12">
        <p className="text-text-muted text-sm mb-4">
          Unable to load plans. Please try again.
        </p>
        <Button onClick={() => router.push("/setup")}>
          Get started free
        </Button>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      {plans.map((plan) => (
        <PlanCard
          key={plan.id}
          plan={plan}
          onSelect={() => handleSelect(plan)}
          isLoading={initiateSub.isPending}
        />
      ))}
    </div>
  );
}