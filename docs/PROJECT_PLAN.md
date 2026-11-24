# SarkariPulse — Project Plan & Phased Execution Roadmap (`PROJECT_PLAN.md`)

> **Version:** 1.0 | **Date:** 23 November 2026 | **Source Brief:** `SarkariPulse_Project_Master_Blueprint.pdf`  
> **Current Phase:** Phase 1 (Research, Architecture & Documentation — **No application coding until plan is approved**)

---

## 1. Product Definition & Charter

- **Platform:** SarkariPulse (`Your Career. Your Opportunity.`)
- **Purpose:** Help Indian candidates discover public-sector recruitments, understand eligibility, inspect verified dates/vacancies/fees/pay, access official notifications, and follow recruitment lifecycles through results.
- **Languages:** English (`/en/`, canonical master), Hindi (`/hi/`), Marathi (`/mr/`).
- **Geographic Scope:** India-wide central & state coverage with **Maharashtra priority**.
- **Brand Tokens:**
  - Primary Navy: `#123D78`
  - Secondary Blue: `#2878D0`
  - Background: `#F7F9FC`
  - Accent Orange: `#F59E0B`
  - Typography: `Inter` (Latin) + `Noto Sans Devanagari` (Hindi & Marathi web + embedded PDF fonts).
- **Publishing Model:** Automatic publication **only** when deterministic + evidence-based verification gates pass for trusted sources. All uncertain, incomplete, low-OCR, or conflicting records enter the human review queue.

---

## 2. Measurable Success Outcomes (No Artificial Guarantees)

| Dimension | Measurable Indicators |
| :--- | :--- |
| **Accuracy** | Confirmed correction rate, critical factual error rate (target: zero unverified critical facts published) |
| **Freshness** | Time from official notice publication -> discovery -> verification -> publication |
| **Reliability** | Source scan success rate, broken official link rate, failed/dead-lettered job rate, service uptime |
| **Candidate Experience** | Search success rate, official notification & apply link CTR, PDF readability, mobile usability, WCAG 2.2 AA compliance |
| **Search & Growth** | Core Web Vitals, organic impressions/clicks, returning candidates, alert opt-ins (no guaranteed rankings) |

---

## 3. Missing Prerequisites & User Decisions Required

> **Policy:** No credentials, domain ownership, competitor URLs, or deployment statuses have been invented. The items below must be supplied or confirmed before dependent phases execute.

| ID | Prerequisite | Needed By | Current Status |
| :--- | :--- | :--- | :--- |
| **PRE-01** | **Plan Approval:** Sign-off on this phased plan & architecture | Before Phase 2 | Pending user review |
| **PRE-02** | **6 Competitor Reference Sites:** User-supplied reference portals (Blueprint Ch. 3) for UX benchmarking | Phase 1 / 2 | Not yet provided |
| **PRE-03** | **Git Repository & Remote:** GitHub repo URL + branch protection setup (`main` / `development`) | Phase 2 | Not yet configured |
| **PRE-04** | **Supabase Staging & Production Projects:** Separate project URLs, anon keys, and server-only service-role keys | Phase 3 | Not yet provided |
| **PRE-05** | **Gemini API Key:** Server-side API credentials + daily budget cap | Phase 4 / 5 | Not yet provided |
| **PRE-06** | **Vercel Account & Project:** Connected to GitHub for Preview, Staging, and Production | Phase 2 / 8 | Not yet provided |
| **PRE-07** | **Domain & Brand Checks:** Registrar availability & trademark verification for `sarkaripulse.in` (primary) and `.com` / `.co.in` (defensive) | Phase 8 (Launch) | Unverified |
| **PRE-08** | **Transactional Email Provider:** API key & verified sender domain for candidate alerts and admin reports | Phase 7 / 8 | Not yet selected |
| **PRE-09** | **Legal & Compliance Review:** Review Privacy, Terms, Disclaimer, Advertising Policy, and Indian DPDP/consumer-protection obligations | Before Public Launch | Pending legal advice |
| **PRE-10** | **Cloudflare / DNS & Google Search Console:** DNS host and GSC verification token | Phase 8 | Not yet configured |

---

## 4. Phased Execution Sequence (Mapped to 30-Day Launch Plan & 9-Prompt Sequence)

### Phase 1 (Week 1 — Prompt 1): Research, Architecture & Living Documentation
- **Scope:** Inspect workspace & local tooling; establish living docs (`AGENTS.md`, `PROJECT_PLAN.md`, `ARCHITECTURE.md`, `DATABASE_DESIGN.md`, `SOURCE_REGISTRY.md`, `AGENT_WORKFLOWS.md`, `SEO_STRATEGY.md`, `SECURITY.md`, `DEPLOYMENT_GUIDE.md`, `TASK_TRACKER.md`); run competitor UX research once 6 reference sites are provided (`COMPETITOR_RESEARCH.md`, `FEATURE_MATRIX.csv`, `SOURCE_DISCOVERY_BACKLOG.md`).
- **Acceptance Criteria:**
  - All 10 living docs created, internally consistent, and aligned with Blueprint Ch. 01–36 & Appendices A–E.
  - Missing prerequisites explicitly listed without invented credentials or source statuses.
  - Plan reviewed and approved before any application code is written.

### Phase 2 (Week 1 — Prompt 2): Design System, Navigation & Public Frontend Shell
- **Scope:** Bootstrap Next.js (TypeScript) + Tailwind CSS repository structure; configure `Inter` and `Noto Sans Devanagari`; build brand design tokens, responsive layout shell, compact mobile navigation, breadcrumbs, visible search bar, disclaimer banner/footer, legal/policy page templates (About, Contact, Privacy, Terms, Disclaimer, Editorial Policy, Correction Policy, Advertising Policy), homepage shell, category/state/qualification landing page templates, and job detail page skeleton using typed mock fixtures.
- **Acceptance Criteria:**
  - `npm run lint`, `npm run typecheck`, and `npm run build` pass with zero errors.
  - Zero console errors on `/en/`, `/hi/`, `/mr/` routes; Devanagari script renders cleanly on desktop & mobile viewports.
  - Keyboard navigation, visible focus states, WCAG 2.2 AA contrast, and non-colour-only status badges verified.
  - Technical review completed before proceeding to data persistence.

### Phase 3 (Week 1–2 — Prompt 3): Database Schema, Migrations, Auth & RLS
- **Scope:** Author ordered, additive SQL migrations in `database/migrations/` covering all core entities, UUID PKs, UTC timestamps, controlled status enums/check constraints (Appendix A), foreign keys, uniqueness constraints, and indexes; implement Supabase Auth (optional candidate accounts + server-side admin RBAC for 5 roles); enforce strict Row-Level Security (RLS) on every exposed table; build public read-only API routes (`/api/public/*`) and candidate bookmarks/saved searches.
- **Acceptance Criteria:**
  - Migrations apply cleanly from scratch on local/staging Supabase without errors.
  - Automated RLS integration tests prove: anonymous users cannot read drafts/admin tables; User A cannot read/write User B's bookmarks or preferences; non-admin users cannot invoke admin endpoints; service-role key is absent from client bundles.
  - Database constraints reject invalid lifecycle transitions, negative vacancy counts, and start-after-end dates (unless flagged special correction).

### Phase 4 (Week 2 — Prompt 4): Official Source Registry, Scanning, Extraction & Verification Engine
- **Scope:** Seed a small, verified pilot set of Tier 1 official sources (Central + Maharashtra priority, e.g., UPSC, SSC, MPSC, Maharashtra Police, IBPS, RRB) with documented robots/terms checks; build isolated source adapters (timeouts, retries, ETag/Last-Modified caching, SHA-256 hashing, rate limits); implement PDF text extraction + page/row locator retention + OCR uncertainty flagging; implement Gemini server-side structured extraction (JSON Schema validated, prompt-injection hardened); implement deterministic verification engine, duplicate detector, conflict escalation, and publication gate ruleset (v1).
- **Acceptance Criteria:**
  - Pilot test notice fetched from an allowlisted source, original file & SHA-256 hash retained where permitted.
  - Extractor returns schema-valid facts with source URLs, evidence locators, and `null` for missing values.
  - Verification unit & integration tests prove: valid trusted fixture passes; deliberately altered date/vacancy total is caught and blocked (`review_required`); duplicate fixture detected without merging distinct annual cycles; prompt-injection fixture treated strictly as untrusted data.

### Phase 5 (Week 2–3 — Prompt 5): Editorial Article Generation, Hindi/Marathi Translation & PDF Library
- **Scope:** Implement English master article generator (all 18 required sections, honest unknown labels, no filler/fabricated FAQs); implement post-verification translation pipeline (`hi`, `mr`) with controlled recruitment glossaries and automated critical-fact parity checker (dates, numerals, vacancies, notification numbers, URLs); build language switcher linking to equivalent translated pages with clean fallback; implement secure PDF guide generator (branded *SarkariPulse informational guide*, embedded Devanagari fonts, QR to canonical URL only, separate Supabase Storage buckets, checksum & link verification, superseding lifecycle).
- **Acceptance Criteria:**
  - Generated English articles pass editorial completeness checks (no empty headings, disclaimer & official links present).
  - Translation tests confirm critical numerals, dates, notification numbers, and URLs remain identical across `en`, `hi`, `mr`.
  - PDF integration tests confirm Devanagari text is selectable and renders accurately, original official files remain untouched in a separate bucket, and oversized/malformed files are rejected by MIME + magic-byte validation.

### Phase 6 (Week 3–4 — Prompt 6): SEO, Structured Data, Search, Filters & Analytics
- **Scope:** Implement PostgreSQL full-text search over structured recruitment facts with combinable URL-shareable accessible filters (state, dept, qualification, age, salary, status, category, employment type, closing date); implement technical SEO (SSR, unique titles/descriptions, canonical URLs, `hreflang`, language-specific XML sitemaps, `robots.txt`, Open Graph, noindex on search/empty filter combos); implement eligible JSON-LD (`Article`, `BreadcrumbList`, `Organization`, `WebSite`, and strictly compliant `JobPosting` only for active specific vacancies); wire privacy-safe analytics (10 blueprint events, zero PII) and unauthenticated correction-report form routed to the verification queue.
- **Acceptance Criteria:**
  - Multi-filter search combinations return accurate counts, shareable URLs, and accessible clear/reset controls.
  - Canonical, `hreflang`, sitemap, `robots.txt`, and JSON-LD validators pass; closed recruitments are visibly marked closed and excluded from active `JobPosting` markup.
  - Analytics audit confirms no PII or raw search strings containing personal data are emitted.

### Phase 7 (Week 3 — Prompt 7): Admin Dashboard, Editorial Queue & Scheduled Automation
- **Scope:** Build server-protected Admin Dashboard modules (Overview, Source Registry, Source Health, Discovery Queue, Verification Queue, Recruitments, Articles, Translations, PDFs, Users, Notifications, SEO, Automation Runs, Audit Logs, Settings); enforce 5 least-privilege roles (`super_admin`, `editor`, `verifier`, `translator`, `analyst`); implement durable job queue with all 13 job types, idempotency keys, correlation IDs, exponential backoff + jitter, dead-letter queue, manual replay, independent emergency pause/kill switches (fetching, AI, translation, PDF, publishing), staggered Supabase Cron schedules, event-driven update proposals, daily/weekly/monthly operational reports, and email alert digests.
- **Acceptance Criteria:**
  - Every admin action (approve, reject, request correction, pause source) creates an immutable audit log with actor, timestamp, record, and reason.
  - Cron creates a queue task and worker processes it exactly once (idempotency verified on duplicate trigger).
  - Transient errors retry with backoff; permanent errors (404/403/malformed) route to DLQ without infinite retry.
  - Toggling the publishing kill switch halts new publications immediately without affecting public website availability.

### Phase 8 (Week 4 — Prompt 8): Testing, Security Audit, Staging/Production Deployment & Launch Gates
- **Scope:** Execute full automated test suite (Unit, Integration, RLS, Security — XSS/SQLi/CSRF/SSRF/open-redirect/rate-limit/secret-scan, Accessibility, Performance/Core Web Vitals, E2E for Candidate, Admin, and Translation journeys); deploy to Staging and run full pilot audit on real official notices; test database backup & restore; verify domain DNS, HTTPS, canonical redirects, and Google Search Console; complete all 7 Production Release Gates (Appendix E).
- **Acceptance Criteria:**
  - Zero critical factual test failures, zero unresolved high-severity security defects, zero unprotected admin endpoints.
  - All 7 Appendix E Production Release Gates signed off with recorded test evidence.
  - Unattended production publishing remains **disabled** until the limited human-audited pilot meets accuracy thresholds.

### Phase 9 (Post-Launch — Prompt 9): Controlled Continuous Maintenance & Operations
- **Scope:** Execute Daily, Weekly, and Monthly operator procedures (Blueprint Ch. 35); monitor source health, link validity, correction reports, AI cost budgets, and SEO indexing; gradually expand verified source registry only as accuracy metrics hold; run quarterly competitor UX benchmarks and periodic backup-restore drills.
- **Acceptance Criteria:**
  - Daily/weekly/monthly operational reports generated and reviewed on schedule.
  - Error rates remain below auto-pause threshold; kill-switch and rollback runbooks tested periodically.

---

## 5. Monetisation & Trust Safeguards (Blueprint Ch. 29)

- Public notification facts and official links will **never** be paywalled.
- Candidate personal data will **never** be sold.
- Advertisements/sponsorships (enabled only after traffic & policy eligibility) must be clearly labelled, visually separated from official links, and never obscure deadlines, fees, eligibility, or safety warnings.
- Editorial decisions remain strictly independent of advertising sales.

---

## 6. Key Risks & Mitigations Summary (Blueprint Ch. 34)

| Risk | Mitigation |
| :--- | :--- |
| **Factual errors** (wrong date/vacancy/link) | Official evidence requirement, deterministic consistency checks, review queue, transparent correction history, emergency unpublish |
| **Official source site redesign/outage** | Source health monitoring, parser versioning, circuit breakers, source-specific disable switch, freshness warning |
| **AI hallucinations & prompt injection** | Schema-constrained extraction, untrusted-data boundaries, evidence locators, deterministic verification gate |
| **Copyright / redistribution issues** | Original explanatory prose, link to official notices, preserve official files only where permitted, takedown route |
| **Security & privacy breach** | RLS on all exposed tables, server-side RBAC, secret managers, data minimisation, rate limiting, audit logs |
| **Cost escalation** (AI/storage/bandwidth) | Deterministic parsers first, tiered models, content-hash caching, per-job token limits, daily budget alerts & hard stop |
