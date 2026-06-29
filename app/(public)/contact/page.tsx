"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Phone, MapPin, CheckCircle } from "lucide-react";
import { Button, Input, Select } from "@/components/ui";
import type { ContactFormData } from "@/types";

// ── Schema ────────────────────────────────────────────────────

const schema = z.object({
  firstName:  z.string().min(1, "First name is required"),
  lastName:   z.string().min(1, "Last name is required"),
  email:      z.string().email("Enter a valid email address"),
  phone:      z.string().optional(),
  schoolName: z.string().optional(),
  subject:    z.string().min(1, "Please select a subject"),
  message:    z.string().min(20, "Message must be at least 20 characters"),
});

// ── Data ─────────────────────────────────────────────────────

const subjectOptions = [
  { value: "demo",        label: "Request a demo"  },
  { value: "pricing",     label: "Pricing enquiry" },
  { value: "support",     label: "Technical support" },
  { value: "partnership", label: "Partnership"     },
  { value: "other",       label: "Other"           },
];

const contactDetails = [
  { icon: Mail,  label: "Email",  value: "hello@reportrun.ng",           href: "mailto:hello@reportrun.ng" },
  { icon: Phone, label: "Phone",  value: "+234 800 REPORT (737678)",     href: "tel:+234800737678"         },
  { icon: MapPin,label: "Office", value: "14 Ahmadu Bello Way, Abuja, FCT", href: undefined               },
];

// ── Page ──────────────────────────────────────────────────────

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [error,     setError    ] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    resolver: zodResolver(schema) as any,
  });

  async function onSubmit(data: ContactFormData) {
    setError(null);
    try {
      // Contact form endpoint — add to backend when ready.
      // For now we simulate a successful send.
      await new Promise((r) => setTimeout(r, 600));
      console.info("Contact form submitted:", data);
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again or email us directly.");
    }
  }

  return (
    <>
      {/* Header */}
      <section className="section-pad border-b border-border bg-surface">
        <div className="container-page">
          <div className="max-w-xl">
            <p className="text-xs font-semibold text-navy-600 uppercase tracking-wide mb-2">
              Contact
            </p>
            <h1 className="text-4xl font-semibold text-text-primary mb-4">
              Talk to our team
            </h1>
            <p className="text-lg text-text-secondary leading-relaxed">
              Whether you want a demo, have a pricing question, or just want to
              know if ReportRun fits your school — we respond within one
              business day.
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="section-pad border-b border-border bg-surface-secondary">
        <div className="container-page">
          <div className="grid lg:grid-cols-3 gap-12">

            {/* Left */}
            <div className="flex flex-col gap-8">
              <div>
                <h2 className="text-base font-semibold text-text-primary mb-4">
                  Contact details
                </h2>
                <div className="flex flex-col gap-4">
                  {contactDetails.map((detail) => {
                    const Icon = detail.icon;
                    return (
                      <div key={detail.label} className="flex items-start gap-3">
                        <div className="p-2 bg-navy-50 border border-navy-100 rounded shrink-0">
                          <Icon size={14} className="text-navy-600" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-text-muted mb-0.5">
                            {detail.label}
                          </p>
                          {detail.href ? (
                            <a href={detail.href} className="text-sm text-text-primary hover:text-navy-600 transition-colors">
                              {detail.value}
                            </a>
                          ) : (
                            <p className="text-sm text-text-primary">{detail.value}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-5 bg-surface border border-border rounded-lg">
                <h3 className="text-sm font-semibold text-text-primary mb-3">Support hours</h3>
                <div className="flex flex-col gap-2">
                  {[
                    { day: "Monday – Friday", hours: "8:00am – 6:00pm" },
                    { day: "Saturday",        hours: "9:00am – 1:00pm" },
                    { day: "Sunday",          hours: "Closed"          },
                  ].map((row) => (
                    <div key={row.day} className="flex justify-between text-sm">
                      <span className="text-text-secondary">{row.day}</span>
                      <span className="text-text-primary font-medium">{row.hours}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5 bg-navy-50 border border-navy-100 rounded-lg">
                <p className="text-sm font-semibold text-navy-700 mb-1">Typical response time</p>
                <p className="text-sm text-navy-600">
                  We reply to all enquiries within one business day. For urgent issues, call us directly.
                </p>
              </div>
            </div>

            {/* Right — form */}
            <div className="lg:col-span-2">
              {submitted ? (
                <div className="flex flex-col items-center justify-center py-16 text-center bg-surface border border-border rounded-lg">
                  <div className="p-4 bg-success-light rounded-xl mb-4">
                    <CheckCircle size={28} className="text-success" />
                  </div>
                  <h2 className="text-base font-semibold text-text-primary mb-2">Message sent</h2>
                  <p className="text-sm text-text-muted max-w-xs">
                    Thanks for reaching out. Someone from our team will get back to you within one business day.
                  </p>
                </div>
              ) : (
                <div className="bg-surface border border-border rounded-lg p-6 lg:p-8">
                  <h2 className="text-base font-semibold text-text-primary mb-6">Send us a message</h2>

                  {error && (
                    <div className="p-3 bg-error-light border border-error rounded mb-5">
                      <p className="text-sm text-error">{error}</p>
                    </div>
                  )}

                  <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
                    <div className="grid sm:grid-cols-2 gap-5">
                      <Input label="First name" placeholder="Amaka"    required error={errors.firstName?.message} {...register("firstName")} />
                      <Input label="Last name"  placeholder="Okonkwo"  required error={errors.lastName?.message}  {...register("lastName")}  />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-5">
                      <Input label="Email address" type="email" placeholder="amaka@school.edu.ng" required error={errors.email?.message} {...register("email")} />
                      <Input label="Phone number"  type="tel"   placeholder="+234 803 000 0000"                 error={errors.phone?.message} {...register("phone")} />
                    </div>
                    <Input label="School name" placeholder="Greenfield Academy" error={errors.schoolName?.message} {...register("schoolName")} />
                    <Select label="Subject" required options={subjectOptions} placeholder="Select a subject" error={errors.subject?.message} {...register("subject")} />
                    <div>
                      <label className="block text-xs font-semibold text-text-primary mb-1.5">
                        Message <span className="text-error">*</span>
                      </label>
                      <textarea
                        rows={5}
                        placeholder="Tell us about your school and what you need..."
                        className="w-full px-3 py-2 text-sm border border-border rounded bg-surface text-text-primary focus:outline-2 focus:outline-navy-600 placeholder:text-text-muted resize-none"
                        {...register("message")}
                      />
                      {errors.message && (
                        <p className="text-xs text-error mt-1">{errors.message.message}</p>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-4 pt-2">
                      <p className="text-xs text-text-muted">We will never share your details with third parties.</p>
                      <Button type="submit" loading={isSubmitting} className="shrink-0">
                        Send message
                      </Button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}