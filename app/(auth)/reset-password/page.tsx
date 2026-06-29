"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { useAuthStore } from "@/lib/store";
import { acceptInviteAction } from "@/lib/actions/auth";
import { useQueryClient } from "@tanstack/react-query";
import { keys } from "@/lib/queries/keys";

const schema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  if (!token) {
    return (
      <div className="w-full max-w-sm">
        <div className="bg-surface border border-border rounded-lg p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-error-light flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={24} className="text-error" />
          </div>
          <h1 className="text-lg font-semibold text-text-primary mb-2">
            Invalid invite link
          </h1>
          <p className="text-sm text-text-muted">
            This invite link is missing a token. Please check the email and
            click the button again, or ask your administrator to resend the
            invite.
          </p>
        </div>
      </div>
    );
  }

  async function onSubmit(data: FormData) {
    setError(null);

    const result = await acceptInviteAction(token, data.password);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (!result.user) return;

    setUser(result.user);
    queryClient.setQueryData(keys.me, result.user);
    router.push("/dashboard");
  }

  return (
    <div className="w-full max-w-sm">
      <div className="bg-surface border border-border rounded-lg p-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-text-primary">
            Accept your invite
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Set a password to activate your account and get started.
          </p>
        </div>

        {error && (
          <div
            className="p-3 bg-error-light border border-error rounded mb-5"
            role="alert"
          >
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
          noValidate
        >
          <Input
            label="Password"
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
            label="Confirm password"
            type={showPassword ? "text" : "password"}
            placeholder="Repeat your password"
            autoComplete="new-password"
            required
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />

          <Button
            type="submit"
            fullWidth
            loading={isSubmitting}
            className="mt-1"
          >
            Activate account
          </Button>
        </form>

        <p className="text-xs text-text-muted text-center mt-4">
          This invite link expires after 72 hours. If it has expired, ask your
          administrator to resend it.
        </p>
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
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
      <AcceptInviteContent />
    </Suspense>
  );
}