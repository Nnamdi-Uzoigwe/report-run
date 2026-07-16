import Link from "next/link";
import {
  CheckCircle, ArrowRight, Users, BookOpen,
  CreditCard, Bell, FileText, BarChart2,
} from "lucide-react";
import { Button } from "@/components/ui";
import { HeroDashboard } from "@/components/public/HeroDashboard";
import { FaqAccordion }  from "@/components/public/FaqAccordion";

// ── Data ─────────────────────────────────────────────────────

const features = [
  { icon: Users,    title: "Staff Duty Allocation",  description: "Assign and track staff duties across the week. Morning assembly, gate duty, exam supervision — all in one view." },
  { icon: FileText, title: "Results Management",     description: "Upload student results via PDF scraper or manual entry. Generate broadsheets and report cards instantly." },
  { icon: CreditCard, title: "Fee Collection Ledger", description: "Track every payment, flag outstanding balances, and send automated reminders to parents via SMS or email." },
  { icon: Bell,     title: "Automated Reminders",    description: "Set trigger rules for fee reminders. The system sends them — you focus on running the school." },
  { icon: BookOpen, title: "Academics Control",      description: "Manage subjects, class assignments, grading scales, and term configurations from a single dashboard." },
  { icon: BarChart2, title: "Dashboard Insights",   description: "Get a real-time snapshot of collection rates, attendance, and academic performance every morning." },
];

const steps = [
  { number: "1", title: "Set up your school",      description: "Enter your school details, configure terms, and import your class structure in under 10 minutes." },
  { number: "2", title: "Add staff and students",  description: "Bulk import or add individually. Assign form teachers, subjects, and sections." },
  { number: "3", title: "Run your school",          description: "Allocate duties, record results, collect fees, and communicate with parents — all from one place." },
];

const testimonials = [
  { quote: "Before EduNovtryx, we spent three days every term just compiling result sheets. Now it takes two hours.", name: "Mrs. Adaeze Okafor",  title: "Vice Principal, Academics", school: "Greenfield Academy, Abuja" },
  { quote: "The fee reminder system alone has improved our collection rate from 61% to 89% in one term.",            name: "Mr. Tunde Balogun",  title: "Bursar",                    school: "Heritage International School, Lagos" },
  { quote: "Our parents appreciate the SMS updates. It has reduced phone calls to the school office drastically.",   name: "Mrs. Chioma Eze",    title: "School Administrator",      school: "Sunrise Academy, Enugu" },
];

const faqs = [
  { question: "Do I need technical knowledge to use EduNovtryx?",  answer: "No. EduNovtryx is designed for school administrators, not IT staff. If you can use WhatsApp, you can use ReportRun." },
  { question: "Can I import existing student data?",              answer: "Yes. You can upload student records via Excel or CSV. Our PDF scraper also extracts results directly from existing report card PDFs." },
  { question: "How does the SMS reminder system work?",           answer: "You configure trigger rules — for example, send a reminder 7 days before the fee due date. The system handles delivery automatically to parent phone numbers on record." },
  { question: "Is my school's data secure?",                      answer: "All data is encrypted at rest and in transit. Each school's data is fully isolated — no other school can access your records." },
  { question: "What happens if I need help?",                     answer: "Every plan includes email support. Growth and Enterprise plans include dedicated phone support and onboarding assistance." },
];

const stats = [
  { value: "400+",  label: "Schools onboarded"    },
  { value: "180k+", label: "Students managed"      },
  { value: "89%",   label: "Avg. collection rate"  },
  { value: "3hrs",  label: "Saved per result term" },
];

// ── Sections ─────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-navy-600 uppercase tracking-wide mb-2">
      {children}
    </p>
  );
}

// ── Page ──────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="section-pad border-b border-border bg-surface">
        <div className="container-page">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-navy-50 border border-navy-100 rounded text-xs font-medium text-navy-600 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-navy-600 inline-block" />
                Built for Nigerian schools
              </div>
              <h1 className="text-4xl lg:text-5xl font-semibold text-navy-600 leading-tight mb-6">
                Run your school.<br />
                Not spreadsheets.
              </h1>
              <p className="text-lg text-text-secondary leading-relaxed mb-8 max-w-lg">
                EduNovtryx handles staff duties, student results, fee collections,
                and parent communication so your admin team can focus on what
                actually matters.
              </p>
              <div className="flex flex-wrap items-center gap-4 mb-8">
                <Link href="/contact">
                  <Button size="lg">
                    Get started free
                    <ArrowRight size={16} />
                  </Button>
                </Link>
                <Link href="/features">
                  <Button size="lg" variant="secondary">
                    See all features
                  </Button>
                </Link>
              </div>
              <div className="flex flex-wrap items-center gap-6">
                {["No credit card required", "Setup in under 10 minutes", "Cancel anytime"].map((item) => (
                  <span key={item} className="flex items-center gap-1.5 text-sm text-text-muted">
                    <CheckCircle size={14} className="text-success shrink-0" />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* Right — dashboard mockup */}
            <div className="hidden lg:block">
              <HeroDashboard />
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="border-b border-border bg-surface-secondary">
        <div className="container-page py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-semibold text-navy-600">{stat.value}</p>
                <p className="text-sm text-text-muted mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="section-pad border-b border-border">
        <div className="container-page">
          <div className="max-w-xl mb-12">
            <SectionLabel>What EduNovtryx does</SectionLabel>
            <h2 className="text-3xl font-semibold text-navy-600 mb-3">
              Every tool your admin office needs
            </h2>
            <p className="text-text-secondary">
              Purpose-built for the realities of Nigerian school administration.
              No bloat. No features you will never use.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border rounded-lg overflow-hidden">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="p-6 bg-surface hover:bg-surface-secondary transition-colors duration-150"
                >
                  <div className="p-2 bg-navy-50 rounded w-fit mb-4">
                    <Icon size={18} className="text-navy-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-text-primary mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="mt-8">
            <Link href="/features">
              <Button variant="secondary">
                View all features
                <ArrowRight size={14} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="section-pad border-b border-border bg-surface-secondary">
        <div className="container-page">
          <div className="max-w-xl mb-12">
            <SectionLabel>How it works</SectionLabel>
            <h2 className="text-3xl font-semibold text-navy-600 mb-3">
              Up and running in a day
            </h2>
            <p className="text-text-secondary">
              Most schools are fully operational on EduNovtryx within 24 hours of signing up.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={step.number} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-5 left-full w-full h-px bg-border -translate-x-4 z-0" />
                )}
                <div className="relative z-10">
                  <div className="w-10 h-10 rounded-lg bg-navy-600 text-white flex items-center justify-center text-sm font-semibold mb-4">
                    {step.number}
                  </div>
                  <h3 className="text-sm font-semibold text-text-primary mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="section-pad border-b border-border">
        <div className="container-page">
          <div className="max-w-xl mb-12">
            <SectionLabel>What schools say</SectionLabel>
            <h2 className="text-3xl font-semibold text-navy-600">
              Trusted by school administrators
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="p-6 bg-surface border border-border rounded-lg flex flex-col gap-4 hover:border-border-strong transition-colors duration-150"
              >
                <p className="text-sm text-text-secondary leading-relaxed flex-1">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="border-t border-border pt-4">
                  <p className="text-sm font-semibold text-text-primary">{t.name}</p>
                  <p className="text-xs text-text-muted mt-0.5">{t.title}</p>
                  <p className="text-xs text-text-muted">{t.school}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="section-pad border-b border-border bg-surface-secondary">
        <div className="container-page">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <SectionLabel>FAQ</SectionLabel>
              <h2 className="text-3xl font-semibold text-navy-600 mb-3">
                Common questions
              </h2>
              <p className="text-text-secondary mb-6">
                Can&apos;t find what you&apos;re looking for? Reach out to our team.
              </p>
              <Link href="/contact">
                <Button variant="secondary">
                  Contact us
                  <ArrowRight size={14} />
                </Button>
              </Link>
            </div>
            <FaqAccordion items={faqs} />
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="section-pad bg-navy-600">
        <div className="container-page text-center">
          <h2 className="text-3xl font-semibold text-white mb-4">
            Ready to simplify your school admin?
          </h2>
          <p className="text-navy-200 mb-8 max-w-md mx-auto">
            Join 400+ Nigerian schools already running on EduNovtryx.
            No contracts, no setup fees.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/contact">
              <Button
                size="lg"
                className="bg-white! text-navy-600! hover:bg-navy-50! border-white! hover:border-navy-50!"
              >
                Get started free
                <ArrowRight size={16} />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button
                size="lg"
                variant="ghost"
                className="text-white! hover:bg-navy-700! border-navy-500!"
              >
                View pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}