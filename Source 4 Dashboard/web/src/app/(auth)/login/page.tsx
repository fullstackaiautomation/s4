import { redirect } from "next/navigation";

import { LoginForm } from "./login-form";
import { DEFAULT_AUTH_REDIRECT } from "@/lib/auth/roles";
import { getAuthContext } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[]>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedParams = searchParams ? await searchParams : {};
  const redirectTo = extractSingleValue(resolvedParams, "redirectTo") ?? DEFAULT_AUTH_REDIRECT;
  const error = extractSingleValue(resolvedParams, "error");

  const { session } = await getAuthContext();
  if (session) {
    redirect(redirectTo ?? DEFAULT_AUTH_REDIRECT);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-lg">
        <div className="mb-8 flex flex-col gap-2 text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.4em] text-primary/80">
            Source 4 Industries
          </span>
          <h1 className="text-2xl font-semibold text-white">Sign in to your dashboard</h1>
          <p className="text-sm text-white/70">
            Use your Source 4 credentials to access the dashboard.
          </p>
        </div>
        <LoginForm redirectTo={redirectTo} initialError={error} />
        <p className="mt-8 text-center text-xs text-white/50">
          Need help? Contact the Source 4 team to request access.
        </p>
      </div>
    </main>
  );
}

function extractSingleValue(
  params: Record<string, string | string[]> | undefined,
  key: string,
): string | null {
  if (!params) return null;
  const value = params[key];
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value ?? null;
}
