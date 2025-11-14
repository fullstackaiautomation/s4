import { cache } from "react";

import type { Session, User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import { getSupabaseServerClient } from "@/lib/supabase/server";

import { DEFAULT_ROLE, Role, coerceRole, getRoleFromMetadata } from "./roles";

export type AuthContext = {
  session: Session | null;
  user: User | null;
  role: Role;
};

export type AuthenticatedContext = {
  session: Session;
  user: User;
  role: Role;
};

const isStaticExport =
  process.env.GITHUB_PAGES === "true" || process.env.NEXT_PUBLIC_DEPLOY_TARGET === "github-pages";

const STATIC_USER = {
  id: "static-user",
  email: "demo@source4industries.com",
} as unknown as User;

const STATIC_SESSION = {
  user: STATIC_USER,
  expires: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
  token_type: "bearer",
  access_token: "static",
  refresh_token: "static",
} as unknown as Session;

export const getAuthContext = cache(async (): Promise<AuthContext> => {
  if (isStaticExport) {
    return {
      session: STATIC_SESSION,
      user: STATIC_USER,
      role: DEFAULT_ROLE,
    };
  }

  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.warn("Failed to fetch Supabase session", error);
    }

    const user = session?.user ?? null;
    const role = user
      ? deriveRoleFromUser(user)
      : DEFAULT_ROLE;

    return {
      session: session ?? null,
      user,
      role,
    };
  } catch (error) {
    console.warn("Supabase session lookup threw", error);
    return {
      session: null,
      user: null,
      role: DEFAULT_ROLE,
    };
  }
});

export async function requireAuthContext(): Promise<AuthenticatedContext> {
  if (isStaticExport) {
    return {
      session: STATIC_SESSION,
      user: STATIC_USER,
      role: DEFAULT_ROLE,
    };
  }

  const context = await getAuthContext();
  if (!context.session || !context.user) {
    redirect("/login");
  }
  return {
    session: context.session,
    user: context.user,
    role: context.role,
  };
}

export function deriveRoleFromUser(user: User): Role {
  const roleFromAppMeta = getRoleFromMetadata(user.app_metadata as Record<string, unknown> | null | undefined);
  if (roleFromAppMeta !== DEFAULT_ROLE) {
    return roleFromAppMeta;
  }

  if (user.user_metadata) {
    const userMetaRole = getRoleFromMetadata(user.user_metadata as Record<string, unknown>);
    if (userMetaRole !== DEFAULT_ROLE) {
      return userMetaRole;
    }
  }

  const claimRole = coerceRole(user.role);
  return claimRole;
}
