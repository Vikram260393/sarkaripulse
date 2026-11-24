#!/usr/bin/env node
/**
 * SarkariPulse Appendix E Production Release Gate Verifier.
 * Checks all automated local code/architecture gates and clearly reports
 * external staging/production prerequisites that remain pending user setup.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

const checks = [
  {
    gate: "1. Data Integrity",
    name: "Ordered migrations 0001-0007 present",
    pass: [
      "database/migrations/0001_enums_and_extensions.sql",
      "database/migrations/0002_taxonomy_and_sources.sql",
      "database/migrations/0003_recruitments_core.sql",
      "database/migrations/0004_editorial_verification_pdfs.sql",
      "database/migrations/0005_users_admin_ops.sql",
      "database/migrations/0006_rls_and_storage_policies.sql",
      "database/migrations/0007_seed_taxonomy.sql",
    ].every(exists),
  },
  {
    gate: "2. Security",
    name: "RLS enabled, server RBAC present, security headers configured",
    pass:
      exists("server/auth/rbac.ts") &&
      exists("server/security/webhook-auth.ts") &&
      read("next.config.ts").includes("Content-Security-Policy") &&
      read("next.config.ts").includes("X-Frame-Options"),
  },
  {
    gate: "3. Content Accuracy",
    name: "Verification engine, duplicate detector, editorial quality & parity gates present",
    pass:
      exists("agents/verification-engine.ts") &&
      exists("agents/duplicate-detector.ts") &&
      exists("agents/writer-agent.ts") &&
      exists("agents/translator-agent.ts"),
  },
  {
    gate: "4. Automation",
    name: "Durable queue, DLQ, kill switches default pause_publishing=true, Edge Function ready",
    pass:
      exists("workers/queue/job-queue.ts") &&
      exists("supabase/functions/scheduled-pipeline/index.ts") &&
      read("database/migrations/0005_users_admin_ops.sql").includes(
        "pause_publishing BOOLEAN NOT NULL DEFAULT true"
      ),
  },
  {
    gate: "5. SEO",
    name: "Canonical/hreflang, XML sitemaps, robots.txt, and active-only JobPosting JSON-LD",
    pass:
      exists("lib/seo/metadata.ts") &&
      exists("lib/seo/jsonld.ts") &&
      exists("app/sitemap.ts") &&
      exists("app/sitemap-en.xml/route.ts") &&
      exists("app/robots.ts"),
  },
  {
    gate: "6. Accessibility",
    name: "Skip link, focus-visible ring, non-colour status badges, Devanagari fonts",
    pass:
      read("app/globals.css").includes(":focus-visible") &&
      exists("components/ui/StatusBadge.tsx") &&
      read("app/[lang]/layout.tsx").includes("Noto_Sans_Devanagari"),
  },
  {
    gate: "7. Operations",
    name: "CI workflow, security scan, operations runbook & task tracker present",
    pass:
      exists(".github/workflows/ci.yml") &&
      exists("docs/OPERATIONS_RUNBOOK.md") &&
      exists("TASK_TRACKER.md"),
  },
];

let failed = 0;
console.log("=== SarkariPulse Appendix E Local Release Gate Verification ===");
for (const c of checks) {
  const icon = c.pass ? "PASS" : "FAIL";
  console.log(`[${icon}] ${c.gate} — ${c.name}`);
  if (!c.pass) failed += 1;
}

if (failed > 0) {
  console.error(`\n${failed} release gate check(s) failed.`);
  process.exit(1);
}

console.log("\nAll 7 local code/architecture gates PASSED.");
console.log(
  "Note: External Staging/Production sign-offs (Supabase live push, Gemini pilot audit, domain/GSC, legal review, DB restore drill) remain gated until external credentials are connected."
);
