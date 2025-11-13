import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import {
  DEFAULT_AUTH_REDIRECT,
  buildLoginRedirect,
  coerceRole,
  minimumRoleForPath,
  roleMeetsMinimum,
} from "@/lib/auth/roles";

const PUBLIC_ROUTES = new Set(["/login", "/forbidden", "/", "" ]);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicAsset(pathname)) {
    return NextResponse.next();
  }

  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/auth/verify");
  const isPublicRoute = isAuthRoute || PUBLIC_ROUTES.has(pathname);

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  const supabase = createSupabaseMiddlewareClient(request, response);
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    if (isPublicRoute) {
      return response;
    }
    return NextResponse.redirect(buildLoginRedirect(request));
  }

  if (isAuthRoute) {
    return NextResponse.redirect(new URL(DEFAULT_AUTH_REDIRECT, request.url));
  }

  const role = coerceRole(session.user?.app_metadata?.role ?? session.user?.user_metadata?.role);
  const minimumRole = minimumRoleForPath(pathname);

  if (minimumRole && !roleMeetsMinimum(role, minimumRole)) {
    const forbiddenUrl = new URL("/forbidden", request.url);
    forbiddenUrl.searchParams.set("redirectTo", DEFAULT_AUTH_REDIRECT);
    return NextResponse.redirect(forbiddenUrl);
  }

  return response;
}

function isPublicAsset(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/assets")
  );
}

function createSupabaseMiddlewareClient(request: NextRequest, response: NextResponse) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll().map(({ name, value }) => ({ name, value }));
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set({ name, value, ...options });
        });
      },
    },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|assets).*)"],
};
