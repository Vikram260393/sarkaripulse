import "server-only";
import { createSessionSupabaseClient } from "@/server/db/supabase-server";
import { createServiceRoleSupabaseClient } from "@/server/db/supabase-admin";

export type AdminRole =
  | "super_admin"
  | "editor"
  | "verifier"
  | "translator"
  | "analyst";

export type AdminPermission =
  | "view_reports"
  | "verify_recruitment"
  | "edit_article"
  | "publish_article"
  | "edit_translation"
  | "manage_sources"
  | "retry_jobs"
  | "toggle_kill_switch"
  | "manage_roles";

/**
 * Least-privilege permission matrix (Blueprint Ch. 18 & Ch. 23).
 */
export const ROLE_PERMISSIONS: Readonly<
  Record<AdminRole, readonly AdminPermission[]>
> = {
  super_admin: [
    "view_reports",
    "verify_recruitment",
    "edit_article",
    "publish_article",
    "edit_translation",
    "manage_sources",
    "retry_jobs",
    "toggle_kill_switch",
    "manage_roles",
  ],
  editor: [
    "view_reports",
    "edit_article",
    "publish_article",
    "edit_translation",
  ],
  verifier: ["view_reports", "verify_recruitment", "manage_sources"],
  translator: ["view_reports", "edit_translation"],
  analyst: ["view_reports"],
} as const;

export function roleHasPermission(
  role: AdminRole,
  permission: AdminPermission
): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export interface AdminPrincipal {
  userId: string;
  email: string | null;
  role: AdminRole;
  isActive: boolean;
}

export type AdminAuthResult =
  | { ok: true; principal: AdminPrincipal }
  | { ok: false; status: 401 | 403 | 503; code: "UNAUTHORIZED" | "FORBIDDEN" | "SERVICE_UNAVAILABLE"; message: string };

/**
 * Evaluates a resolved principal against a required permission.
 * Pure helper so RBAC rules can be exhaustively unit-tested.
 */
export function evaluateAdminAccess(
  principal: AdminPrincipal | null,
  requiredPermission: AdminPermission
): AdminAuthResult {
  if (!principal) {
    return {
      ok: false,
      status: 401,
      code: "UNAUTHORIZED",
      message: "Authenticated admin session is required.",
    };
  }
  if (!principal.isActive) {
    return {
      ok: false,
      status: 403,
      code: "FORBIDDEN",
      message: "Admin account is inactive.",
    };
  }
  if (!roleHasPermission(principal.role, requiredPermission)) {
    return {
      ok: false,
      status: 403,
      code: "FORBIDDEN",
      message: `Role '${principal.role}' does not have '${requiredPermission}' permission.`,
    };
  }
  return { ok: true, principal };
}

/**
 * Server-side RBAC enforcement against `public.admin_roles`.
 * NEVER trusts any role claim or header submitted by the browser.
 */
export async function requireAdminPermission(
  requiredPermission: AdminPermission
): Promise<AdminAuthResult> {
  const sessionClient = await createSessionSupabaseClient();
  const adminClient = createServiceRoleSupabaseClient();

  if (!sessionClient || !adminClient) {
    return {
      ok: false,
      status: 401,
      code: "UNAUTHORIZED",
      message: "Authenticated admin session is required.",
    };
  }

  const {
    data: { user },
    error: authError,
  } = await sessionClient.auth.getUser();

  if (authError || !user) {
    return {
      ok: false,
      status: 401,
      code: "UNAUTHORIZED",
      message: "Authenticated admin session is required.",
    };
  }

  const { data: roleRow, error: roleError } = await adminClient
    .from("admin_roles")
    .select("role, is_active")
    .eq("user_id", user.id)
    .maybeSingle();

  if (roleError || !roleRow) {
    return {
      ok: false,
      status: 403,
      code: "FORBIDDEN",
      message: "User does not hold an authorised admin role.",
    };
  }

  return evaluateAdminAccess(
    {
      userId: user.id,
      email: user.email ?? null,
      role: roleRow.role as AdminRole,
      isActive: Boolean(roleRow.is_active),
    },
    requiredPermission
  );
}
