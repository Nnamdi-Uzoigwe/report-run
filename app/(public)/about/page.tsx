import Link from "next/link";
import { ArrowRight, Users, School, Target, Heart } from "lucide-react";
import { Button } from "@/components/ui";

// ── Data ─────────────────────────────────────────────────────

const timeline = [
  {
    year: "2021",
    title: "The problem became personal",
    description:
      "Our founder, a former school administrator in Kano, spent three days manually compiling end-of-term results for 400 students. On the last day, a spreadsheet error wiped four hours of work. ReportRun was born from that frustration.",
  },
  {
    year: "2022",
    title: "First school, first term",
    description:
      "We piloted with a single school in Abuja — 180 students, one admin officer, and a lot of feedback. By the end of that first term, result compilation time had dropped from three days to four hours.",
  },
  {
    year: "2023",
    title: "Fee collection unlocked",
    description:
      "Schools kept asking for one thing: help collecting fees. We built the collection ledger and automated reminder system. The first school to use it went from 61% to 87% collection rate in one term.",
  },
  {
    year: "2024",
    title: "Scaling across Nigeria",
    description:
      "ReportRun expanded to 200+ schools across Lagos, Abuja, Enugu, Port Harcourt, and Kano. We hired our first dedicated support team and launched the Growth and Professional plans.",
  },
  {
    year: "2025",
    title: "400+ schools and growing",
    description:
      "Today ReportRun manages over 180,000 students across Nigeria. We are building toward becoming the operating system for every school on the continent.",
  },
];

const values = [
  {
    icon: Target,
    title: "Built for context",
    description:
      "We build for Nigerian schools specifically — not watered-down versions of software designed for schools in London or Texas. Our defaults, our language, and our workflows reflect how Nigerian schools actually operate.",
  },
  {
    icon: Users,
    title: "Admin staff first",
    description:
      "The people who use ReportRun most are bursars, vice principals, and class teachers — not IT departments. Everything we build is tested for clarity and ease of use with non-technical staff.",
  },
  {
    icon: Heart,
    title: "Honest about limitations",
    description:
      "We do not oversell. If a feature is not ready, we say so. If something breaks, we own it and fix it fast. Our reputation is built on schools trusting us with their most sensitive data.",
  },
  {
    icon: School,
    title: "School outcomes matter",
    description:
      "A school that collects more fees can pay teachers on time. Teachers paid on time teach better. We think about that chain of impact in every feature decision we make.",
  },
];

const team = [
  {
    name: "Emeka Okonkwo",
    title: "Co-founder & CEO",
    background: "Former school administrator, University of Nigeria Nsukka",
  },
  {
    name: "Aisha Bello",
    title: "Co-founder & CTO",
    background: "Software engineer, 8 years building edtech in West Africa",
  },
  {
    name: "Tunde Adeyemi",
    title: "Head of Product",
    background: "Former bursar, Lagos State school system",
  },
  {
    name: "Ngozi Okafor",
    title: "Head of Customer Success",
    background: "10 years school administration, Enugu and Abuja",
  },
  {
    name: "Fatima Aliyu",
    title: "Head of Sales",
    background: "EdTech partnerships across Northern Nigeria",
  },
  {
    name: "Chidi Eze",
    title: "Lead Engineer",
    background: "Full-stack engineer, formerly Paystack",
  },
];

const stats = [
  { value: "400+",  label: "Schools active"       },
  { value: "180k+", label: "Students managed"      },
  { value: "36",    label: "States represented"    },
  { value: "2021",  label: "Founded"               },
];

// ── Page ──────────────────────────────────────────────────────

export default function AboutPage() {
  return (
    <>
      {/* Header */}
      <section className="section-pad border-b border-border bg-surface">
        <div className="container-page">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs font-semibold text-navy-600 uppercase tracking-wide mb-2">
                About ReportRun
              </p>
              <h1 className="text-4xl font-semibold text-text-primary mb-4">
                We have been inside the problem
              </h1>
              <p className="text-lg text-text-secondary leading-relaxed mb-6">
                ReportRun was not built by outsiders looking at Nigerian schools
                from a distance. It was built by people who lived the
                spreadsheet chaos, the missed fee deadlines, and the
                end-of-term result scramble firsthand.
              </p>
              <p className="text-text-secondary leading-relaxed">
                That experience shapes every decision we make — from the words
                we use in the interface to the order of fields on a form.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="p-6 bg-surface-secondary border border-border rounded-lg"
                >
                  <p className="text-3xl font-semibold text-navy-600 mb-1">
                    {stat.value}
                  </p>
                  <p className="text-sm text-text-muted">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Story / Timeline */}
      <section className="section-pad border-b border-border bg-surface-secondary">
        <div className="container-page">
          <div className="max-w-xl mb-12">
            <p className="text-xs font-semibold text-navy-600 uppercase tracking-wide mb-2">
              Our story
            </p>
            <h2 className="text-3xl font-semibold text-text-primary">
              How we got here
            </h2>
          </div>

          <div className="max-w-2xl flex flex-col gap-0">
            {timeline.map((item, i) => (
              <div key={item.year} className="flex gap-6">
                {/* Year + line */}
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-lg bg-navy-600 text-white flex items-center justify-center text-xs font-semibold shrink-0">
                    {item.year}
                  </div>
                  {i < timeline.length - 1 && (
                    <div className="w-px flex-1 bg-border my-2" />
                  )}
                </div>

                {/* Content */}
                <div className="pb-8">
                  <h3 className="text-sm font-semibold text-text-primary mb-1.5">
                    {item.title}
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section-pad border-b border-border bg-surface">
        <div className="container-page">
          <div className="max-w-xl mb-12">
            <p className="text-xs font-semibold text-navy-600 uppercase tracking-wide mb-2">
              What we believe
            </p>
            <h2 className="text-3xl font-semibold text-text-primary">
              The values behind the product
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {values.map((value) => {
              const Icon = value.icon;
              return (
                <div
                  key={value.title}
                  className="p-6 bg-surface border border-border rounded-lg hover:border-border-strong transition-colors duration-150"
                >
                  <div className="p-2 bg-navy-50 rounded w-fit mb-4">
                    <Icon size={16} className="text-navy-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-text-primary mb-2">
                    {value.title}
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {value.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="section-pad border-b border-border bg-surface-secondary">
        <div className="container-page">
          <div className="max-w-xl mb-12">
            <p className="text-xs font-semibold text-navy-600 uppercase tracking-wide mb-2">
              The team
            </p>
            <h2 className="text-3xl font-semibold text-text-primary mb-3">
              People who know the problem
            </h2>
            <p className="text-text-secondary">
              Half our team has worked inside Nigerian schools. The other half
              has spent years building software for them. That combination is
              intentional.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {team.map((member) => (
              <div
                key={member.name}
                className="p-5 bg-surface border border-border rounded-lg"
              >
                {/* Avatar placeholder */}
                <div className="w-10 h-10 rounded-lg bg-navy-100 flex items-center justify-center mb-4">
                  <span className="text-sm font-semibold text-navy-600">
                    {member.name.split(" ").map((n) => n[0]).join("")}
                  </span>
                </div>
                <p className="text-sm font-semibold text-text-primary">
                  {member.name}
                </p>
                <p className="text-xs text-navy-600 font-medium mt-0.5 mb-2">
                  {member.title}
                </p>
                <p className="text-xs text-text-muted leading-relaxed">
                  {member.background}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="section-pad border-b border-border bg-navy-600">
        <div className="container-page">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold text-navy-200 uppercase tracking-wide mb-3">
              Our mission
            </p>
            <blockquote className="text-2xl font-semibold text-white leading-relaxed mb-6">
              &ldquo;To give every Nigerian school — regardless of size or
              budget — the administrative infrastructure that lets them focus
              on education, not paperwork.&rdquo;
            </blockquote>
            <p className="text-navy-200 leading-relaxed">
              We measure success not in software metrics, but in terms saved,
              fees collected, and administrators who go home on time.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-pad bg-surface">
        <div className="container-page text-center">
          <h2 className="text-3xl font-semibold text-text-primary mb-4">
            Want to work with us?
          </h2>
          <p className="text-text-secondary mb-8 max-w-md mx-auto">
            We are always looking for people who understand Nigerian schools
            and want to build for them. And if you just want to try ReportRun
            — that door is open too.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/contact">
              <Button size="lg">
                Get in touch
                <ArrowRight size={16} />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="secondary">
                View pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}