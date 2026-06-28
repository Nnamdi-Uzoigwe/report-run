"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { useAuthStore } from "@/lib/store";
import type { LoginCredentials } from "@/types";
import { loginAction } from "@/lib/actions/auth";

// ── Schema ────────────────────────────────────────────────────

const schema = z.object({
  email:    z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

// ── Page ──────────────────────────────────────────────────────

export default function LoginPage() {
  const router   = useRouter();
  const setUser  = useAuthStore((s) => s.setUser);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError,  setServerError]  = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginCredentials>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: LoginCredentials) {
    setServerError(null);
    const result = await loginAction(data.email, data.password);
    if (result.error) {
      setServerError(result.error);
      return;
    }
    if (result.user) setUser(result.user);
    router.push("/dashboard");
  }

  return (
    <div className="w-full max-w-sm">
      {/* Card */}
      <div className="bg-surface border border-border rounded-lg p-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-text-primary">
            Sign in to ReportRun
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Enter your school admin credentials below.
          </p>
        </div>

        {/* Demo credentials hint */}
        <div className="p-3 bg-navy-50 border border-navy-100 rounded mb-6">
          <p className="text-xs font-medium text-navy-700 mb-1">Demo credentials</p>
          <p className="text-xs text-navy-600">
            Email: admin@greenfield.edu.ng
          </p>
          <p className="text-xs text-navy-600">Password: password123</p>
        </div>

        {serverError && (
          <div
            className="p-3 bg-error-light border border-error rounded mb-5"
            role="alert"
          >
            <p className="text-sm text-error">{serverError}</p>
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

          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            autoComplete="current-password"
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

          <div className="flex items-center justify-end">
            <Link
              href="#"
              className="text-xs text-navy-600 hover:text-navy-700 no-underline"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            fullWidth
            loading={isSubmitting}
            className="mt-1"
          >
            Sign in
          </Button>
        </form>
      </div>

      <p className="text-center text-xs text-text-muted mt-4">
        Don&apos;t have an account?{" "}
        <Link
          href="/contact"
          className="text-navy-600 hover:text-navy-700 no-underline font-medium"
        >
          Contact us to get started
        </Link>
      </p>
    </div>
  );
}