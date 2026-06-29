"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { forgotPasswordAction } from "@/lib/actions/auth";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [error,     setError    ] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setError(null);
    const result = await forgotPasswordAction(data.email);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="w-full max-w-sm">
        <div className="bg-surface border border-border rounded-lg p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-success-light flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={24} className="text-success" />
          </div>
          <h1 className="text-lg font-semibold text-text-primary mb-2">
            Check your email
          </h1>
          <p className="text-sm text-text-muted mb-6">
            If an account with that email exists, we&apos;ve sent a password
            reset link. It expires in 15 minutes.
          </p>
          <Link
            href="/login"
            className="text-sm text-navy-600 hover:text-navy-700 font-medium no-underline"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="bg-surface border border-border rounded-lg p-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-text-primary">
            Reset your password
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-error-light border border-error rounded mb-5" role="alert">
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
          noValidate
        >
          <Input
            label="Email address"
            type="email"
            placeholder="admin@school.edu.ng"
            autoComplete="email"
            required
            error={errors.email?.message}
            {...register("email")}
          />
          <Button type="submit" fullWidth loading={isSubmitting}>
            Send reset link
          </Button>
        </form>
      </div>

      <p className="text-center text-xs text-text-muted mt-4">
        Remember your password?{" "}
        <Link
          href="/login"
          className="text-navy-600 hover:text-navy-700 no-underline font-medium"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}