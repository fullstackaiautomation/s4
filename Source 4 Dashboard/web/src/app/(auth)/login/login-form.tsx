"use client";

import { useEffect, useActionState } from "react";

import { Button } from "@/components/ui/button";
import { signInWithPasswordAction, type LoginState } from "@/lib/auth/actions";
import { DEFAULT_AUTH_REDIRECT } from "@/lib/auth/roles";

type LoginFormProps = {
  redirectTo?: string;
  initialError?: string | null;
};

const INITIAL_STATE: LoginState = { status: "idle" };

export function LoginForm({ redirectTo, initialError }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(signInWithPasswordAction, INITIAL_STATE);

  useEffect(() => {
    if (initialError && state.status === "idle") {
      console.warn("Authentication error:", initialError);
    }
  }, [initialError, state.status]);

  const feedback = state.message ?? mapErrorCode(initialError);
  const isError = state.status === "error" || initialError != null;

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="redirectTo" value={redirectTo ?? DEFAULT_AUTH_REDIRECT} />
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-white">
          Work Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="you@source4industries.com"
          className="w-full rounded-lg border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/50 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium text-white">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          placeholder="Enter your password"
          className="w-full rounded-lg border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/50 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {feedback ? (
        <p
          className={
            isError
              ? "text-sm font-medium text-rose-200"
              : "text-sm font-medium text-emerald-200"
          }
        >
          {feedback}
        </p>
      ) : null}

      <Button
        type="submit"
        className="w-full"
        disabled={isPending}
      >
        {isPending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}

function mapErrorCode(errorCode: string | null | undefined): string | undefined {
  if (!errorCode) return undefined;
  if (errorCode === "auth") {
    return "Your session expired. Please request a new magic link.";
  }
  if (errorCode === "unauthorized") {
    return "You do not have access to that area.";
  }
  return "Something went wrong. Please try again.";
}
