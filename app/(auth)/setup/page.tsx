"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle } from "lucide-react";
import { Button, Input, Select } from "@/components/ui";
import { classNames } from "@/lib/utils";
import type { SetupFormData } from "@/types";
import { apiClient, setTokens } from "@/lib/api-client";
import { useAuthStore }   from "@/lib/store";
import { registerAction } from "@/lib/actions/auth";

// ── Schema ────────────────────────────────────────────────────

const schema = z.object({
  schoolName:    z.string().min(2,  "School name is required"),
  schoolAddress: z.string().min(5,  "Address is required"),
  schoolPhone:   z.string().min(7,  "Phone number is required"),
  schoolEmail:   z.string().email(  "Enter a valid email"),
  principalName: z.string().min(2,  "Principal name is required"),
  adminEmail:    z.string().email(  "Enter a valid email"),
  adminPassword: z.string().min(8,  "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1,"Please confirm your password"),
  term:          z.string().min(1,  "Select a term"),
  session:       z.string().min(1,  "Enter the academic session"),
}).refine((d) => d.adminPassword === d.confirmPassword, {
  message: "Passwords do not match",
  path:    ["confirmPassword"],
});

// ── Data ─────────────────────────────────────────────────────

const steps = [
  { id: 1, label: "School details"  },
  { id: 2, label: "Admin account"   },
  { id: 3, label: "Academic setup"  },
];

const termOptions = [
  { value: "First Term",  label: "First Term"  },
  { value: "Second Term", label: "Second Term" },
  { value: "Third Term",  label: "Third Term"  },
];

// ── Page ──────────────────────────────────────────────────────

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const setUser = useAuthStore((s) => s.setUser);
const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<SetupFormData>({
    resolver: zodResolver(schema),
    mode: "onBlur",
  });

  const stepFields: Record<number, (keyof SetupFormData)[]> = {
    1: ["schoolName", "schoolAddress", "schoolPhone", "schoolEmail", "principalName"],
    2: ["adminEmail", "adminPassword", "confirmPassword"],
    3: ["term", "session"],
  };

  async function nextStep() {
    const valid = await trigger(stepFields[step]);
    if (valid) setStep((s) => s + 1);
  }
async function onSubmit(data: SetupFormData) {
    setIsSubmitting(true);
    setServerError(null);
    try {
      const nameParts = data.principalName.trim().split(" ");
      const firstName = nameParts[0];
      const lastName  = nameParts.slice(1).join(" ") || "Admin";

      const result = await registerAction({
        firstName,
        lastName,
        email:        data.adminEmail,
        password:     data.adminPassword,
        schoolName:   data.schoolName,
        currencyCode: "NGN",
        address:      data.schoolAddress,
        phone:        data.schoolPhone,
      });

      if (result.error) {
        setServerError(result.error);
        return;
      }

      if (result.user) setUser(result.user); 
      router.push("/dashboard");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-lg">
      {/* Steps */}
      <div className="flex items-center gap-0 mb-8">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className={classNames(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors duration-200",
                  step > s.id
                    ? "bg-success border-success text-white"
                    : step === s.id
                    ? "bg-navy-600 border-navy-600 text-white"
                    : "bg-surface border-border text-text-muted"
                )}
              >
                {step > s.id ? <CheckCircle size={14} /> : s.id}
              </div>
              <span
                className={classNames(
                  "text-xs font-medium whitespace-nowrap",
                  step >= s.id ? "text-text-primary" : "text-text-muted"
                )}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={classNames(
                  "flex-1 h-px mx-2 mb-4 transition-colors duration-200",
                  step > s.id ? "bg-success" : "bg-border"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {serverError && (
          <div className="p-3 bg-error-light border border-error rounded mb-4" role="alert">
            <p className="text-sm text-error">{serverError}</p>
          </div>
      )}

      {/* Card */}
      <div className="bg-surface border border-border rounded-lg p-8">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>

          {/* Step 1 — School details */}
          {step === 1 && (
            <div className="flex flex-col gap-5">
              <div className="mb-2">
                <h1 className="text-lg font-semibold text-text-primary">
                  Tell us about your school
                </h1>
                <p className="text-sm text-text-muted mt-1">
                  This information appears on report cards and receipts.
                </p>
              </div>
              <Input
                label="School name"
                placeholder="Greenfield Academy"
                required
                error={errors.schoolName?.message}
                {...register("schoolName")}
              />
              <Input
                label="School address"
                placeholder="14 Ahmadu Bello Way, Abuja"
                required
                error={errors.schoolAddress?.message}
                {...register("schoolAddress")}
              />
              <div className="grid sm:grid-cols-2 gap-5">
                <Input
                  label="Phone number"
                  type="tel"
                  placeholder="+234 803 000 0000"
                  required
                  error={errors.schoolPhone?.message}
                  {...register("schoolPhone")}
                />
                <Input
                  label="School email"
                  type="email"
                  placeholder="info@school.edu.ng"
                  required
                  error={errors.schoolEmail?.message}
                  {...register("schoolEmail")}
                />
              </div>
              <Input
                label="Principal's name"
                placeholder="Dr. Chukwuemeka Adeyemi"
                required
                error={errors.principalName?.message}
                {...register("principalName")}
              />
            </div>
          )}

          {/* Step 2 — Admin account */}
          {step === 2 && (
            <div className="flex flex-col gap-5">
              <div className="mb-2">
                <h1 className="text-lg font-semibold text-text-primary">
                  Create your admin account
                </h1>
                <p className="text-sm text-text-muted mt-1">
                  This will be the primary administrator login.
                </p>
              </div>
              <Input
                label="Admin email"
                type="email"
                placeholder="admin@school.edu.ng"
                required
                error={errors.adminEmail?.message}
                {...register("adminEmail")}
              />
              <Input
                label="Password"
                type="password"
                placeholder="At least 8 characters"
                required
                error={errors.adminPassword?.message}
                {...register("adminPassword")}
              />
              <Input
                label="Confirm password"
                type="password"
                placeholder="Repeat your password"
                required
                error={errors.confirmPassword?.message}
                {...register("confirmPassword")}
              />
            </div>
          )}

          {/* Step 3 — Academic setup */}
          {step === 3 && (
            <div className="flex flex-col gap-5">
              <div className="mb-2">
                <h1 className="text-lg font-semibold text-text-primary">
                  Set up your academic calendar
                </h1>
                <p className="text-sm text-text-muted mt-1">
                  You can change these at any time in Settings.
                </p>
              </div>
              <Select
                label="Current term"
                required
                options={termOptions}
                placeholder="Select current term"
                error={errors.term?.message}
                {...register("term")}
              />
              <Input
                label="Academic session"
                placeholder="2024/2025"
                required
                hint="Format: 2024/2025"
                error={errors.session?.message}
                {...register("session")}
              />
              <div className="p-4 bg-surface-secondary border border-border rounded-lg">
                <p className="text-xs font-semibold text-text-primary mb-2">
                  What happens next
                </p>
                <ul className="flex flex-col gap-1.5">
                  {[
                    "Your school dashboard will be created",
                    "Default grade scales will be configured",
                    "You can invite staff and add students",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-xs text-text-secondary">
                      <CheckCircle size={12} className="text-success shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between gap-4 mt-8 pt-6 border-t border-border">
            {step > 1 ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setStep((s) => s - 1)}
              >
                Back
              </Button>
            ) : (
              <div />
            )}
            {step < steps.length ? (
              <Button type="button" onClick={nextStep}>
                Continue
              </Button>
            ) : (
              <Button type="submit" loading={isSubmitting}>
                Complete setup
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}