import Link from "next/link";
import { Lock } from "lucide-react";
import { requireAdminPermission } from "@/server/auth/rbac";
import { createServiceRoleSupabaseClient } from "@/server/db/supabase-admin";
import { AdminDashboardShell } from "@/components/admin/AdminDashboardShell";

export const dynamic = "force-dynamic";

/**
 * Strictly server-side protected Admin Dashboard (Blueprint Ch. 07 & Ch. 18).
 * Never reveals drafts, internal queue metrics, or admin controls to unauthenticated callers.
 */
export default async function AdminPage() {
  const auth = await requireAdminPermission("view_reports");

  if (!auth.ok) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-4 text-center">
        <div className="rounded-2xl border border-sp-border bg-white p-8 shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sp-navy text-white">
            <Lock className="h-5 w-5" aria-hidden="true" />
          </div>
          <p className="mt-4 text-xs font-bold uppercase tracking-wider text-sp-blue">
            HTTP {auth.status} — {auth.code}
          </p>
          <h1 className="mt-1 text-2xl font-extrabold text-sp-navy">
            Authorised Staff Session Required
          </h1>
          <p className="mt-2 text-sm text-sp-muted">
            Admin access is verified server-side against <code>public.admin_roles</code> with least-privilege RBAC. Browser-submitted role claims are never accepted.
          </p>
          <Link
            href="/en"
            className="mt-6 inline-block rounded-lg bg-sp-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-sp-navy-dark"
          >
            Return to SarkariPulse
          </Link>
        </div>
      </main>
    );
  }

  const adminClient = createServiceRoleSupabaseClient();
  let controls = {
    pause_source_fetching: false,
    pause_ai_generation: false,
    pause_translation: false,
    pause_pdf_creation: false,
    pause_publishing: true,
    updated_reason: null as string | null,
  };

  if (adminClient) {
    const { data } = await adminClient
      .from("system_controls")
      .select(
        "pause_source_fetching, pause_ai_generation, pause_translation, pause_pdf_creation, pause_publishing, updated_reason"
      )
      .eq("id", 1)
      .maybeSingle();
    if (data) {
      controls = data;
    }
  }

  return (
    <AdminDashboardShell
      snapshot={{
        actorRole: auth.principal.role,
        actorEmail: auth.principal.email,
        counts: {
          pendingVerification: 0,
          publishedActiveRecruitments: 0,
          closingSoonRecords: 0,
          brokenLinks: 0,
          failedOrDlqJobs: 0,
          outdatedVerification: 0,
        },
        controls,
      }}
    />
  );
}
