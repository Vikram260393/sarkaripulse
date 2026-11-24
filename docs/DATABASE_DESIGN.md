# SarkariPulse — Database Design & Data Governance (`DATABASE_DESIGN.md`)

> **Version:** 1.0 | **Date:** 23 November 2026 | **Source Brief:** `SarkariPulse_Project_Master_Blueprint.pdf` (Ch. 06, 07, 09, 12, Appendix A)

---

## 1. Design Principles

1. **UUID Primary Keys & Audit Timestamps:** Every core table uses `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`, and `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`.
2. **Relational First, JSONB Selectively:** Store commonly filtered, joined, and validated facts (dates, vacancies, states, categories, qualifications, statuses) in typed relational columns. Use `JSONB` only for genuinely variable structures (e.g., category-specific fee matrices, structured raw source payloads, evidence locators).
3. **Strict State Separation:** Never conflate editorial publication state with real-world recruitment status or verification state. A `published` article can accurately describe an `application_closed` or `result_declared` recruitment.
4. **Provenance & Immutability of History:** Distinguish raw extracted data, normalised data, and verified data. Never silently erase historical recruitment facts or past versions when issuing corrections.
5. **Timezone & Calendar Date Integrity:** Store all event timestamps in UTC (`TIMESTAMPTZ`) and render in `Asia/Kolkata`. Store official calendar dates without stated times as `DATE` (`YYYY-MM-DD`) — **never** invent a deadline time such as `23:59`.

---

## 2. Controlled Status Enums / CHECK Constraints (Blueprint Appendix A & Ch. 09)

> All controlled states **must** be enforced with PostgreSQL `ENUM` types or `CHECK` constraints — no arbitrary free-text values.

| Domain | Allowed Values |
| :--- | :--- |
| **`verification_status`** | `pending`, `verified`, `review_required`, `rejected`, `superseded` |
| **`editorial_state`** | `draft`, `queued`, `approved`, `published`, `unpublished`, `archived` |
| **`recruitment_lifecycle`** | `upcoming`, `application_open`, `closing_soon`, `application_closed`, `admit_card_released`, `exam_scheduled`, `answer_key_released`, `result_declared`, `completed`, `correction_required`, `archived` |
| **`source_health`** | `healthy`, `degraded`, `blocked`, `moved`, `retired` |
| **`automation_job_status`** | `queued`, `running`, `succeeded`, `retrying`, `failed`, `dead_lettered`, `cancelled` |
| **`link_status`** | `unchecked`, `valid`, `redirected`, `unavailable`, `suspicious`, `requires_review` |
| **`source_tier`** | `tier_1_official`, `tier_2_official_publication`, `tier_3_discovery_only` |
| **`language_code`** | `en`, `hi`, `mr` |
| **`admin_role`** | `super_admin`, `editor`, `verifier`, `translator`, `analyst` |

---

## 3. Core Entity Schema Specification

### A. Source Registry & Evidence Capture
1. **`sources`**
   - `id`, `name`, `organisation`, `official_domain`, `base_url`, `recruitment_url`, `source_tier`, `source_type` (api/rss/sitemap/html/pdf), `state_code` (nullable for central), `permitted_access_method`, `robots_terms_reviewed_at`, `robots_terms_notes`, `scan_interval_minutes`, `parser_type`, `parser_version`, `trust_policy` (`manual_only` | `auto_eligible`), `health_status` (`source_health`), `owner`, `review_due_date`, `last_success_at`, `last_failure_at`, `reliability_notes`, `is_active`, `created_at`, `updated_at`.
2. **`source_checks`**
   - `id`, `source_id` (FK), `correlation_id`, `http_status`, `etag`, `last_modified_header`, `content_hash_sha256`, `response_time_ms`, `parser_version`, `change_detected` (bool), `status`, `error_code`, `error_message`, `checked_at`.
3. **`source_documents`**
   - `id`, `source_id` (FK), `source_check_id` (FK), `source_url`, `document_reference` (notification number), `mime_type`, `file_signature_verified` (bool), `file_size_bytes`, `content_hash_sha256` (UNIQUE with `source_id`), `storage_bucket`, `storage_path`, `redistribution_permitted` (bool), `is_scanned_ocr` (bool), `ocr_confidence_flag` (`high` | `uncertain` | `unreadable`), `raw_extracted_payload` (JSONB), `extraction_schema_version`, `model_version`, `retrieved_at`, `created_at`.
4. **`organization_aliases`**
   - `id`, `canonical_organisation`, `alias_name`, `abbreviation`, `state_code`, `created_at` (supports duplicate matching per Ch. 12).

### B. Recruitment Core & Structured Facts
5. **`categories`**
   - `id`, `slug` (UNIQUE), `name_en`, `name_hi`, `name_mr`, `description_en`, `description_hi`, `description_mr`, `parent_id` (self-FK), `display_order`, `is_active`, `created_at`, `updated_at`.
6. **`states`**
   - `code` (PK, e.g., `IN` for Central/All-India, `MH` for Maharashtra, ISO/standard state codes), `slug` (UNIQUE), `name_en`, `name_hi`, `name_mr`, `is_priority` (bool, `true` for Maharashtra), `created_at`, `updated_at`.
7. **`recruitments`**
   - `id`, `slug` (UNIQUE), `title`, `organisation`, `department`, `state_code` (FK -> `states`), `category_id` (FK -> `categories`), `cycle_label` (e.g., `2026-27`), `vacancy_total` (INT CHECK `>= 0` or NULL), `employment_type` (`permanent` | `contractual` | `apprenticeship` | `fellowship` | `other`), `lifecycle_status` (`recruitment_lifecycle`), `verification_status` (`verification_status`), `editorial_state` (`editorial_state`), `primary_source_id` (FK -> `sources`), `primary_document_id` (FK -> `source_documents`), `notification_reference`, `official_notification_url`, `official_apply_url`, `age_rules` (JSONB, validated schema), `category_relaxations` (JSONB), `fee_schedule` (JSONB), `pay_details` (JSONB — explicit period & pay level), `selection_stages` (JSONB), `document_requirements` (JSONB), `is_public_safe` (bool DEFAULT false), `first_published_at`, `last_verified_at`, `superseded_by_id` (self-FK), `created_at`, `updated_at`.
   - **Uniqueness / Deduplication Guard:** Partial unique index on `(primary_source_id, lower(notification_reference), cycle_label)` where `notification_reference IS NOT NULL AND verification_status <> 'rejected'`.
8. **`recruitment_posts`**
   - `id`, `recruitment_id` (FK), `post_name`, `post_code`, `vacancy_count` (INT CHECK `>= 0` or NULL), `category_breakdown` (JSONB), `pay_level`, `min_age`, `max_age`, `qualification_summary`, `experience_summary`, `created_at`, `updated_at`.
9. **`recruitment_dates`**
   - `id`, `recruitment_id` (FK), `date_type` (ENUM: `notification`, `application_start`, `application_end`, `fee_payment_deadline`, `correction_window_start`, `correction_window_end`, `admit_card`, `exam_date`, `answer_key`, `objection_deadline`, `result_date`, `document_verification`), `event_date` (DATE, nullable), `event_time_label` (TEXT, nullable — only when source states a time), `source_timezone` (TEXT DEFAULT `'Asia/Kolkata'`), `is_tentative` (bool), `is_extended` (bool), `source_document_id` (FK), `evidence_excerpt`, `created_at`, `updated_at`.
10. **`recruitment_qualifications`**
    - `id`, `recruitment_id` (FK), `qualification_slug` (e.g., `10th-pass`, `12th-pass`, `iti`, `diploma`, `graduate`, `btech`, `postgraduate`), `label_en`, `stream_or_discipline`, `min_percentage`, `details`, `created_at`.
11. **`recruitment_links`**
    - `id`, `recruitment_id` (FK), `link_type` (`official_notification`, `official_apply`, `official_website`, `admit_card`, `result`, `answer_key`, `syllabus`, `corrigendum`), `url`, `destination_domain`, `is_verified_official` (bool DEFAULT false), `link_status` (`link_status`), `http_status`, `last_checked_at`, `created_at`, `updated_at`.

### C. Verification, Editorial, Translations & PDFs
12. **`verification_checks`**
    - `id`, `recruitment_id` (FK), `source_document_id` (FK), `ruleset_version`, `decision` (`verified` | `review_required` | `rejected`), `evidence_map` (JSONB — per-field value, source URL, page/row locator, excerpt, status), `consistency_checks` (JSONB — vacancy sums, date order, domain validation), `conflicts_detected` (JSONB), `duplicate_candidates` (JSONB), `ai_confidence_priority` (NUMERIC — prioritisation only, never proof), `reviewer_id` (FK -> `users`, nullable), `review_reason`, `verified_at`, `created_at`.
13. **`articles`** (Canonical English Master)
    - `id`, `recruitment_id` (FK, nullable for standalone guides), `page_type` (`recruitment` | `event` | `guide`), `language_code` (`en`), `title`, `slug` (UNIQUE per language), `summary`, `body_blocks` (JSONB — structured required sections), `seo_title`, `seo_description`, `canonical_url`, `editorial_state` (`editorial_state`), `version_number` (INT), `prompt_version`, `model_version`, `reviewer_id` (FK -> `users`, nullable), `update_note`, `published_at`, `last_verified_at`, `created_at`, `updated_at`.
14. **`article_translations`** (`hi`, `mr`)
    - `id`, `article_id` (FK -> `articles`), `source_version_number` (INT), `language_code` (`hi` | `mr`), `title`, `slug`, `summary`, `body_blocks` (JSONB), `seo_title`, `seo_description`, `canonical_url`, `editorial_state` (`editorial_state`), `parity_check_passed` (bool DEFAULT false), `parity_report` (JSONB), `translation_model`, `glossary_version`, `reviewer_id` (FK -> `users`, nullable), `published_at`, `created_at`, `updated_at`.
    - UNIQUE `(article_id, language_code)` and UNIQUE `(language_code, slug)`.
15. **`content_versions`**
    - `id`, `entity_type` (`recruitment` | `article` | `article_translation`), `entity_id`, `version_number`, `snapshot_payload` (JSONB), `change_summary`, `supporting_source_url`, `actor_id`, `created_at`.
16. **`pdf_documents`**
    - `id`, `recruitment_id` (FK), `article_id` (FK, nullable), `document_type` (`official_notification` | `recruitment_summary` | `application_checklist` | `eligibility_guide` | `syllabus_guide` | `previous_paper` | `exam_calendar` | `multilingual_quick_guide`), `language_code`, `title`, `filename`, `storage_bucket`, `storage_path`, `checksum_sha256`, `file_size_bytes`, `article_version`, `is_public_approved` (bool DEFAULT false), `is_superseded` (bool DEFAULT false), `superseded_by_id` (self-FK), `source_url`, `generated_at`, `created_at`.

### D. Users, Personalisation, Admin & Operations
17. **`users`** (linked to `auth.users`)
    - `id` (UUID PK referencing `auth.users.id`), `display_name`, `preferred_language` (`en` | `hi` | `mr`), `consent_recorded_at`, `deleted_at`, `created_at`, `updated_at`.
18. **`bookmarks`**
    - `id`, `user_id` (FK -> `users`), `recruitment_id` (FK -> `recruitments`, nullable), `saved_search_query` (JSONB, nullable), `notify_on_update` (bool DEFAULT false), `created_at`.
19. **`notification_preferences`**
    - `id`, `user_id` (FK -> `users`), `channel` (`email` | `web_push`), `states` (TEXT[]), `qualifications` (TEXT[]), `categories` (UUID[]), `frequency` (`daily_digest` | `weekly_digest` | `instant_verified`), `is_subscribed` (bool), `unsubscribe_token`, `consent_timestamp`, `updated_at`.
20. **`admin_roles`**
    - `id`, `user_id` (FK -> `users`, UNIQUE), `role` (`admin_role`), `granted_by` (FK -> `users`), `is_active` (bool DEFAULT true), `created_at`, `updated_at`.
21. **`automation_runs`** (and durable **`automation_jobs`** queue)
    - `id`, `correlation_id`, `job_type`, `priority` (INT), `idempotency_key` (UNIQUE), `status` (`automation_job_status`), `source_id` (nullable), `record_id` (nullable), `payload` (JSONB), `output_ref` (JSONB), `attempts` (INT), `max_attempts` (INT), `next_run_at`, `started_at`, `completed_at`, `duration_ms`, `model_version`, `prompt_version`, `estimated_tokens`, `estimated_cost_usd`, `error_code`, `error_message`, `created_at`, `updated_at`.
22. **`audit_logs`** (append-only)
    - `id`, `actor_id` (nullable for system jobs), `actor_role`, `action`, `entity_type`, `entity_id`, `reason`, `before_summary` (JSONB), `after_summary` (JSONB), `correlation_id`, `created_at`.
23. **`seo_metrics`**
    - `id`, `url_path`, `language_code`, `metric_date` (DATE), `impressions`, `clicks`, `avg_position`, `indexing_status`, `canonical_ok` (bool), `created_at`.
24. **Supporting Operational Tables:**
    - `correction_reports` (unauthenticated user feedback routed to verification queue).
    - `system_controls` (independent kill switches: `pause_source_fetching`, `pause_ai_generation`, `pause_translation`, `pause_pdf_creation`, `pause_publishing`, updated only by `super_admin` with audit log).

---

## 4. Row-Level Security (RLS) Policy Matrix (Blueprint Ch. 07)

| Table Group | Anonymous / Public Role | Authenticated Candidate (`auth.uid()`) | Server-Side Admin / Worker (Service Role) |
| :--- | :--- | :--- | :--- |
| `recruitments`, `recruitment_*`, `articles`, `article_translations`, `pdf_documents` | `SELECT` **only** where `editorial_state = 'published'` AND `is_public_safe = true` (and `is_public_approved = true` for PDFs) | Same as public | Full server-enforced access gated by `admin_roles` |
| `categories`, `states` | `SELECT` where `is_active = true` | Same as public | Server-enforced admin |
| `users`, `bookmarks`, `notification_preferences` | **DENY ALL** | `SELECT`, `INSERT`, `UPDATE`, `DELETE` **only** where `user_id = auth.uid()` | Server-enforced export/delete |
| `correction_reports` | `INSERT` via rate-limited server API only (no direct public `SELECT`) | Same | Verifier/Editor read & triage |
| `sources`, `source_checks`, `source_documents`, `verification_checks`, `content_versions`, `admin_roles`, `automation_runs`, `automation_jobs`, `audit_logs`, `seo_metrics`, `system_controls` | **DENY ALL** | **DENY ALL** | Server-only (checked against `admin_roles`) |

---

## 5. Data Integrity, Retention & Deletion Policy

- **Integrity Checks:** Non-negative vacancy counts (`CHECK (vacancy_total >= 0)`), valid date ordering (`application_start <= application_end` unless `is_extended` / official correction flag is recorded), valid controlled status enums.
- **Retention Schedule (to be finalized with legal review):**
  - Published historical recruitment records: retained with clear `application_closed` / `completed` labels for candidate reference and SEO continuity.
  - Raw HTML snapshots & transient automation logs: rolling retention (e.g., 90–180 days) after evidence excerpts and hashes are preserved.
  - User account data: deleted or anonymised promptly on user request; JSON data export provided.
- **Transparent Corrections:** Corrections create a new `content_versions` snapshot, update `last_verified_at`, display a concise `update_note`, and link the official corrigendum source.
