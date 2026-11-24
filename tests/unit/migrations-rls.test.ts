import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const MIGRATIONS_DIR = path.resolve(process.cwd(), "database/migrations");

function readAllMigrations(): { files: string[]; combined: string; byFile: Record<string, string> } {
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  const byFile: Record<string, string> = {};
  for (const file of files) {
    byFile[file] = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
  }
  return {
    files,
    byFile,
    combined: files.map((f) => byFile[f]).join("\n\n"),
  };
}

describe("Database Migrations & RLS Governance (Blueprint Ch. 06, 07, 23, Appendix A)", () => {
  const { files, byFile, combined } = readAllMigrations();

  it("has ordered migrations 0001 through 0007", () => {
    expect(files).toEqual([
      "0001_enums_and_extensions.sql",
      "0002_taxonomy_and_sources.sql",
      "0003_recruitments_core.sql",
      "0004_editorial_verification_pdfs.sql",
      "0005_users_admin_ops.sql",
      "0006_rls_and_storage_policies.sql",
      "0007_seed_taxonomy.sql",
    ]);
  });

  it("defines all 24 core and supporting Blueprint entities", () => {
    const requiredTables = [
      "states",
      "categories",
      "sources",
      "source_checks",
      "source_documents",
      "organization_aliases",
      "recruitments",
      "recruitment_posts",
      "recruitment_dates",
      "recruitment_qualifications",
      "recruitment_links",
      "verification_checks",
      "articles",
      "article_translations",
      "content_versions",
      "pdf_documents",
      "users",
      "bookmarks",
      "notification_preferences",
      "admin_roles",
      "automation_runs",
      "automation_jobs",
      "audit_logs",
      "seo_metrics",
      "correction_reports",
      "system_controls",
    ];

    for (const table of requiredTables) {
      expect(combined).toContain(`CREATE TABLE IF NOT EXISTS public.${table}`);
    }
  });

  it("enables Row-Level Security (RLS) on EVERY application table", () => {
    const rlsSql = byFile["0006_rls_and_storage_policies.sql"];
    const tableMatches = [
      ...combined.matchAll(/CREATE TABLE IF NOT EXISTS public\.([a-z_]+)/g),
    ].map((m) => m[1]);

    expect(tableMatches.length).toBeGreaterThanOrEqual(24);
    for (const table of tableMatches) {
      expect(
        rlsSql,
        `Missing ENABLE ROW LEVEL SECURITY for table public.${table}`
      ).toContain(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`);
    }
  });

  it("enforces published + public-safe gating and per-user auth.uid() isolation in RLS", () => {
    const rlsSql = byFile["0006_rls_and_storage_policies.sql"];
    expect(rlsSql).toContain("editorial_state = 'published' AND is_public_safe = true");
    expect(rlsSql).toContain("parity_check_passed = true");
    expect(rlsSql).toContain("is_public_approved = true");
    expect(rlsSql).toContain("user_id = auth.uid()");
    expect(rlsSql).toContain("id = auth.uid()");

    // Verify internal/admin tables have ZERO public/authenticated policies
    const internalOnlyTables = [
      "sources",
      "source_checks",
      "source_documents",
      "verification_checks",
      "content_versions",
      "admin_roles",
      "automation_runs",
      "automation_jobs",
      "audit_logs",
      "seo_metrics",
      "correction_reports",
      "system_controls",
    ];
    for (const table of internalOnlyTables) {
      const policyRegex = new RegExp(`CREATE POLICY[\\s\\S]*?ON public\\.${table}\\b`, "i");
      expect(
        policyRegex.test(rlsSql),
        `Internal table public.${table} must NOT have any public/authenticated RLS policy`
      ).toBe(false);
    }
  });

  it("enforces Appendix A controlled enum values and data integrity constraints", () => {
    const enumsSql = byFile["0001_enums_and_extensions.sql"];
    expect(enumsSql).toContain("'review_required'");
    expect(enumsSql).toContain("'dead_lettered'");
    expect(enumsSql).toContain("'admit_card_released'");
    expect(enumsSql).toContain("'result_declared'");
    expect(enumsSql).toContain("'super_admin'");

    const recSql = byFile["0003_recruitments_core.sql"];
    expect(recSql).toContain("vacancy_total >= 0");
    expect(recSql).toContain("application_start <= application_end");
    expect(recSql).toContain("idx_recruitments_dedup_official_ref");
  });

  it("enforces Privacy by Design (no Aadhaar/PAN/bank/OTP columns in users) & immutable audit_logs", () => {
    const opsSql = byFile["0005_users_admin_ops.sql"];
    const usersBlock = opsSql.slice(
      opsSql.indexOf("CREATE TABLE IF NOT EXISTS public.users"),
      opsSql.indexOf("CREATE TABLE IF NOT EXISTS public.bookmarks")
    );
    for (const forbidden of ["aadhaar", "pan_number", "bank_account", "caste_certificate", "otp"]) {
      expect(usersBlock.toLowerCase()).not.toContain(forbidden);
    }

    expect(opsSql).toContain("trg_audit_logs_immutable");
    expect(opsSql).toContain("pause_publishing BOOLEAN NOT NULL DEFAULT true");
  });

  it("isolates official source documents and public informational guides into separate storage buckets", () => {
    const rlsSql = byFile["0006_rls_and_storage_policies.sql"];
    expect(rlsSql).toContain("('official-source-docs', 'official-source-docs', false");
    expect(rlsSql).toContain("('public-guides', 'public-guides', true");
  });
});
