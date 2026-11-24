# SarkariPulse — Deployment, DevOps & Operations Guide (`DEPLOYMENT_GUIDE.md`)

> **Version:** 1.0 | **Date:** 23 November 2026 | **Source Brief:** `SarkariPulse_Project_Master_Blueprint.pdf` (Ch. 05, 27, 28, 35, 36, Appendix E)

---

## 1. Local Environment Audit (Captured 23 November 2026)

| Tool | Required (Blueprint Ch. 27) | Detected Status | Action Needed |
| :--- | :--- | :--- | :--- |
| **Node.js** | Supported LTS | `v22.18.0` (Installed) | Ready |
| **npm** | Included with Node | `10.9.3` (Installed) | Ready |
| **Git** | Required for branch workflow | **NOT INSTALLED** | **Install Git for Windows before Phase 2** |
| **Python** | Optional (helper scripts/PDF QA) | `3.12.10` (Installed) | Ready |
| **Supabase CLI** | Recommended for migrations | Not installed globally | Use `npx supabase` or install CLI before Phase 3 |
| **Vercel CLI** | Optional for preview/deploy | Not installed globally | Connect GitHub to Vercel or use `npx vercel` |
| **Docker** | Optional (local Supabase stack) | Not installed | Use remote Supabase Staging/Dev project or install Docker Desktop |

---

## 2. Domain, Brand Protection & Mandatory Trust Pages (Blueprint Ch. 05)

- **Proposed Domain Candidates (UNVERIFIED — check registrar & trademark conflicts before purchase):**
  - Primary: `sarkaripulse.in`
  - Defensive: `sarkaripulse.com`, `sarkaripulse.co.in`
- **Brand Safety:** Conduct trademark search in relevant classes; never use national emblems, government seals, or official-looking marks.
- **Canonical Host & DNS:** Choose one canonical HTTPS hostname, enable registrar lock & MFA, configure permanent 301 redirects from non-canonical variants, and document all DNS changes.
- **Mandatory Launch Policy Pages:** About, Contact, Privacy Policy, Terms of Use, Disclaimer, Editorial Policy, Correction Policy, Advertising Policy.

---

## 3. Git Workflow & CI Pipeline (Blueprint Ch. 27)

- **Branches:**
  - `main`: Production releases only (protected, PR required).
  - `development`: Staging/integration branch.
  - `feat/*`, `fix/*`, `chore/*`: Short-lived feature branches.
- **Mandatory PR Review:** Required for all schema migrations, auth/RLS policies, security rules, verification/publishing gates, and infrastructure configs.
- **CI Quality Checks (on every PR):**
  1. `npm run lint`
  2. `npm run typecheck`
  3. Unit & schema validation tests
  4. Migration dry-run / SQL lint check
  5. `npm run build`
  6. Dependency & secret scanning

---

## 4. Environment & Deployment Architecture

### Supabase (Separate Staging & Production Projects)
1. Apply version-controlled additive migrations in `database/migrations/` strictly in order.
2. Configure Supabase Auth redirect URLs per environment.
3. Verify RLS enabled on every exposed table.
4. Create separate Storage buckets (`official-source-docs`, `public-guides`) with explicit bucket policies.
5. Deploy authenticated Edge Functions (`supabase/functions/`) and configure staggered Supabase Cron schedules.
6. Enable automated database backups according to plan; configure separate object storage backup; define RPO/RTO and **test database restoration** (not just backup creation) before launch.

### Vercel (Next.js App)
1. Connect GitHub repository; enable Preview deployments on PRs and Staging deployment on `development`.
2. Store environment secrets in Vercel Environment Variables scoped strictly by Preview / Production.
3. Restrict production deployment permissions; verify canonical host, HTTPS, redirects, and `/api/health`.

### Rollback Procedure
- Retain previous Vercel deployment for immediate 1-click rollback.
- Author backward-compatible, additive database migrations; never drop/rename columns in the same release that removes application dependency.
- Create a database recovery point prior to schema changes and document the responsible release operator for every production push.

---

## 5. Production Release Gates (Blueprint Appendix E)

> **Hard Rule:** Do **not** enable unattended production publishing until **all 7 gates** pass and a limited human-audited pilot is completed.

| Gate | Pass Condition | Owner | Status |
| :--- | :--- | :--- | :--- |
| **1. Data Integrity** | Migrations, constraints, indexes, and backup/restore verified | Backend Lead | `LOCAL_PASS` (Staging DB push & restore drill pending `PRE-04`) |
| **2. Security** | RLS, 5 admin roles, secrets, rate limits, and admin routes tested | Security Owner | `LOCAL_PASS` (Live Staging RLS probe pending `PRE-04`) |
| **3. Content Accuracy** | All 14 critical facts tied to official evidence; verification gate tested | Editorial/Verification Owner | `LOCAL_PASS` (Live Tier 1 pilot audit pending `PRE-05`) |
| **4. Automation** | Idempotency, retries, dead-letter queue, and independent kill switches tested | Automation Owner | `LOCAL_PASS` (Staging Edge Function deploy pending `PRE-04`) |
| **5. SEO** | Canonical, `hreflang`, XML sitemaps, `robots.txt`, and JSON-LD validated | SEO Owner | `LOCAL_PASS` (GSC submission pending `PRE-10`) |
| **6. Accessibility** | Keyboard nav, labels, WCAG 2.2 AA contrast, mobile & Devanagari rendering checked | Frontend Owner | `LOCAL_PASS` (Verified on `http://localhost:3000`) |
| **7. Operations** | Monitoring, alerts, daily/weekly reports, incident & rollback runbooks ready | Operations Owner | `LOCAL_PASS` (Email/alerting provider pending `PRE-08`) |

---

## 6. Cost Management & Scaling Triggers (Blueprint Ch. 28)

- **Cost Categories:** Domain registration, Vercel hosting/bandwidth, Supabase compute/storage/backups, Gemini API tokens, transactional email delivery, monitoring, optional Cloudflare WAF/CDN. *(Verify live vendor pricing before production; do not assume free tiers support production SLAs.)*
- **AI Cost Controls:** Deterministic parsers first -> tiered Gemini models -> content-hash caching -> per-job token caps -> daily spend alerts & hard stop.
- **Scaling Triggers:**
  - Upgrade DB/hosting when measured CPU, memory, storage, latency, or concurrency approaches plan thresholds.
  - Move from Cron/Edge Functions to a dedicated worker service when execution timeouts or job volume exceed Edge limits.
  - Add dedicated search engine only if PostgreSQL FTS fails measured relevance/latency targets.
  - Load-test public routes strictly with synthetic traffic (never against government portals).

---

## 7. Operating Manuals (Blueprint Ch. 35)

- **Daily:** Review automation health, source failures, held verification records, critical corrections, broken official links, approaching deadlines, AI cost alerts, unusual traffic; spot-check newly published articles & translations; verify core candidate journeys.
- **Weekly:** Audit source reliability & parser failures; sample-audit verified fields against original official PDFs; review correction reports & user feedback; inspect Search Console indexing/SEO issues; verify backup status & restore-test schedule.
- **Monthly:** Audit admin permissions, API keys, dependency patches, vendor costs, outdated pages; revalidate official source domains; review privacy/advertising/policy updates; update roadmap & risk register.
