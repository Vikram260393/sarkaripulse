import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  Bell,
  BookOpen,
  CheckCircle2,
  Clock,
  FileText,
  Globe,
  Link2Off,
  Lock,
  PauseCircle,
  Search,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { AdminRole } from "@/server/auth/rbac";

export interface AdminDashboardSnapshot {
  actorRole: AdminRole;
  actorEmail: string | null;
  counts: {
    pendingVerification: number;
    publishedActiveRecruitments: number;
    closingSoonRecords: number;
    brokenLinks: number;
    failedOrDlqJobs: number;
    outdatedVerification: number;
  };
  controls: {
    pause_source_fetching: boolean;
    pause_ai_generation: boolean;
    pause_translation: boolean;
    pause_pdf_creation: boolean;
    pause_publishing: boolean;
    updated_reason: string | null;
  };
}

const ADMIN_MODULES = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "source-registry", label: "Source Registry", icon: Globe },
  { id: "source-health", label: "Source Health", icon: ShieldCheck },
  { id: "discovery-queue", label: "Discovery Queue", icon: Search },
  { id: "verification-queue", label: "Verification Queue", icon: CheckCircle2 },
  { id: "recruitments", label: "Recruitment Records", icon: FileText },
  { id: "articles", label: "Articles", icon: BookOpen },
  { id: "translations", label: "Translations (hi/mr)", icon: Globe },
  { id: "pdfs", label: "PDF Library", icon: FileText },
  { id: "users", label: "Users & Roles", icon: Users },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "seo", label: "SEO & Indexing", icon: Search },
  { id: "automation-runs", label: "Automation Runs & DLQ", icon: Clock },
  { id: "audit-logs", label: "Immutable Audit Logs", icon: Lock },
  { id: "settings", label: "Settings & Kill Switches", icon: Settings },
] as const;

export function AdminDashboardShell({
  snapshot,
}: {
  snapshot: AdminDashboardSnapshot;
}) {
  const switchEntries = [
    { key: "pause_source_fetching", label: "Source Fetching", paused: snapshot.controls.pause_source_fetching },
    { key: "pause_ai_generation", label: "AI Extraction & Writing", paused: snapshot.controls.pause_ai_generation },
    { key: "pause_translation", label: "Translation (hi/mr)", paused: snapshot.controls.pause_translation },
    { key: "pause_pdf_creation", label: "PDF Generation", paused: snapshot.controls.pause_pdf_creation },
    { key: "pause_publishing", label: "Automatic Publishing", paused: snapshot.controls.pause_publishing },
  ];

  return (
    <div className="min-h-screen bg-sp-bg">
      <header className="border-b border-sp-border bg-sp-navy text-white px-6 py-4">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-sp-accent">
              SarkariPulse Editorial &amp; Automation Control Plane
            </p>
            <h1 className="text-xl font-extrabold">Admin Operations Dashboard</h1>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="rounded-full bg-white/15 px-3 py-1 font-semibold">
              Role: {snapshot.actorRole}
            </span>
            <Link
              href="/en"
              className="rounded-lg border border-white/25 px-3 py-1.5 font-semibold hover:bg-white/10"
            >
              Public Site
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-8 lg:grid-cols-12">
        {/* 15 Blueprint Ch. 18 Modules Navigation */}
        <aside className="lg:col-span-3">
          <nav
            aria-label="Admin modules"
            className="rounded-xl border border-sp-border bg-white p-4 shadow-xs"
          >
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-sp-muted">
              Operations Modules (15)
            </h2>
            <ul className="space-y-1">
              {ADMIN_MODULES.map((mod) => {
                const Icon = mod.icon;
                return (
                  <li key={mod.id}>
                    <a
                      href={`#${mod.id}`}
                      className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-sp-text hover:bg-sp-bg hover:text-sp-navy"
                    >
                      <Icon className="h-4 w-4 text-sp-blue shrink-0" aria-hidden="true" />
                      <span>{mod.label}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        {/* Operational Overview & Independent Kill Switches */}
        <main className="lg:col-span-9 space-y-6">
          <section id="overview" aria-labelledby="overview-heading">
            <h2 id="overview-heading" className="mb-3 text-lg font-extrabold text-sp-navy">
              Live Queue &amp; Integrity Counters
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-sp-border bg-white p-4">
                <p className="text-xs font-semibold text-sp-muted">Pending Verification</p>
                <p className="mt-1 text-2xl font-extrabold text-sp-navy">
                  {snapshot.counts.pendingVerification}
                </p>
              </div>
              <div className="rounded-xl border border-sp-border bg-white p-4">
                <p className="text-xs font-semibold text-sp-muted">Published Active</p>
                <p className="mt-1 text-2xl font-extrabold text-emerald-800">
                  {snapshot.counts.publishedActiveRecruitments}
                </p>
              </div>
              <div className="rounded-xl border border-sp-border bg-white p-4">
                <p className="text-xs font-semibold text-sp-muted">Closing Soon</p>
                <p className="mt-1 text-2xl font-extrabold text-amber-800">
                  {snapshot.counts.closingSoonRecords}
                </p>
              </div>
              <div className="rounded-xl border border-sp-border bg-white p-4">
                <p className="flex items-center gap-1 text-xs font-semibold text-sp-muted">
                  <Link2Off className="h-3.5 w-3.5 text-rose-600" aria-hidden="true" />
                  Broken Official Links
                </p>
                <p className="mt-1 text-2xl font-extrabold text-rose-700">
                  {snapshot.counts.brokenLinks}
                </p>
              </div>
              <div className="rounded-xl border border-sp-border bg-white p-4">
                <p className="flex items-center gap-1 text-xs font-semibold text-sp-muted">
                  <AlertTriangle className="h-3.5 w-3.5 text-rose-600" aria-hidden="true" />
                  Failed / DLQ Jobs
                </p>
                <p className="mt-1 text-2xl font-extrabold text-rose-700">
                  {snapshot.counts.failedOrDlqJobs}
                </p>
              </div>
              <div className="rounded-xl border border-sp-border bg-white p-4">
                <p className="text-xs font-semibold text-sp-muted">Outdated Verification</p>
                <p className="mt-1 text-2xl font-extrabold text-sp-navy">
                  {snapshot.counts.outdatedVerification}
                </p>
              </div>
            </div>
          </section>

          <section
            id="settings"
            aria-labelledby="kill-switches-heading"
            className="rounded-xl border border-sp-border bg-white p-6 shadow-xs"
          >
            <h2
              id="kill-switches-heading"
              className="flex items-center gap-2 text-lg font-extrabold text-sp-navy"
            >
              <PauseCircle className="h-5 w-5 text-sp-blue" aria-hidden="true" />
              Independent Emergency Kill Switches
            </h2>
            <p className="mt-1 text-xs text-sp-muted">
              Controlled exclusively via <code>POST /api/admin/controls/pause</code> (requires <code>super_admin</code> + audit reason). Pausing pipelines never takes down the public website.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {switchEntries.map((sw) => (
                <div
                  key={sw.key}
                  className={`rounded-lg border p-3.5 ${
                    sw.paused
                      ? "border-amber-400 bg-amber-50"
                      : "border-emerald-200 bg-emerald-50"
                  }`}
                >
                  <p className="text-sm font-bold text-sp-navy">{sw.label}</p>
                  <p className="mt-1 text-xs font-semibold">
                    {sw.paused ? "PAUSED (Safe Hold)" : "ACTIVE"}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
