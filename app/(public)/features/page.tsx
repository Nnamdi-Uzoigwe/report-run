import Link from "next/link";
import {
  Users, FileText, CreditCard, Bell,
  BookOpen, BarChart2, Shield, Clock,
  ArrowRight, CheckCircle, Download,
  MessageSquare, Layout, Settings,
} from "lucide-react";
import { Button } from "@/components/ui";

// ── Data ─────────────────────────────────────────────────────

const featureGroups = [
  {
    id: "collections",
    icon: CreditCard,
    label: "Collections",
    title: "Fee collection that actually gets collected",
    description:
      "Most schools lose 20–30% of expected fees simply because follow-up is manual and inconsistent. ReportRun automates the entire collection cycle — from invoice to receipt to reminder.",
    features: [
      "Per-student fee ledger with running balance",
      "Record cash, bank transfer, POS, and online payments",
      "Auto-generate receipts with unique receipt numbers",
      "Flag partial payments and outstanding balances",
      "Fee category setup per class and per term",
      "Export payment records to Excel",
    ],
    stats: [
      { value: "89%", label: "Average collection rate on ReportRun" },
      { value: "3×",  label: "Faster than manual ledger reconciliation" },
    ],
  },
  {
    id: "reminders",
    icon: Bell,
    label: "Reminders",
    title: "Automated reminders that run without you",
    description:
      "Configure your reminder rules once per term. ReportRun sends SMS and email reminders to parents on your schedule — days before the due date, on the due date, and after.",
    features: [
      "Set trigger rules by days before due date",
      "Send via SMS, email, or both",
      "Customise message per fee category",
      "Target all students or specific classes",
      "View delivery status per message",
      "Pause or disable any reminder rule instantly",
    ],
    stats: [
      { value: "61% → 89%", label: "Collection rate improvement reported by schools" },
      { value: "0 calls",   label: "Manual follow-up calls needed" },
    ],
  },
  {
    id: "results",
    icon: FileText,
    label: "Results",
    title: "Results management without the headache",
    description:
      "From data entry to broadsheet to report card — ReportRun handles the full results pipeline. The PDF scraper pulls results directly from uploaded documents so you never retype scores again.",
    features: [
      "Manual result entry per subject per student",
      "PDF scraper to extract scores from uploaded files",
      "Configurable CA and exam score weighting",
      "Auto-grade calculation based on your grade scale",
      "Generate class broadsheets instantly",
      "Publish results to parent portal",
    ],
    stats: [
      { value: "3hrs",  label: "Average time saved per result term" },
      { value: "Zero",  label: "Manual transcription errors" },
    ],
  },
  {
    id: "duties",
    icon: Users,
    label: "Staff Duties",
    title: "Staff duty allocation in minutes",
    description:
      "Assign morning assembly, gate duty, exam supervision, and more across your staff roster. Every teacher knows their schedule. Every duty is covered.",
    features: [
      "Assign duties by day of week and time slot",
      "Duty types: assembly, gate, cafeteria, library, exam, sanitation",
      "View full duty roster by staff or by day",
      "Duplicate previous term's schedule as a starting point",
      "Conflict detection for double-booked staff",
      "Export duty timetable as PDF",
    ],
    stats: [
      { value: "15min", label: "To allocate an entire term's duties" },
      { value: "100%",  label: "Duty coverage visibility" },
    ],
  },
  {
    id: "academics",
    icon: BookOpen,
    label: "Academics",
    title: "Full academic configuration control",
    description:
      "Set up your classes, sections, subjects, and grading scales exactly as your school runs them. ReportRun adapts to your structure — not the other way around.",
    features: [
      "Create classes and sections (e.g. JSS 1A, JSS 1B)",
      "Assign form teachers per class and section",
      "Configure subjects per class level",
      "Set custom grade scales (A1–F9 or your own)",
      "Manage multiple terms and sessions",
      "Track academic calendar with start and end dates",
    ],
    stats: [
      { value: "6",    label: "Class levels supported out of the box" },
      { value: "Full", label: "WAEC-compatible grading scale support" },
    ],
  },
  {
    id: "communication",
    icon: MessageSquare,
    label: "Communication",
    title: "Reach every parent, every time",
    description:
      "Send announcements, exam timetables, results notifications, and fee alerts to all parents or targeted groups — via SMS, email, or both.",
    features: [
      "Compose and send messages to all parents or by class",
      "Schedule messages for future delivery",
      "SMS and email channels in one composer",
      "View sent message history and delivery counts",
      "Draft and save messages before sending",
      "Track message status: sent, scheduled, or failed",
    ],
    stats: [
      { value: "2min", label: "To reach all 600+ parents" },
      { value: "98%",  label: "SMS delivery rate" },
    ],
  },
];

const platformFeatures = [
  {
    icon: Shield,
    title: "Data security",
    description: "Every school's data is fully isolated. Encrypted at rest and in transit. No shared databases.",
  },
  {
    icon: Layout,
    title: "Role-based access",
    description: "Give accountants access to collections only. Teachers to results only. Full control over who sees what.",
  },
  {
    icon: Download,
    title: "Export everything",
    description: "Every report, broadsheet, payment record, and duty roster can be exported to PDF or Excel.",
  },
  {
    icon: Clock,
    title: "Audit trail",
    description: "Every change is logged with a timestamp and user. Know exactly who edited what and when.",
  },
  {
    icon: Settings,
    title: "Flexible configuration",
    description: "Set up terms, sessions, grade scales, and fee categories to match exactly how your school works.",
  },
  {
    icon: BarChart2,
    title: "Dashboard reporting",
    description: "Live metrics on collection rates, attendance, and academic performance. No report-building needed.",
  },
];

// ── Page ──────────────────────────────────────────────────────

export default function FeaturesPage() {
  return (
    <>
      {/* Header */}
      <section className="section-pad border-b border-border bg-surface">
        <div className="container-page">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold text-navy-600 uppercase tracking-wide mb-2">
              Features
            </p>
            <h1 className="text-4xl font-semibold text-text-primary mb-4">
              Built for how Nigerian schools actually work
            </h1>
            <p className="text-lg text-text-secondary leading-relaxed">
              Every feature in ReportRun was designed around the real workflows
              of school administrators, bursars, and vice principals — not
              generic education software templates.
            </p>
          </div>
        </div>
      </section>

      {/* Feature groups */}
      {featureGroups.map((group, i) => {
        const Icon = group.icon;
        const isEven = i % 2 === 0;

        return (
          <section
            key={group.id}
            id={group.id}
            className={`section-pad border-b border-border ${isEven ? "bg-surface" : "bg-surface-secondary"}`}
          >
            <div className="container-page">
              <div className="grid lg:grid-cols-2 gap-16 items-start">

                {/* Text side */}
                <div className={isEven ? "" : "lg:order-2"}>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-navy-50 border border-navy-100 rounded text-xs font-medium text-navy-600 mb-4">
                    <Icon size={12} />
                    {group.label}
                  </div>
                  <h2 className="text-2xl font-semibold text-text-primary mb-3">
                    {group.title}
                  </h2>
                  <p className="text-text-secondary leading-relaxed mb-6">
                    {group.description}
                  </p>

                  <ul className="flex flex-col gap-2.5 mb-8">
                    {group.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5">
                        <CheckCircle size={15} className="text-success mt-0.5 shrink-0" />
                        <span className="text-sm text-text-secondary">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link href="/contact">
                    <Button variant="secondary" size="sm">
                      See a demo
                      <ArrowRight size={13} />
                    </Button>
                  </Link>
                </div>

                {/* Stats side */}
                <div className={isEven ? "" : "lg:order-1"}>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {group.stats.map((stat) => (
                      <div
                        key={stat.label}
                        className="p-6 bg-surface border border-border rounded-lg"
                      >
                        <p className="text-3xl font-semibold text-navy-600 mb-1">
                          {stat.value}
                        </p>
                        <p className="text-sm text-text-muted leading-snug">
                          {stat.label}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Feature pill list */}
                  <div className="p-5 bg-surface border border-border rounded-lg">
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">
                      What&apos;s included
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {group.features.map((feature) => (
                        <span
                          key={feature}
                          className="px-2.5 py-1 bg-surface-secondary border border-border rounded text-xs text-text-secondary"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
      })}

      {/* Platform features */}
      <section className="section-pad border-b border-border bg-surface">
        <div className="container-page">
          <div className="max-w-xl mb-12">
            <p className="text-xs font-semibold text-navy-600 uppercase tracking-wide mb-2">
              Platform
            </p>
            <h2 className="text-3xl font-semibold text-text-primary mb-3">
              Everything underneath
            </h2>
            <p className="text-text-secondary">
              The features you see are built on a platform designed for
              reliability, security, and flexibility.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border rounded-lg overflow-hidden">
            {platformFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="p-6 bg-surface hover:bg-surface-secondary transition-colors duration-150"
                >
                  <div className="p-2 bg-navy-50 rounded w-fit mb-4">
                    <Icon size={16} className="text-navy-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-text-primary mb-1.5">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-pad bg-navy-600">
        <div className="container-page text-center">
          <h2 className="text-3xl font-semibold text-white mb-4">
            See every feature in action
          </h2>
          <p className="text-navy-200 mb-8 max-w-md mx-auto">
            Book a 20-minute walkthrough with our team. We will show you exactly
            how ReportRun fits your school.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/contact">
              <Button
                size="lg"
                className="bg-white! text-navy-600! hover:bg-navy-50! border-white!"
              >
                Book a demo
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