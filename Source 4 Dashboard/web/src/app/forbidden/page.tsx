import Link from "next/link";

import { DEFAULT_AUTH_REDIRECT } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";

type ForbiddenPageProps = {
  searchParams?: Promise<Record<string, string | string[]>>;
};

export default async function ForbiddenPage({ searchParams }: ForbiddenPageProps) {
  const resolvedParams = searchParams ? await searchParams : {};
  const redirectTo = extractParam(resolvedParams, "redirectTo") ?? DEFAULT_AUTH_REDIRECT;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 py-16 text-white">
      <div className="max-w-md rounded-2xl border border-white/10 bg-white/5 p-10 text-center shadow-xl backdrop-blur-lg">
        <div className="mb-4 text-sm font-semibold uppercase tracking-[0.4em] text-primary/70">
          Access Restricted
        </div>
        <h1 className="mb-3 text-2xl font-semibold">You don&apos;t have permission</h1>
        <p className="mb-6 text-sm text-white/70">
          This area of the dashboard is limited to higher access levels. If you believe this is a
          mistake, contact an administrator.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href={redirectTo}
            className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/30"
          >
            Return to dashboard
          </Link>
          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white/80 hover:border-white/40"
          >
            Switch account
          </Link>
        </div>
      </div>
    </main>
  );
}

function extractParam(
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
