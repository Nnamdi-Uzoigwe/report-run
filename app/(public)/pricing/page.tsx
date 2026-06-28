import Link from "next/link";
import { Check, Minus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui";
import { FaqAccordion } from "@/components/public/FaqAccordion";
import React from "react";

// ── Data ─────────────────────────────────────────────────────

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: 75000,
    period: "per term",
    description: "For small schools getting their admin in order.",
    highlight: false,
    cta: "Get started",
    features: [
      "Up to 200 students",
      "3 admin users",
      "Student & staff records",
      "Fee collection ledger",
      "Email support",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    price: 150000,
    period: "per term",
    description: "For growing schools that need the full toolkit.",
    highlight: true,
    cta: "Get started",
    badge: "Most popular",
    features: [
      "Up to 800 students",
      "10 admin users",
      "Everything in Starter",
      "Results management",
      "PDF scraper",
      "SMS & email reminders",
      "Staff duty allocation",
      "Phone support",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    price: 450000,
    period: "per term",
    description: "For established schools with complex needs.",
    highlight: false,
    cta: "Get started",
    features: [
      "Up to 2,000 students",
      "Unlimited admin users",
      "Everything in Growth",
      "Multi-branch support",
      "Custom grade scales",
      "API access",
      "Dedicated onboarding",
      "Priority support",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: null,
    period: "custom pricing",
    description: "For school groups and large institutions.",
    highlight: false,
    cta: "Contact us",
    href: "/contact",
    features: [
      "Unlimited students",
      "Unlimited branches",
      "Everything in Professional",
      "Custom integrations",
      "SLA guarantee",
      "Dedicated account manager",
      "On-site training",
      "White-label option",
    ],
  },
];

type FeatureValue = boolean | string;

interface ComparisonFeature {
  category: string;
  items: {
    label: string;
    starter: FeatureValue;
    growth: FeatureValue;
    professional: FeatureValue;
    enterprise: FeatureValue;
  }[];
}

const comparisonFeatures: ComparisonFeature[] = [
  {
    category: "Students & Users",
    items: [
      { label: "Student records",  starter: "200",       growth: "800",        professional: "2,000",      enterprise: "Unlimited" },
      { label: "Admin users",      starter: "3",         growth: "10",         professional: "Unlimited",  enterprise: "Unlimited" },
      { label: "Staff records",    starter: true,        growth: true,         professional: true,         enterprise: true        },
    ],
  },
  {
    category: "Collections",
    items: [
      { label: "Fee ledger",           starter: true,  growth: true,  professional: true,  enterprise: true  },
      { label: "Payment tracking",     starter: true,  growth: true,  professional: true,  enterprise: true  },
      { label: "Automated reminders",  starter: false, growth: true,  professional: true,  enterprise: true  },
      { label: "SMS notifications",    starter: false, growth: true,  professional: true,  enterprise: true  },
    ],
  },
  {
    category: "Academics",
    items: [
      { label: "Results management",  starter: false, growth: true,  professional: true,  enterprise: true  },
      { label: "PDF scraper",         starter: false, growth: true,  professional: true,  enterprise: true  },
      { label: "Custom grade scales", starter: false, growth: false, professional: true,  enterprise: true  },
      { label: "Broadsheet export",   starter: false, growth: true,  professional: true,  enterprise: true  },
    ],
  },
  {
    category: "Operations",
    items: [
      { label: "Staff duty allocation", starter: false, growth: true,  professional: true,  enterprise: true  },
      { label: "Multi-branch",          starter: false, growth: false, professional: true,  enterprise: true  },
      { label: "API access",            starter: false, growth: false, professional: true,  enterprise: true  },
      { label: "White-label",           starter: false, growth: false, professional: false, enterprise: true  },
    ],
  },
  {
    category: "Support",
    items: [
      { label: "Email support",       starter: true,  growth: true,  professional: true,  enterprise: true  },
      { label: "Phone support",       starter: false, growth: true,  professional: true,  enterprise: true  },
      { label: "Dedicated onboarding",starter: false, growth: false, professional: true,  enterprise: true  },
      { label: "Account manager",     starter: false, growth: false, professional: false, enterprise: true  },
    ],
  },
];

const pricingFaqs = [
  { question: "Do you offer a free trial?",              answer: "Yes. Every plan comes with a 14-day free trial. No credit card required to start." },
  { question: "Can I switch plans later?",               answer: "Yes. You can upgrade or downgrade at the start of any new term. Unused credit is carried forward." },
  { question: "What currency are prices in?",            answer: "All prices are in Nigerian Naira (NGN). Payments are accepted via bank transfer, card, or USSD." },
  { question: "Is there a setup fee?",                   answer: "No setup fees on any plan. Enterprise plans may include optional paid on-site training." },
  { question: "What happens when my student limit is exceeded?", answer: "We will notify you and ask you to upgrade. We never cut off access abruptly." },
];

// ── Sub-components ────────────────────────────────────────────

function FeatureCell({ value }: { value: FeatureValue }) {
  if (value === true)  return <Check size={16} className="text-success mx-auto" aria-label="Included" />;
  if (value === false) return <Minus size={16} className="text-border mx-auto"  aria-label="Not included" />;
  return <span className="text-sm text-text-primary">{value}</span>;
}

function PlanCard({ plan }: { plan: typeof plans[number] }) {
  const href = plan.href ?? "/contact";

  return (
    <div
      className={`relative flex flex-col rounded-lg border p-6 ${
        plan.highlight
          ? "border-navy-600 bg-navy-600"
          : "border-border bg-surface"
      }`}
    >
      {plan.badge && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-navy-600 text-white text-xs font-semibold rounded-full border-2 border-white">
          {plan.badge}
        </span>
      )}

      <div className="mb-6">
        <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${plan.highlight ? "text-navy-200" : "text-text-muted"}`}>
          {plan.name}
        </p>
        <div className="flex items-baseline gap-1 mb-2">
          {plan.price !== null ? (
            <>
              <span className={`text-3xl font-semibold ${plan.highlight ? "text-white" : "text-text-primary"}`}>
                ₦{plan.price.toLocaleString()}
              </span>
              <span className={`text-sm ${plan.highlight ? "text-navy-200" : "text-text-muted"}`}>
                /{plan.period}
              </span>
            </>
          ) : (
            <span className={`text-3xl font-semibold ${plan.highlight ? "text-white" : "text-text-primary"}`}>
              Custom
            </span>
          )}
        </div>
        <p className={`text-sm ${plan.highlight ? "text-navy-200" : "text-text-secondary"}`}>
          {plan.description}
        </p>
      </div>

      <ul className="flex flex-col gap-3 mb-8 flex-1">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5">
            <Check
              size={14}
              className={`mt-0.5 shrink-0 ${plan.highlight ? "text-navy-200" : "text-success"}`}
            />
            <span className={`text-sm ${plan.highlight ? "text-navy-100" : "text-text-secondary"}`}>
              {feature}
            </span>
          </li>
        ))}
      </ul>

      <Link href={href}>
        <Button
          fullWidth
          variant={plan.highlight ? "secondary" : "primary"}
          className={plan.highlight ? "bg-white! text-navy-600! hover:bg-navy-50! border-white!" : ""}
        >
          {plan.cta}
          <ArrowRight size={14} />
        </Button>
      </Link>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────

export default function PricingPage() {
  return (
    <>
      {/* Header */}
      <section className="section-pad border-b border-border bg-surface">
        <div className="container-page text-center max-w-2xl mx-auto">
          <p className="text-xs font-semibold text-navy-600 uppercase tracking-wide mb-2">
            Pricing
          </p>
          <h1 className="text-4xl font-semibold text-text-primary mb-4">
            Simple, term-based pricing
          </h1>
          <p className="text-lg text-text-secondary">
            Pay per term, not per month. No hidden fees, no long-term contracts.
            Upgrade or downgrade as your school grows.
          </p>
        </div>
      </section>

      {/* Plan cards */}
      <section className="section-pad border-b border-border bg-surface-secondary">
        <div className="container-page">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>
          <p className="text-center text-sm text-text-muted mt-8">
            All plans include a 14-day free trial. No credit card required.
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
                  {["Starter", "Growth", "Professional", "Enterprise"].map((p) => (
                    <th key={p} className="text-center px-4 py-3 text-xs font-semibold text-text-primary uppercase tracking-wide">
                      {p}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((group) => (
                  <React.Fragment key={group.category}>
                    <tr key={group.category} className="bg-surface-secondary border-b border-border">
                      <td
                        colSpan={5}
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
                        <td className="px-4 py-3 text-center"><FeatureCell value={item.starter} /></td>
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
            Start your free trial today
          </h2>
          <p className="text-navy-200 mb-8 max-w-md mx-auto">
            14 days free on any plan. No credit card, no commitment.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/contact">
              <Button
                size="lg"
                className="bg-white! text-navy-600! hover:bg-navy-50! border-white!"
              >
                Get started free
                <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}