"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { resetPasswordAction } from "@/lib/actions/auth";

const schema = z
  .object({
    password:        z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path:    ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const token        = searchParams.get("token");

  const [showPassword, setShowPassword] = useState(false);
  const [done,         setDone         ] = useState(false);
  const [error,        setError        ] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  // Token missing from URL
  if (!token) {
    return (
      <div className="w-full max-w-sm">
        <div className="bg-surface border border-border rounded-lg p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-error-light flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={24} className="text-error" />
          </div>
          <h1 className="text-lg font-semibold text-text-primary mb-2">
            Invalid reset link
          </h1>
          <p className="text-sm text-text-muted mb-6">
            This link is missing a reset token. Please request a new one.
          </p>
          <Link
            href="/forgot-password"
            className="text-sm text-navy-600 hover:text-navy-700 font-medium no-underline"
          >
            Request new link
          </Link>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="w-full max-w-sm">
        <div className="bg-surface border border-border rounded-lg p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-success-light flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={24} className="text-success" />
          </div>
          <h1 className="text-lg font-semibold text-text-primary mb-2">
            Password reset
          </h1>
          <p className="text-sm text-text-muted mb-6">
            Your password has been changed. All active sessions have been
            signed out.
          </p>
          <Button fullWidth onClick={() => router.push("/login")}>
            Sign in with new password
          </Button>
        </div>
      </div>
    );
  }

  async function onSubmit(data: FormData) {
    setError(null);
    const result = await resetPasswordAction(token!, data.password);
    if (result.error) {
      setError(result.error);
      return;
    }
    setDone(true);
  }

  return (
    <div className="w-full max-w-sm">
      <div className="bg-surface border border-border rounded-lg p-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-text-primary">
            Set a new password
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Choose a strong password for your account.
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
            label="New password"
            type={showPassword ? "text" : "password"}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            required
            error={errors.password?.message}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="cursor-pointer text-text-muted hover:text-text-primary transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            }
            {...register("password")}
          />
          <Input
            label="Confirm new password"
            type={showPassword ? "text" : "password"}
            placeholder="Repeat your password"
            autoComplete="new-password"
            required
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />
          <Button type="submit" fullWidth loading={isSubmitting} className="mt-1">
            Reset password
          </Button>
        </form>
      </div>
    </div>
  );
}