import Link from "next/link";
import { Check, Minus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui";
import { FaqAccordion } from "@/components/public/FaqAccordion";
import React from "react";
import type { Plan } from "@/types";
import { PlanCards } from "@/components/public/PlanCards";

// ── Server-side plan fetch ────────────────────────────────────

async function getPlans(): Promise<Plan[]> {
  try {
    const base = process.env.NEXT_PUBLIC_API_URL ?? "https://school-mgt-server.vercel.app/api/v1";
    const res  = await fetch(`${base}/subscriptions/plans`, {
      next: { revalidate: 3600 }, // Cache for 1 hour — plans rarely change
    });
    if (!res.ok) throw new Error("Failed to fetch plans");
    const json = await res.json();
    return (json.data ?? json) as Plan[];
  } catch {
    return [];
  }
}

// ── Comparison table (static — mirrors the DB features array) ─

type FeatureValue = boolean | string;

interface ComparisonRow {
  label:        string;
  free:         FeatureValue;
  basic:        FeatureValue;
  growth:       FeatureValue;
  professional: FeatureValue;
  enterprise:   FeatureValue;
}

interface ComparisonSection {
  category: string;
  items:    ComparisonRow[];
}

const comparisonFeatures: ComparisonSection[] = [
  {
    category: "Students & Users",
    items: [
      { label: "Student records",  free: "3",   basic: "200",  growth: "800",  professional: "2,000", enterprise: "Unlimited" },
      { label: "Admin users",      free: "1",   basic: "3",    growth: "10",   professional: "Unlimited", enterprise: "Unlimited" },
      { label: "Staff records",    free: false, basic: true,   growth: true,   professional: true,    enterprise: true },
    ],
  },
  {
    category: "Collections",
    items: [
      { label: "Fee ledger",            free: true,  basic: true,  growth: true,  professional: true,  enterprise: true  },
      { label: "Payment tracking",      free: true,  basic: true,  growth: true,  professional: true,  enterprise: true  },
      { label: "Automated reminders",   free: false, basic: false, growth: true,  professional: true,  enterprise: true  },
      { label: "SMS notifications",     free: false, basic: false, growth: true,  professional: true,  enterprise: true  },
    ],
  },
  {
    category: "Academics",
    items: [
      { label: "Results management",  free: false, basic: false, growth: true,  professional: true,  enterprise: true  },
      { label: "PDF scraper",         free: false, basic: false, growth: true,  professional: true,  enterprise: true  },
      { label: "Custom grade scales", free: false, basic: false, growth: false, professional: true,  enterprise: true  },
      { label: "Broadsheet export",   free: false, basic: false, growth: true,  professional: true,  enterprise: true  },
    ],
  },
  {
    category: "Operations",
    items: [
      { label: "Staff duty allocation", free: false, basic: false, growth: true,  professional: true,  enterprise: true  },
      { label: "Multi-branch",          free: false, basic: false, growth: false, professional: true,  enterprise: true  },
      { label: "API access",            free: false, basic: false, growth: false, professional: true,  enterprise: true  },
      { label: "White-label",           free: false, basic: false, growth: false, professional: false, enterprise: true  },
    ],
  },
  {
    category: "Support",
    items: [
      { label: "Email support",        free: true,  basic: true,  growth: true,  professional: true,  enterprise: true  },
      { label: "Phone support",        free: false, basic: false, growth: true,  professional: true,  enterprise: true  },
      { label: "Dedicated onboarding", free: false, basic: false, growth: false, professional: true,  enterprise: true  },
      { label: "Account manager",      free: false, basic: false, growth: false, professional: false, enterprise: true  },
    ],
  },
];

const pricingFaqs = [
  { question: "Do you offer a free plan?",                     answer: "Yes. The Free plan supports up to 3 students and 1 admin user at no cost, forever." },
  { question: "Can I switch plans later?",                     answer: "Yes. You can upgrade at any time from your dashboard. Downgrade takes effect from the next billing cycle." },
  { question: "What currency are prices in?",                  answer: "All prices are in Nigerian Naira (NGN). Payments are processed securely via Paystack." },
  { question: "Is there a setup fee?",                         answer: "No setup fees on any plan. Enterprise plans may include optional paid on-site training." },
  { question: "What happens when my student limit is reached?", answer: "We will notify you and ask you to upgrade. We never cut off access abruptly mid-term." },
];

// ── Sub-components ────────────────────────────────────────────

function FeatureCell({ value }: { value: FeatureValue }) {
  if (value === true)  return <Check size={16} className="text-success mx-auto" aria-label="Included" />;
  if (value === false) return <Minus size={16} className="text-border mx-auto"  aria-label="Not included" />;
  return <span className="text-sm text-text-primary">{value}</span>;
}

// ── Page ──────────────────────────────────────────────────────

export default async function PricingPage() {
  const plans = await getPlans();

  const planHeaders = ["Free", "Basic", "Growth", "Professional", "Enterprise"];

  return (
    <>
      {/* Header */}
      <section className="section-pad border-b border-border bg-surface">
        <div className="container-page text-center max-w-2xl mx-auto">
          <p className="text-xs font-semibold text-navy-600 uppercase tracking-wide mb-2">
            Pricing
          </p>
          <h1 className="text-4xl font-semibold text-navy-700 mb-4">
            Simple, term-based pricing
          </h1>
          <p className="text-lg text-text-secondary">
            Pay per term, not per month. No hidden fees, no long-term contracts.
            Start free and upgrade as your school grows.
          </p>
        </div>
      </section>

      {/* Plan cards — client component handles the Paystack CTA */}
      <section className="section-pad border-b border-border bg-surface-secondary">
        <div className="container-page">
          <PlanCards plans={plans} />
          <p className="text-center text-sm text-text-muted mt-8">
            Free plan available forever. Paid plans billed per term.
          </p>
        </div>
      </section>

      {/* Comparison table */}
      <section className="section-pad border-b border-border">
        <div className="container-page">
          <div className="max-w-xl mb-10">
            <p className="text-xs font-semibold text-navy-600 uppercase tracking-wide mb-2">
              Compare plans
            </p>
            <h2 className="text-3xl font-semibold text-text-primary">
              Everything side by side
            </h2>
          </div>

          <div className="overflow-x-auto border border-border rounded-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-secondary">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide w-1/3">
                    Feature
                  </th>
                  {planHeaders.map((p) => (
                    <th key={p} className="text-center px-4 py-3 text-xs font-semibold text-text-primary uppercase tracking-wide">
                      {p}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((group) => (
                  <React.Fragment key={group.category}>
                    <tr className="bg-surface-secondary border-b border-border">
                      <td
                        colSpan={6}
                        className="px-5 py-2 text-xs font-semibold text-text-muted uppercase tracking-wide"
                      >
                        {group.category}
                      </td>
                    </tr>
                    {group.items.map((item) => (
                      <tr
                        key={item.label}
                        className="border-b border-border last:border-0 hover:bg-surface-secondary transition-colors duration-100"
                      >
                        <td className="px-5 py-3 text-text-secondary">{item.label}</td>
                        <td className="px-4 py-3 text-center"><FeatureCell value={item.free} /></td>
                        <td className="px-4 py-3 text-center"><FeatureCell value={item.basic} /></td>
                        <td className="px-4 py-3 text-center"><FeatureCell value={item.growth} /></td>
                        <td className="px-4 py-3 text-center"><FeatureCell value={item.professional} /></td>
                        <td className="px-4 py-3 text-center"><FeatureCell value={item.enterprise} /></td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-pad border-b border-border bg-surface-secondary">
        <div className="container-page">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <p className="text-xs font-semibold text-navy-600 uppercase tracking-wide mb-2">
                FAQ
              </p>
              <h2 className="text-3xl font-semibold text-text-primary mb-3">
                Pricing questions
              </h2>
              <p className="text-text-secondary mb-6">
                Have a question not answered here? Talk to our team.
              </p>
              <Link href="/contact">
                <Button variant="secondary">
                  Talk to sales
                  <ArrowRight size={14} />
                </Button>
              </Link>
            </div>
            <FaqAccordion items={pricingFaqs} />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-pad bg-navy-600">
        <div className="container-page text-center">
          <h2 className="text-3xl font-semibold text-white mb-4">
            Start free today
          </h2>
          <p className="text-navy-200 mb-8 max-w-md mx-auto">
            Get started on the Free plan with no credit card. Upgrade when
            you&apos;re ready.
          </p>
          <Link href="/setup">
            <Button
              size="lg"
              className="bg-white! text-navy-600! hover:bg-navy-50! border-white!"
            >
              Create free account
              <ArrowRight size={16} />
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
}