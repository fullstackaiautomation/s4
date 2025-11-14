"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSupabaseServerClient } from "@/lib/supabase/server";

import { DEFAULT_AUTH_REDIRECT, sanitizeRedirect } from "@/lib/auth/roles";

export type LoginState = {
  status: "idle" | "error";
  message?: string;
};

export async function signInWithPasswordAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const redirectTo = sanitizeRedirect(formData.get("redirectTo")) ?? DEFAULT_AUTH_REDIRECT;

  if (!email || !password) {
    return {
      status: "error",
      message: "Email and password are required.",
    };
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return {
      status: "error",
      message: "Supabase credentials are not configured.",
    };
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return {
      status: "error",
      message: "Invalid email or password.",
    };
  }

  revalidatePath("/", "layout");
  redirect(redirectTo);
}

export async function exchangeCodeForSession(code: string | null): Promise<void> {
  if (!code) return;

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return;
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("Failed to exchange auth code", error);
    redirect("/login?error=auth");
  }

  revalidatePath("/", "layout");
  redirect(DEFAULT_AUTH_REDIRECT);
}

export async function signOutAction(formData: FormData): Promise<void> {
  const redirectTo = sanitizeRedirect(formData.get("redirectTo")) ?? "/login";

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    redirect(redirectTo);
  }

  const supabase = await getSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect(redirectTo);
}
