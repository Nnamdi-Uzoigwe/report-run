"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { useLogin } from "@/lib/queries/auth";
import type { LoginCredentials } from "@/types";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

function LoginContent() {
  const [showPassword, setShowPassword] = useState(false);
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "/dashboard";

  const login = useLogin(from);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginCredentials>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: LoginCredentials) {
    login.mutate(data);
  }

  return (
    <div className="w-full max-w-sm">
      <div className="bg-surface border border-border rounded-lg p-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-text-primary">
            Sign in to EduNovtryx
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Enter your school admin credentials below.
          </p>
        </div>

        {login.error && (
          <div
            className="p-3 bg-error-light border border-error rounded mb-5"
            role="alert"
          >
            <p className="text-sm text-error">
              {(login.error as Error).message}
            </p>
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
              href="/forgot-password"
              className="text-xs text-navy-600 hover:text-navy-700 no-underline"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            fullWidth
            loading={login.isPending}
            className="mt-1"
          >
            Sign in
          </Button>
        </form>
      </div>

      <p className="text-center text-xs text-text-muted mt-4">
        Don&apos;t have an account?{" "}
        <Link
          href="/setup"
          className="text-navy-600 hover:text-navy-700 no-underline font-medium"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-sm">
          <div className="bg-surface border border-border rounded-lg p-8 text-center">
            Loading...
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}