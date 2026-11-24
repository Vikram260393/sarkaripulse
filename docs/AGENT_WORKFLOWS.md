# SarkariPulse — AI Agent Workflows, Verification & Automation (`AGENT_WORKFLOWS.md`)

> **Version:** 1.0 | **Date:** 23 November 2026 | **Source Brief:** `SarkariPulse_Project_Master_Blueprint.pdf` (Ch. 09–15, 19–20, Appendices B–D)

---

## 1. End-to-End Content & Verification Pipeline

```text
[1. Scheduler] -> creates idempotent `source_scan` job
      │
[2. Fetcher]   -> allowlisted domain, timeout, retry, ETag/Last-Modified, rate limit
      │
[3. Change Detector] -> SHA-256 hash & header diff (skip unchanged)
      │
[4. Parser]    -> HTML headings/tables/links OR PDF text + page/row locators + OCR flag
      │
[5. AI Extractor] -> Gemini server adapter, strict JSON Schema, untrusted-data wrapper
      │
[6. Deterministic Validator] -> schema, date formats, URL domains, sum consistency, duplicate check
      │
[7. Verification Engine (Ruleset vN)]
      ├── ALL MANDATORY CHECKS PASS + TRUSTED SOURCE + KILL SWITCH OFF -> Auto-Queue Writer/Translator/PDF -> Publish
      ├── MISSING / CONFLICT / LOW OCR / CORRECTION / UNTRUSTED SOURCE -> Hold (`review_required`) -> Admin Editorial Queue
      └── SPAM / DUPLICATE / UNSAFE LINK / UNAUTHORISED CLAIM -> Reject / Quarantine
```

---

## 2. Source & Evidence Contract (Blueprint Appendix B)

Every extraction output must conform to strict runtime JSON Schema validation (rejecting malformed or extra untrusted keys):

```json
{
  "source_id": "uuid",
  "source_url": "https://official.example.gov.in/recruitment/notice",
  "retrieved_at": "2026-11-23T15:30:00Z",
  "content_hash": "sha256-hex-digest",
  "document_reference": "official-notification-number-or-null",
  "evidence": [
    {
      "field": "application_end",
      "value": "2027-01-31",
      "document_page": 2,
      "row_context": "Table 1, Row 3",
      "evidence_excerpt": "Closing date as printed in the notice",
      "verification_status": "verified"
    }
  ],
  "parser_version": "source-adapter-v1.0.0",
  "model_version": "gemini-adapter-model-id-or-none"
}
```
- **Missing vs. Zero vs. N/A:** Distinguish `null` (not specified in notification) from `0`, `"not_applicable"`, and `"not_announced"`. Never prompt the LLM to guess absent values.

---

## 3. Verification Engine & Publication Gates (Blueprint Ch. 11)

### 14 Critical Facts Requiring Official Evidence
1. Recruitment title & organisation
2. Notification number
3. Total vacancies
4. Post names & breakdown
5. Educational qualification
6. Age limits
7. Category relaxation
8. Application fees
9. Salary / pay level
10. Application start date
11. Application end date
12. Selection stages
13. Official notification link
14. Official apply link

### Mandatory Verification Rules (Ruleset v1)
- **Domain Provenance:** Source page and official notification URL belong to an allowlisted official domain controlled by the recruiting authority.
- **Apply Link Validation:** Destination URL resolves without suspicious redirects to the recruiting authority or an explicitly authorised exam/application portal (e.g., official NIC/TCS iON/IBPS portal referenced inside the official PDF).
- **Text-to-Fact Cross-Check:** Extracted dates and vacancy counts match the original official notice or latest official corrigendum text.
- **Internal Consistency:** Sum of `recruitment_posts.vacancy_count` equals `vacancy_total` (when full breakdown is given); `application_start <= application_end`; age cut-off date is valid; fee categories and qualifications are coherent.
- **Duplicate Check:** Primary match on `notification_reference` + `primary_source_id`; secondary match on normalised organisation (via `organization_aliases`), post title, `cycle_label`, dates, and vacancies. Text similarity proposes candidates only — never auto-merges distinct annual cycles.
- **AI Confidence Policy:** Model confidence scores may order the admin review queue, **never** serve as proof or override missing official evidence.
- **Quality Audit Sampling:** Regularly audit a sample of auto-published records; if error rate exceeds threshold, auto-disable unattended publishing for the affected source or field.

---

## 4. Conflict Handling & Corrections (Blueprint Ch. 12)

- **Two Official Documents Disagree:** Prefer the latest valid official corrigendum/clarification while retaining the earlier `source_documents` record and publishing a clear change note.
- **Never Average or Crowd-Vote:** Never resolve conflicts by averaging numbers or picking the most frequent aggregator claim.
- **Escalation:** Material conflicts pause affected automatic updates and route to the human `verification_queue`.
- **Correction Flow:** Verify official evidence -> update structured record -> preserve snapshot in `content_versions` -> regenerate affected translations & PDFs -> publish concise update note & updated `last_verified_at` -> log audit event.

---

## 5. Editorial Article & Translation Pipelines (Blueprint Ch. 13–14)

### Required English Master Article Sections (18)
1. Recruitment Overview
2. Important Dates
3. Vacancy Distribution
4. Post Details
5. Educational Qualification
6. Experience Requirements
7. Age Limit
8. Category Age Relaxation
9. Application Fee
10. Salary / Pay Level (label any approximate breakdown clearly with underlying pay level)
11. Selection Process
12. Exam Pattern
13. Required Documents
14. Step-by-Step Application Process
15. Verified Official Links (visibly external, destination domain shown)
16. FAQs (grounded in verified facts only — no fabricated FAQs)
17. Source Citations & Last-Verified Timestamp
18. Update History & Independent Platform Disclaimer

### Translation Pipeline (`en` -> `hi`, `mr`)
- Triggered **only** after English facts are verified.
- Uses versioned controlled glossaries for recruitment terms, qualifications, reservation categories, and exam stages.
- Runs an automated **Critical-Fact Parity Checker** comparing all dates, numerals, vacancy counts, notification numbers, and URLs against the English master before marking eligible for publication.
- Unverified or failed translations fall back gracefully to the verified English master with a clear language notice.

---

## 6. Durable Job Queue, Retries & Kill Switches (Blueprint Ch. 19–20)

### 13 Standard Job Types
`source_scan`, `document_fetch`, `extract_fields`, `verify_recruitment`, `detect_duplicate`, `generate_article`, `translate_article`, `generate_pdf`, `publish_article`, `monitor_link`, `update_lifecycle`, `send_alert`, `create_report`.

### Priority Tiers
1. **P1 (Urgent):** Official corrigenda, critical corrections, imminent closing-date updates, active result/admit-card releases.
2. **P2 (High):** New official notices from Central & Maharashtra Tier 1 sources.
3. **P3 (Normal):** Standard state/sector notices, translations, PDF regeneration, candidate alert digests.
4. **P4 (Maintenance):** Routine link monitoring, lifecycle transitions, daily/weekly/monthly reports.

### Reliability & Idempotency Rules
- Every job carries a unique `idempotency_key` and end-to-end `correlation_id`.
- Per-source concurrency limits and global rate limits protect both government servers and AI quotas.
- **Retries:** Exponential backoff with jitter for transient network/5xx/rate-limit errors.
- **Permanent Errors:** Do not endlessly retry HTTP 404, blocked 403, malformed documents, or invalid credentials — route directly to `dead_lettered` with diagnostics and alert operators.
- **Circuit Breaker:** Automatically pause a source adapter after consecutive harmful failures.
- **Independent Emergency Kill Switches (`system_controls`):**
  1. `pause_source_fetching`
  2. `pause_ai_generation`
  3. `pause_translation`
  4. `pause_pdf_creation`
  5. `pause_publishing`
  *(Pausing any pipeline never takes down the public website.)*

### Scheduled Scans & Event Triggers
- **Staggered Schedules:** Central & Maharashtra priority sources every few hours; lower-priority sources daily; urgent event sources more frequently where permitted.
- **9 Event Triggers:** New notification, corrigendum, deadline change, apply link change, admit card, answer key, exam postponement, result published, official source unavailable. Every event creates an evidence record and a **proposed update** — never directly overwrites published data without validation.
- **Operational Reports:**
  - **Daily:** Sources scanned, new notices, verified records, published articles, held records, failed/DLQ jobs, broken links, approaching deadlines, estimated AI cost.
  - **Weekly:** Source reliability, correction rate, content freshness, top searches/categories, technical defects.
  - **Monthly:** SEO trends, organic engagement, cost per published record, roadmap recommendations.
