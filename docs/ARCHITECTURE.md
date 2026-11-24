# SarkariPulse — Technical & Information Architecture (`ARCHITECTURE.md`)

> **Version:** 1.0 | **Date:** 23 November 2026 | **Source Brief:** `SarkariPulse_Project_Master_Blueprint.pdf` (Ch. 02, 04, 14, 15, 16, 17, 26, 28, 32)

---

## 1. System Architecture Overview

```text
                       ┌───────────────────────────────┐
                       │    Cloudflare DNS / Edge      │ (Optional WAF/CDN)
                       └───────────────┬───────────────┘
                                       │ HTTPS (Canonical Host)
                       ┌───────────────▼───────────────┐
                       │    Vercel (Next.js App)       │
                       │  ┌─────────────────────────┐  │
                       │  │ Public SSR Web (/en/hi/ │  │  Read-only published data
                       │  │ mr) & Public Read APIs  │  │
                       │  └────────────┬────────────┘  │
                       │  ┌────────────▼────────────┐  │
                       │  │ Admin Dashboard & APIs  │  │  Server-side RBAC + Audit Logs
                       │  └────────────┬────────────┘  │
                       └───────────────┼───────────────┘
                                       │
          ┌────────────────────────────┼────────────────────────────┐
          │                            │                            │
┌─────────▼─────────┐      ┌───────────▼───────────┐     ┌──────────▼──────────┐
│ Supabase Postgres │      │   Supabase Storage    │     │   AI Adapter Layer  │
│ + RLS + Auth      │      │ Bucket A: Official    │     │  (Gemini API,       │
│ + Durable Queue   │      │   (controlled/private)│     │   replaceable       │
│ + Cron Triggers   │      │ Bucket B: Public PDF  │     │   server-only)      │
└─────────▲─────────┘      │   Informational Guides│     └──────────▲──────────┘
          │                └───────────▲───────────┘                │
          │                            │                            │
┌─────────┴────────────────────────────┴────────────────────────────┴──────────┐
│           Authenticated Edge Functions / Dedicated Worker Service            │
│  [Source Adapters] -> [PDF/HTML Parser] -> [Extractor] -> [Verification Gate]│
│  -> [Article/Translator/PDF Pipelines] -> [Publisher] -> [Alerts & Reports]  │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │ Allowlisted HTTPS, Rate-Limited, Cached
                       ┌───────────────▼───────────────┐
                       │  Tier 1 & Tier 2 Official     │
                       │  Government Recruitment Sites │
                       └───────────────────────────────┘
```

### Core System Boundaries
1. **Public Frontend Boundary:** Reads **only** records explicitly marked `published` and public-safe via controlled server-side queries or public read APIs. Never touches service-role keys.
2. **Admin Boundary:** Enforced strictly server-side using authenticated Supabase sessions checked against `admin_roles`. Browser-submitted roles are never trusted.
3. **AI Agent Boundary:** AI models never receive direct database credentials. They accept sanitised, untrusted-data-wrapped inputs and emit schema-validated JSON proposals to controlled backend functions.
4. **External Source Boundary:** All outbound requests to government portals pass through allowlisted source adapters enforcing timeouts, retries, rate limits, robots/terms policies, conditional caching (`ETag` / `Last-Modified`), and evidence capture.

---

## 2. Environment Separation

| Environment | Purpose | Database & Storage | Secrets & Automation |
| :--- | :--- | :--- | :--- |
| **Local Development** | Feature development & unit/integration testing | Local Supabase / dev DB, synthetic fixtures | Local `.env.local` (gitignored), mocked external sources |
| **Staging** | End-to-end verification, pilot audits, QA | Dedicated staging Supabase project & buckets | Staging secrets, test email sink, controlled pilot schedules |
| **Production** | Live public platform | Dedicated production Supabase project & backups | Restricted production secrets, monitored crons, kill switches |

---

## 3. Information Architecture & URL Conventions

### Primary Navigation (20 Sections — Compact Mobile Layout)
- **Jobs by Scope:** Latest Jobs, Central Government, State Jobs, Maharashtra
- **Jobs by Sector:** Railway, Banking, Defence, Police, PSU, Teaching, Engineering
- **Lifecycle Events:** Results, Admit Cards, Answer Keys, Syllabus, Previous Papers, Admissions
- **Candidate Help:** Career Guides, Tools, Downloads

*Mobile Design Rule:* Avoid oversized nested menus; expose a sticky/accessible search entry point, compact top navigation, category landing pages, breadcrumbs, and contextual links to related recruitment stages on every page.

### Page Taxonomy
1. **Recruitment Pages:** Specific official recruitment or examination cycle (facts, dates, vacancies, eligibility, links, source evidence, update history).
2. **Category Pages:** Grouped by sector, qualification, state, department, or exam — with unique explanatory copy.
3. **Event Pages:** Results, admit cards, answer keys, exam schedules, corrigenda.
4. **Guide Pages:** Application walkthroughs, eligibility concepts, documents, pay structures, preparation guides.
5. **Utility Pages:** Age/pay calculators and alert sign-up — must explicitly state assumptions and clarify estimates are not official determinations.
6. **Trust & Legal Pages:** About, Contact, Privacy Policy, Terms of Use, Disclaimer, Editorial Policy, Correction Policy, Advertising Policy.

### URL & Slug Conventions
- Language prefixes: `/en/`, `/hi/`, `/mr/` (canonical hostname enforced via 301 redirect).
- Stable, lowercase, hyphenated slugs. Avoid dates in URLs unless needed to distinguish annual cycles.
- Representative routes:
  - `/en/latest-jobs/`
  - `/en/jobs/{slug}/`
  - `/en/results/`, `/en/admit-cards/`, `/en/answer-keys/`
  - `/en/states/maharashtra/`
  - `/en/qualification/12th-pass/`
  - `/en/category/{sector}/`
- Never change an established URL casually; if required, create a 1-to-1 HTTP 301 redirect and update internal links & sitemaps.

---

## 4. Multilingual Architecture (`en`, `hi`, `mr`)

- **Canonical Master:** English (`en`) structured facts and master article are verified first.
- **Linked Translations:** Hindi (`hi`) and Marathi (`mr`) articles link to the English `article_id` and `source_version` and carry independent `review_status`, `translation_model`, and `glossary_version`.
- **Critical-Fact Parity:** Dates, numerals, vacancy totals, official organisation names, notification numbers, and official URLs must match the English master exactly. Preserve official English department names alongside regional names where helpful for search clarity.
- **Typography:** `Inter` (Latin) + `Noto Sans Devanagari` (Devanagari). Test conjuncts, matras, punctuation, numerals, and line breaks on Android, iOS, and PDF viewers.
- **Language Switcher & Fallback:** Links directly to the equivalent translated URL when published; if unavailable, clearly states available languages and links to the verified English master without auto-publishing unverified machine translations of critical application instructions.

---

## 5. PDF Generation & Document Library Architecture

- **Document Types:** Original official notification (preserved unchanged where terms permit); SarkariPulse recruitment summary; application checklist; eligibility guide; syllabus guide; authorised previous paper; exam calendar; multilingual quick guide.
- **Visual & Legal Labelling:** Every generated PDF must prominently display **"SarkariPulse informational guide — Not an official government notification"**, source URLs, generation date, version number, page numbers, and disclaimer.
- **Storage Separation:**
  - `official-source-docs` (controlled bucket — restricted access / signed URLs or approved read policy per document redistribution rights).
  - `public-guides` (public-read bucket — only approved generated guides).
- **Technical Guarantees:** Embedded Unicode/Devanagari fonts, escaped untrusted inputs, page/image/memory/time limits, SHA-256 checksum recorded in `pdf_documents`, QR code only when resolving to the canonical URL, post-upload integrity & link check, superseding lifecycle when material facts change.

---

## 6. Search, Filters & Candidate Accounts

- **Search:** Powered initially by PostgreSQL full-text search + trigram/alias matching indexed on **structured recruitment facts** (title, organisation, department, post name, qualification, state, category, notification number) — not just free-text article bodies. Upgrade to dedicated search infrastructure only when measured latency/relevance requires it.
- **Combinable Filters:** State/UT, department, qualification, age range, salary band, application status, job category, employment type, closing date. Shareable via URL query params (with `noindex` on arbitrary filter/search combinations), keyboard/screen-reader accessible, showing live result counts and single-filter / reset-all controls.
- **Candidate Accounts (Optional):** Full browsing without login. Optional Supabase Auth account for bookmarks, saved searches, and email alerts (digest & deduplicated). Browser push added later with explicit opt-in/opt-out. Data export and account deletion flows included.

---

## 7. API Contracts & Versioning (Blueprint Ch. 32)

### Public Read Endpoints (Rate-Limited, Typed, Cached)
- `GET /api/public/recruitments` (cursor pagination, combinable filters, `lang`)
- `GET /api/public/recruitments/{slug}` (structured facts, dates, posts, verified links, article, available translations, PDFs, last-verified timestamp)
- `GET /api/public/categories`
- `GET /api/public/search`
- `POST /api/public/correction-reports` (unauthenticated, rate-limited, routed to verification queue)

### Admin Endpoints (Authenticated Session + Server-Side RBAC + Audit Logged)
- `POST /api/admin/sources/scan` (idempotent scan trigger)
- `POST /api/admin/recruitments/{id}/verify` (approve/hold/reject with reason)
- `POST /api/admin/articles/{id}/publish` (idempotency key, kill-switch check)
- `POST /api/admin/jobs/{id}/retry` (DLQ replay with idempotency protection)
- `POST /api/admin/controls/pause` (independent kill switches)

### Webhook & Worker Endpoints
- `POST /api/webhooks/source-event` & scheduled worker triggers — strictly require HMAC signature or shared secret authentication. Never expose service-role operations as unauthenticated REST routes.

### Response & Versioning Conventions
- Return stable UUIDs, cursor tokens, ISO-8601 UTC timestamps (plus date-only `YYYY-MM-DD` for calendar dates), explicit currency/pay period labels (`monthly` / `annual` / `basic_pay` / `pay_level`), and machine-readable error codes (`{ error: { code, message, correlation_id } }`) with zero stack traces or secret leakage.
- Prefer additive backward-compatible API changes; version extraction schemas, prompts, glossaries, and verification rulesets independently.

---

## 8. Performance, Accessibility, Reliability & Cost Controls

- **Performance:** Server-rendered content pages, minimal client JS bundles, optimised fonts/images, pagination, cache revalidation on publication/correction events, Core Web Vitals monitoring.
- **Accessibility:** Target WCAG 2.2 AA — semantic landmarks/headings, keyboard operability, visible focus rings, contrast checks, accessible tables & form errors, `lang` attributes, status conveyed with text + icons (never colour alone).
- **Reliability:** Health checks (`/api/health` for app/DB/storage/queue), graceful degradation (public site continues serving cached/published content if AI API is down), per-source circuit breakers.
- **AI & Infra Cost Controls:** Deterministic HTML/PDF parsing before LLM calls; tiered Gemini models (smaller model for classification/drafts, larger model for ambiguous extraction); content-hash caching to prevent redundant regeneration; per-job token caps, daily budget alerts, and automated hard stops.

---

## 9. Architecture Decision Record (ADR) Log

| ADR ID | Date | Decision | Status |
| :--- | :--- | :--- | :--- |
| ADR-001 | 2026-11-23 | Adopt Next.js (TS) + Tailwind + Supabase + Vercel + replaceable Gemini adapter per Blueprint Ch. 04 | Proposed (awaiting Phase 1 sign-off) |
| ADR-002 | 2026-11-23 | Separate `editorial_state`, `verification_status`, and real-world `recruitment_lifecycle` columns | Proposed |
| ADR-003 | 2026-11-23 | Start search on PostgreSQL FTS over structured columns; defer dedicated search engine until measured need | Proposed |
| ADR-004 | 2026-11-23 | Keep unattended production publishing disabled behind kill switch until pilot accuracy audit passes | Proposed |
