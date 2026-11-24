# SarkariPulse — Operations Manual, Incident Playbooks & Rollback Runbook (`OPERATIONS_RUNBOOK.md`)

> **Version:** 1.0 | **Date:** 23 November 2026 | **Source Brief:** `SarkariPulse_Project_Master_Blueprint.pdf` (Ch. 23, 27, 35, 36, Appendix E)

---

## 1. Daily Operator Procedure (15–20 minutes)

1. **Check Health & Kill Switches:** Open `/api/health` and `/admin` (authenticated staff session). Confirm database reachability and expected kill-switch states.
2. **Review Automation & DLQ:** Inspect `automation_jobs` where `status = 'dead_lettered'` or `'failed'`. Never blindly replay permanent `404`/`403` errors — investigate source URL/parser changes first.
3. **Triage Verification & Correction Queues:** Review all `verification_status = 'review_required'` records, material corrigendum conflicts, and incoming `correction_reports`.
4. **Check Official Link Health & Approaching Deadlines:** Inspect any `link_status IN ('unavailable', 'suspicious', 'requires_review')` and verify `closing_soon` records still point to working official portals.
5. **Spot-Check Published Quality:** Audit a random sample of newly published English, Hindi, and Marathi pages plus downloadable PDFs.
6. **Review AI Spend & Traffic Anomalies:** Verify daily estimated AI spend is below the 80% warning threshold and check for unusual auth/API rate-limit spikes.

---

## 2. Weekly Operator Procedure

1. **Source Reliability & Parser Audit:** Review `source_checks` failure rates and parser errors; disable any degraded adapter risking harmful repeated requests.
2. **Evidence Sample Audit:** Independently cross-check a random sample of automatically published fields (dates, vacancies, eligibility, apply URLs) against the original official PDFs. If critical error rate exceeds tolerance, immediately switch that source back to `trust_policy = 'manual_only'`.
3. **SEO & Search Console Review:** Inspect Google Search Console indexing, canonicalisation, `hreflang`, sitemap freshness, and Core Web Vitals.
4. **Backup Verification:** Confirm scheduled Supabase database backups and object storage backups completed cleanly, and verify the next scheduled restore drill date.

---

## 3. Monthly Operator Procedure

1. **Access & Secret Hygiene:** Audit `public.admin_roles` (remove inactive staff, enforce least privilege, verify zero shared accounts), rotate secrets if due, and run `npm audit` / dependency updates.
2. **Official Source Domain Revalidation:** Re-verify official domain ownership and `robots.txt`/terms status for priority Central and Maharashtra sources.
3. **Content & Policy Review:** Audit expired/closed pages (confirm clearly marked closed and linked to newer cycles), review Privacy/Disclaimer/Advertising policies, and update the Risk Register.
4. **Quarterly Competitor UX Benchmark:** Refresh `COMPETITOR_RESEARCH.md` and `FEATURE_MATRIX.csv` quarterly (UX discovery only — zero copying).

---

## 4. Incident Response Playbooks

### Playbook A — Incorrect Published Recruitment Detail (SEV-1 / SEV-2)
1. **Contain:** If the error risks missed deadlines, wrong fees, or an unsafe apply link, immediately set `editorial_state = 'unpublished'` (or toggle `pause_publishing = true` via `POST /api/admin/controls/pause`).
2. **Verify Primary Evidence:** Download and inspect the Tier 1 official notification / corrigendum directly from the recruiting authority domain.
3. **Correct & Preserve History:** Update structured fields in `recruitments` / `recruitment_dates`, write a `content_versions` snapshot, regenerate `hi`/`mr` translations (verifying parity) and branded PDF guides (marking previous guides `is_superseded = true`).
4. **Communicate Transparently:** Republish with a clear `update_note`, updated `last_verified_at` (IST), and supporting official source link. Record an immutable `audit_logs` entry. Never silently erase factual errors.

### Playbook B — Compromised Credential or Secret Exposure (SEV-1)
1. **Revoke & Rotate Immediately:** Rotate the exposed key (`SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `CRON_SECRET`, `WEBHOOK_SIGNING_SECRET`, or email key) in Supabase/Vercel secret managers.
2. **Pause Affected Integrations:** Toggle relevant kill switches (`pause_source_fetching`, `pause_ai_generation`, `pause_publishing`).
3. **Investigate:** Inspect Supabase Auth logs, `audit_logs`, and Vercel access logs for unauthorized reads/writes.
4. **Recover & Document:** Restore verified state, re-run `npm run security:scan`, and write a post-incident timeline.

### Playbook C — Official Government Source Outage or Redesign (SEV-3)
1. **Prevent Harm:** Confirm `SourceCircuitBreaker` tripped or manually set `sources.health_status = 'degraded'` / `is_active = false` so workers do not hammer the government server.
2. **Preserve Candidate Utility:** Keep last verified published pages online with a clear freshness timestamp.
3. **Update Parser:** Inspect changed HTML/PDF layout in Staging, bump `parser_version`, test against a captured notice fixture, and re-enable in `manual_only` mode first.

### Playbook D — AI Provider Outage (SEV-3)
1. **Graceful Degradation:** Public website continues serving all existing published pages uninterrupted.
2. **Queue Safely:** Toggle `pause_ai_generation = true` if errors spike; never publish incomplete or unverified drafts.
3. **Resume:** Once provider recovers (or after swapping adapter in `server/ai/provider.ts`), clear pause switch and replay dead-lettered extraction jobs via `POST /api/admin/jobs/[id]/retry`.

---

## 5. Rollback & Backup Restore Runbook (Blueprint Ch. 07 & Ch. 27)

1. **Application Rollback (Vercel):** Promote the previous known-good Vercel deployment (1-click instant rollback) and verify `/api/health` + `/en` + `/mr`.
2. **Database Safety:** All migrations in `database/migrations/` are strictly additive and backward-compatible. Never drop or rename live columns in the same release that removes application reads.
3. **Restore Drill Procedure (Required Before Production Launch):**
   - Restore the latest Staging backup into a fresh verification database.
   - Verify row counts on `recruitments`, `articles`, `audit_logs`, and `system_controls`.
   - Confirm RLS policies remain enabled on all 26 tables.
   - Record RPO, RTO, restore date, and operator name in `TASK_TRACKER.md`.
