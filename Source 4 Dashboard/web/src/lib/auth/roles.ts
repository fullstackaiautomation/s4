import type { NextRequest } from "next/server";

export const ROLES = ["employee", "admin", "owner"] as const;

export type Role = (typeof ROLES)[number];

const ROLE_WEIGHT: Record<Role, number> = {
  employee: 0,
  admin: 1,
  owner: 2,
};

export const DEFAULT_AUTH_REDIRECT = "/dashboards/sales";

export type RouteRule = {
  pattern: RegExp;
  minRole: Role;
};

export const ROUTE_RULES: RouteRule[] = [
  { pattern: /^\/admin\/logins(\/|$)/, minRole: "owner" },
  { pattern: /^\/admin(\/|$)/, minRole: "admin" },
  { pattern: /^\/uploads(\/|$)/, minRole: "admin" },
  { pattern: /^\/automations(\/|$)/, minRole: "admin" },
  { pattern: /^\/dashboards(\/|$)/, minRole: "employee" },
  { pattern: /^\/sales(\/|$)/, minRole: "employee" },
  { pattern: /^\/marketing(\/|$)/, minRole: "employee" },
];

export const ROLE_LABEL: Record<Role, string> = {
  owner: "Owner",
  admin: "Admin",
  employee: "Employee",
};

export const DEFAULT_ROLE: Role = "employee";

export function getRoleLabel(role: Role = DEFAULT_ROLE): string {
  return ROLE_LABEL[role];
}

export function coerceRole(value: unknown): Role {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (ROLES.includes(normalized as Role)) {
      return normalized as Role;
    }
  }
  return DEFAULT_ROLE;
}

export function roleMeetsMinimum(role: Role, minRole: Role): boolean {
  return ROLE_WEIGHT[role] >= ROLE_WEIGHT[minRole];
}

export function minimumRoleForPath(pathname: string): Role | null {
  const rule = ROUTE_RULES.find((candidate) => candidate.pattern.test(pathname));
  return rule ? rule.minRole : null;
}

export function isProtectedPath(pathname: string): boolean {
  return ROUTE_RULES.some((rule) => rule.pattern.test(pathname));
}

export function getRoleFromMetadata(metadata: Record<string, unknown> | null | undefined): Role {
  if (!metadata) return DEFAULT_ROLE;
  const possible = metadata["role"] ?? metadata["Role"];
  return coerceRole(possible);
}

export function sanitizeRedirect(target: FormDataEntryValue | string | null | undefined): string | null {
  if (!target || typeof target !== "string") return null;
  if (!target.startsWith("/")) return null;
  if (target.startsWith("//")) return null;
  return target;
}

export function buildLoginRedirect(request: NextRequest): URL {
  const loginUrl = new URL("/login", request.url);
  const redirectTo = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  loginUrl.searchParams.set("redirectTo", redirectTo);
  return loginUrl;
}
