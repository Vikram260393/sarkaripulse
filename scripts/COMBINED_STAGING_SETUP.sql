-- =============================================================================
-- SarkariPulse Combined Staging Setup (Migrations 0001 through 0007)
-- Paste into Supabase SQL Editor and click RUN once.
-- =============================================================================

-- >>> BEGIN 0001_enums_and_extensions.sql
-- =============================================================================
-- Migration 0001: Extensions, Controlled Status Enums & Trigger Helpers
-- SarkariPulse Database Design (Blueprint Ch. 06, 09 & Appendix A)
-- Additive & idempotent where supported.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Controlled Status Enums (Appendix A — no arbitrary free-text lifecycle states)
DO $$ BEGIN
  CREATE TYPE verification_status_enum AS ENUM (
    'pending',
    'verified',
    'review_required',
    'rejected',
    'superseded'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE editorial_state_enum AS ENUM (
    'draft',
    'queued',
    'approved',
    'published',
    'unpublished',
    'archived'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE recruitment_lifecycle_enum AS ENUM (
    'upcoming',
    'application_open',
    'closing_soon',
    'application_closed',
    'admit_card_released',
    'exam_scheduled',
    'answer_key_released',
    'result_declared',
    'completed',
    'correction_required',
    'archived'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE source_health_enum AS ENUM (
    'healthy',
    'degraded',
    'blocked',
    'moved',
    'retired'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE automation_job_status_enum AS ENUM (
    'queued',
    'running',
    'succeeded',
    'retrying',
    'failed',
    'dead_lettered',
    'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE link_status_enum AS ENUM (
    'unchecked',
    'valid',
    'redirected',
    'unavailable',
    'suspicious',
    'requires_review'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE source_tier_enum AS ENUM (
    'tier_1_official',
    'tier_2_official_publication',
    'tier_3_discovery_only'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE language_code_enum AS ENUM ('en', 'hi', 'mr');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE admin_role_enum AS ENUM (
    'super_admin',
    'editor',
    'verifier',
    'translator',
    'analyst'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE employment_type_enum AS ENUM (
    'permanent',
    'contractual',
    'apprenticeship',
    'fellowship',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE recruitment_date_type_enum AS ENUM (
    'notification',
    'application_start',
    'application_end',
    'fee_payment_deadline',
    'correction_window_start',
    'correction_window_end',
    'admit_card',
    'exam_date',
    'answer_key',
    'objection_deadline',
    'result_date',
    'document_verification'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE recruitment_link_type_enum AS ENUM (
    'official_notification',
    'official_apply',
    'official_website',
    'admit_card',
    'result',
    'answer_key',
    'syllabus',
    'corrigendum'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE pdf_document_type_enum AS ENUM (
    'official_notification',
    'recruitment_summary',
    'application_checklist',
    'eligibility_guide',
    'syllabus_guide',
    'previous_paper',
    'exam_calendar',
    'multilingual_quick_guide'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE notification_channel_enum AS ENUM ('email', 'web_push');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE alert_frequency_enum AS ENUM (
    'daily_digest',
    'weekly_digest',
    'instant_verified'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Shared updated_at maintenance trigger
CREATE OR REPLACE FUNCTION public.sp_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- <<< END 0001_enums_and_extensions.sql

-- >>> BEGIN 0002_taxonomy_and_sources.sql
-- =============================================================================
-- Migration 0002: Taxonomy (States, Categories) & Official Source Registry
-- SarkariPulse Database Design (Blueprint Ch. 06, 08, 12)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.states (
  code TEXT PRIMARY KEY CHECK (char_length(code) BETWEEN 2 AND 6),
  slug TEXT NOT NULL UNIQUE,
  name_en TEXT NOT NULL,
  name_hi TEXT NOT NULL,
  name_mr TEXT NOT NULL,
  description_en TEXT NOT NULL DEFAULT '',
  description_hi TEXT NOT NULL DEFAULT '',
  description_mr TEXT NOT NULL DEFAULT '',
  is_priority BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  group_kind TEXT NOT NULL CHECK (group_kind IN ('scope', 'sector')),
  name_en TEXT NOT NULL,
  name_hi TEXT NOT NULL,
  name_mr TEXT NOT NULL,
  description_en TEXT NOT NULL DEFAULT '',
  description_hi TEXT NOT NULL DEFAULT '',
  description_mr TEXT NOT NULL DEFAULT '',
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  display_order INTEGER NOT NULL DEFAULT 0 CHECK (display_order >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  organisation TEXT NOT NULL,
  official_domain TEXT NOT NULL,
  base_url TEXT NOT NULL CHECK (base_url ~ '^https?://'),
  recruitment_url TEXT NOT NULL CHECK (recruitment_url ~ '^https?://'),
  source_tier source_tier_enum NOT NULL DEFAULT 'tier_1_official',
  source_type TEXT NOT NULL CHECK (source_type IN ('api', 'rss', 'sitemap', 'html', 'pdf')),
  state_code TEXT REFERENCES public.states(code) ON DELETE SET NULL,
  permitted_access_method TEXT NOT NULL,
  robots_terms_reviewed_at TIMESTAMPTZ,
  robots_terms_notes TEXT,
  pdf_redistribution_permitted BOOLEAN NOT NULL DEFAULT false,
  scan_interval_minutes INTEGER NOT NULL DEFAULT 360 CHECK (scan_interval_minutes >= 15),
  parser_type TEXT NOT NULL,
  parser_version TEXT NOT NULL DEFAULT 'v1.0.0',
  trust_policy TEXT NOT NULL DEFAULT 'manual_only' CHECK (trust_policy IN ('manual_only', 'auto_eligible')),
  health_status source_health_enum NOT NULL DEFAULT 'healthy',
  owner TEXT NOT NULL,
  review_due_date DATE,
  last_success_at TIMESTAMPTZ,
  last_failure_at TIMESTAMPTZ,
  reliability_notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (official_domain, recruitment_url)
);

CREATE TABLE IF NOT EXISTS public.source_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES public.sources(id) ON DELETE CASCADE,
  correlation_id UUID NOT NULL DEFAULT gen_random_uuid(),
  http_status INTEGER,
  etag TEXT,
  last_modified_header TEXT,
  content_hash_sha256 TEXT,
  response_time_ms INTEGER CHECK (response_time_ms IS NULL OR response_time_ms >= 0),
  parser_version TEXT NOT NULL,
  change_detected BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL CHECK (status IN ('ok', 'not_modified', 'error', 'blocked', 'timeout')),
  error_code TEXT,
  error_message TEXT,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.source_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES public.sources(id) ON DELETE RESTRICT,
  source_check_id UUID REFERENCES public.source_checks(id) ON DELETE SET NULL,
  source_url TEXT NOT NULL CHECK (source_url ~ '^https?://'),
  document_reference TEXT,
  mime_type TEXT NOT NULL,
  file_signature_verified BOOLEAN NOT NULL DEFAULT false,
  file_size_bytes BIGINT CHECK (file_size_bytes IS NULL OR file_size_bytes >= 0),
  content_hash_sha256 TEXT NOT NULL,
  storage_bucket TEXT,
  storage_path TEXT,
  redistribution_permitted BOOLEAN NOT NULL DEFAULT false,
  is_scanned_ocr BOOLEAN NOT NULL DEFAULT false,
  ocr_confidence_flag TEXT CHECK (ocr_confidence_flag IS NULL OR ocr_confidence_flag IN ('high', 'uncertain', 'unreadable')),
  raw_extracted_payload JSONB,
  extraction_schema_version TEXT,
  model_version TEXT,
  retrieved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source_id, content_hash_sha256)
);

CREATE TABLE IF NOT EXISTS public.organization_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_organisation TEXT NOT NULL,
  alias_name TEXT NOT NULL,
  abbreviation TEXT,
  state_code TEXT REFERENCES public.states(code) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_org_aliases_lower_name
  ON public.organization_aliases (lower(alias_name));

CREATE INDEX IF NOT EXISTS idx_sources_active_health
  ON public.sources (is_active, health_status);

CREATE INDEX IF NOT EXISTS idx_source_checks_source_time
  ON public.source_checks (source_id, checked_at DESC);

CREATE INDEX IF NOT EXISTS idx_source_documents_source_ref
  ON public.source_documents (source_id, document_reference);

DROP TRIGGER IF EXISTS trg_states_updated_at ON public.states;
CREATE TRIGGER trg_states_updated_at
  BEFORE UPDATE ON public.states
  FOR EACH ROW EXECUTE FUNCTION public.sp_set_updated_at();

DROP TRIGGER IF EXISTS trg_categories_updated_at ON public.categories;
CREATE TRIGGER trg_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.sp_set_updated_at();

DROP TRIGGER IF EXISTS trg_sources_updated_at ON public.sources;
CREATE TRIGGER trg_sources_updated_at
  BEFORE UPDATE ON public.sources
  FOR EACH ROW EXECUTE FUNCTION public.sp_set_updated_at();

-- <<< END 0002_taxonomy_and_sources.sql

-- >>> BEGIN 0003_recruitments_core.sql
-- =============================================================================
-- Migration 0003: Recruitments Core, Posts, Dates, Qualifications & Links
-- SarkariPulse Database Design (Blueprint Ch. 06, 09, 12, 16)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.recruitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  organisation TEXT NOT NULL,
  department TEXT NOT NULL DEFAULT '',
  state_code TEXT NOT NULL REFERENCES public.states(code) ON DELETE RESTRICT,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  cycle_label TEXT NOT NULL,
  vacancy_total INTEGER CHECK (vacancy_total IS NULL OR vacancy_total >= 0),
  employment_type employment_type_enum NOT NULL DEFAULT 'permanent',
  lifecycle_status recruitment_lifecycle_enum NOT NULL DEFAULT 'upcoming',
  verification_status verification_status_enum NOT NULL DEFAULT 'pending',
  editorial_state editorial_state_enum NOT NULL DEFAULT 'draft',
  primary_source_id UUID NOT NULL REFERENCES public.sources(id) ON DELETE RESTRICT,
  primary_document_id UUID REFERENCES public.source_documents(id) ON DELETE SET NULL,
  notification_reference TEXT,
  official_notification_url TEXT CHECK (official_notification_url IS NULL OR official_notification_url ~ '^https?://'),
  official_apply_url TEXT CHECK (official_apply_url IS NULL OR official_apply_url ~ '^https?://'),
  application_start DATE,
  application_end DATE,
  is_date_correction_override BOOLEAN NOT NULL DEFAULT false,
  min_age INTEGER CHECK (min_age IS NULL OR min_age >= 0),
  max_age INTEGER CHECK (max_age IS NULL OR max_age >= 0),
  age_cut_off_date DATE,
  age_rules JSONB NOT NULL DEFAULT '{}'::jsonb,
  category_relaxations JSONB NOT NULL DEFAULT '{}'::jsonb,
  fee_schedule JSONB NOT NULL DEFAULT '[]'::jsonb,
  pay_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  selection_stages JSONB NOT NULL DEFAULT '[]'::jsonb,
  document_requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_public_safe BOOLEAN NOT NULL DEFAULT false,
  first_published_at TIMESTAMPTZ,
  last_verified_at TIMESTAMPTZ,
  superseded_by_id UUID REFERENCES public.recruitments(id) ON DELETE SET NULL,
  search_vector TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(organisation, '') || ' ' || coalesce(notification_reference, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(department, '') || ' ' || coalesce(cycle_label, '')), 'B')
  ) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_recruitments_date_order CHECK (
    application_start IS NULL
    OR application_end IS NULL
    OR application_start <= application_end
    OR is_date_correction_override = true
  ),
  CONSTRAINT chk_recruitments_age_order CHECK (
    min_age IS NULL OR max_age IS NULL OR min_age <= max_age
  )
);

-- Deduplication guard on stable official identifiers (Blueprint Ch. 06 & Ch. 12)
CREATE UNIQUE INDEX IF NOT EXISTS idx_recruitments_dedup_official_ref
  ON public.recruitments (primary_source_id, lower(notification_reference), cycle_label)
  WHERE notification_reference IS NOT NULL AND verification_status <> 'rejected';

CREATE INDEX IF NOT EXISTS idx_recruitments_public_listing
  ON public.recruitments (editorial_state, is_public_safe, lifecycle_status, application_end);

CREATE INDEX IF NOT EXISTS idx_recruitments_state_category
  ON public.recruitments (state_code, category_id);

CREATE INDEX IF NOT EXISTS idx_recruitments_search_vector
  ON public.recruitments USING GIN (search_vector);

CREATE TABLE IF NOT EXISTS public.recruitment_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruitment_id UUID NOT NULL REFERENCES public.recruitments(id) ON DELETE CASCADE,
  post_name TEXT NOT NULL,
  post_code TEXT,
  vacancy_count INTEGER CHECK (vacancy_count IS NULL OR vacancy_count >= 0),
  category_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
  pay_level TEXT,
  min_age INTEGER CHECK (min_age IS NULL OR min_age >= 0),
  max_age INTEGER CHECK (max_age IS NULL OR max_age >= 0),
  qualification_summary TEXT,
  experience_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_post_age_order CHECK (
    min_age IS NULL OR max_age IS NULL OR min_age <= max_age
  )
);

CREATE INDEX IF NOT EXISTS idx_recruitment_posts_recruitment
  ON public.recruitment_posts (recruitment_id);

CREATE TABLE IF NOT EXISTS public.recruitment_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruitment_id UUID NOT NULL REFERENCES public.recruitments(id) ON DELETE CASCADE,
  date_type recruitment_date_type_enum NOT NULL,
  event_date DATE,
  event_time_label TEXT,
  source_timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  is_tentative BOOLEAN NOT NULL DEFAULT false,
  is_extended BOOLEAN NOT NULL DEFAULT false,
  source_document_id UUID REFERENCES public.source_documents(id) ON DELETE SET NULL,
  evidence_excerpt TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recruitment_dates_recruitment_type
  ON public.recruitment_dates (recruitment_id, date_type);

CREATE TABLE IF NOT EXISTS public.recruitment_qualifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruitment_id UUID NOT NULL REFERENCES public.recruitments(id) ON DELETE CASCADE,
  qualification_slug TEXT NOT NULL,
  label_en TEXT NOT NULL,
  stream_or_discipline TEXT,
  min_percentage NUMERIC(5, 2) CHECK (min_percentage IS NULL OR (min_percentage >= 0 AND min_percentage <= 100)),
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (recruitment_id, qualification_slug)
);

CREATE INDEX IF NOT EXISTS idx_recruitment_qualifications_slug
  ON public.recruitment_qualifications (qualification_slug);

CREATE TABLE IF NOT EXISTS public.recruitment_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruitment_id UUID NOT NULL REFERENCES public.recruitments(id) ON DELETE CASCADE,
  link_type recruitment_link_type_enum NOT NULL,
  label_en TEXT NOT NULL,
  url TEXT NOT NULL CHECK (url ~ '^https?://'),
  destination_domain TEXT NOT NULL,
  is_verified_official BOOLEAN NOT NULL DEFAULT false,
  is_expired BOOLEAN NOT NULL DEFAULT false,
  link_status link_status_enum NOT NULL DEFAULT 'unchecked',
  http_status INTEGER,
  last_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recruitment_links_recruitment
  ON public.recruitment_links (recruitment_id, link_type);

DROP TRIGGER IF EXISTS trg_recruitments_updated_at ON public.recruitments;
CREATE TRIGGER trg_recruitments_updated_at
  BEFORE UPDATE ON public.recruitments
  FOR EACH ROW EXECUTE FUNCTION public.sp_set_updated_at();

DROP TRIGGER IF EXISTS trg_recruitment_posts_updated_at ON public.recruitment_posts;
CREATE TRIGGER trg_recruitment_posts_updated_at
  BEFORE UPDATE ON public.recruitment_posts
  FOR EACH ROW EXECUTE FUNCTION public.sp_set_updated_at();

DROP TRIGGER IF EXISTS trg_recruitment_dates_updated_at ON public.recruitment_dates;
CREATE TRIGGER trg_recruitment_dates_updated_at
  BEFORE UPDATE ON public.recruitment_dates
  FOR EACH ROW EXECUTE FUNCTION public.sp_set_updated_at();

DROP TRIGGER IF EXISTS trg_recruitment_links_updated_at ON public.recruitment_links;
CREATE TRIGGER trg_recruitment_links_updated_at
  BEFORE UPDATE ON public.recruitment_links
  FOR EACH ROW EXECUTE FUNCTION public.sp_set_updated_at();

-- <<< END 0003_recruitments_core.sql

-- >>> BEGIN 0004_editorial_verification_pdfs.sql
-- =============================================================================
-- Migration 0004: Verification Checks, Articles, Translations, Versions & PDFs
-- SarkariPulse Database Design (Blueprint Ch. 06, 11, 13, 14, 15, 24)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.verification_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruitment_id UUID NOT NULL REFERENCES public.recruitments(id) ON DELETE CASCADE,
  source_document_id UUID REFERENCES public.source_documents(id) ON DELETE SET NULL,
  ruleset_version TEXT NOT NULL,
  decision verification_status_enum NOT NULL,
  evidence_map JSONB NOT NULL DEFAULT '{}'::jsonb,
  consistency_checks JSONB NOT NULL DEFAULT '{}'::jsonb,
  conflicts_detected JSONB NOT NULL DEFAULT '[]'::jsonb,
  duplicate_candidates JSONB NOT NULL DEFAULT '[]'::jsonb,
  ai_confidence_priority NUMERIC(4, 3) CHECK (
    ai_confidence_priority IS NULL OR (ai_confidence_priority >= 0 AND ai_confidence_priority <= 1)
  ),
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  review_reason TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_verification_checks_recruitment
  ON public.verification_checks (recruitment_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruitment_id UUID REFERENCES public.recruitments(id) ON DELETE SET NULL,
  page_type TEXT NOT NULL CHECK (page_type IN ('recruitment', 'event', 'guide')),
  language_code language_code_enum NOT NULL DEFAULT 'en' CHECK (language_code = 'en'),
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  summary TEXT NOT NULL,
  body_blocks JSONB NOT NULL DEFAULT '{}'::jsonb,
  seo_title TEXT NOT NULL,
  seo_description TEXT NOT NULL,
  canonical_url TEXT NOT NULL,
  editorial_state editorial_state_enum NOT NULL DEFAULT 'draft',
  version_number INTEGER NOT NULL DEFAULT 1 CHECK (version_number >= 1),
  prompt_version TEXT,
  model_version TEXT,
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  update_note TEXT,
  published_at TIMESTAMPTZ,
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (language_code, slug)
);

CREATE INDEX IF NOT EXISTS idx_articles_recruitment
  ON public.articles (recruitment_id);

CREATE TABLE IF NOT EXISTS public.article_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  source_version_number INTEGER NOT NULL CHECK (source_version_number >= 1),
  language_code language_code_enum NOT NULL CHECK (language_code IN ('hi', 'mr')),
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  summary TEXT NOT NULL,
  body_blocks JSONB NOT NULL DEFAULT '{}'::jsonb,
  seo_title TEXT NOT NULL,
  seo_description TEXT NOT NULL,
  canonical_url TEXT NOT NULL,
  editorial_state editorial_state_enum NOT NULL DEFAULT 'draft',
  parity_check_passed BOOLEAN NOT NULL DEFAULT false,
  parity_report JSONB NOT NULL DEFAULT '{}'::jsonb,
  translation_model TEXT,
  glossary_version TEXT,
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (article_id, language_code),
  UNIQUE (language_code, slug)
);

CREATE TABLE IF NOT EXISTS public.content_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('recruitment', 'article', 'article_translation')),
  entity_id UUID NOT NULL,
  version_number INTEGER NOT NULL CHECK (version_number >= 1),
  snapshot_payload JSONB NOT NULL,
  change_summary TEXT NOT NULL,
  supporting_source_url TEXT,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (entity_type, entity_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_content_versions_entity
  ON public.content_versions (entity_type, entity_id, version_number DESC);

CREATE TABLE IF NOT EXISTS public.pdf_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruitment_id UUID NOT NULL REFERENCES public.recruitments(id) ON DELETE CASCADE,
  article_id UUID REFERENCES public.articles(id) ON DELETE SET NULL,
  document_type pdf_document_type_enum NOT NULL,
  language_code language_code_enum NOT NULL DEFAULT 'en',
  title TEXT NOT NULL,
  filename TEXT NOT NULL,
  storage_bucket TEXT NOT NULL CHECK (storage_bucket IN ('official-source-docs', 'public-guides')),
  storage_path TEXT NOT NULL,
  checksum_sha256 TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes >= 0),
  article_version INTEGER CHECK (article_version IS NULL OR article_version >= 1),
  is_public_approved BOOLEAN NOT NULL DEFAULT false,
  is_superseded BOOLEAN NOT NULL DEFAULT false,
  superseded_by_id UUID REFERENCES public.pdf_documents(id) ON DELETE SET NULL,
  source_url TEXT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pdf_documents_recruitment
  ON public.pdf_documents (recruitment_id, is_public_approved, is_superseded);

DROP TRIGGER IF EXISTS trg_articles_updated_at ON public.articles;
CREATE TRIGGER trg_articles_updated_at
  BEFORE UPDATE ON public.articles
  FOR EACH ROW EXECUTE FUNCTION public.sp_set_updated_at();

DROP TRIGGER IF EXISTS trg_article_translations_updated_at ON public.article_translations;
CREATE TRIGGER trg_article_translations_updated_at
  BEFORE UPDATE ON public.article_translations
  FOR EACH ROW EXECUTE FUNCTION public.sp_set_updated_at();

-- <<< END 0004_editorial_verification_pdfs.sql

-- >>> BEGIN 0005_users_admin_ops.sql
-- =============================================================================
-- Migration 0005: Users, Bookmarks, Alerts, Admin RBAC, Queues, Audit & Controls
-- SarkariPulse Database Design (Blueprint Ch. 06, 07, 17, 18, 19, 22, 23)
-- Privacy by Design: ZERO Aadhaar, PAN, caste, bank, or OTP columns.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  preferred_language language_code_enum NOT NULL DEFAULT 'en',
  consent_recorded_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  recruitment_id UUID REFERENCES public.recruitments(id) ON DELETE CASCADE,
  saved_search_query JSONB,
  notify_on_update BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_bookmarks_target CHECK (
    recruitment_id IS NOT NULL OR saved_search_query IS NOT NULL
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_bookmarks_user_recruitment
  ON public.bookmarks (user_id, recruitment_id)
  WHERE recruitment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bookmarks_user_created
  ON public.bookmarks (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  channel notification_channel_enum NOT NULL DEFAULT 'email',
  states TEXT[] NOT NULL DEFAULT '{}'::text[],
  qualifications TEXT[] NOT NULL DEFAULT '{}'::text[],
  categories UUID[] NOT NULL DEFAULT '{}'::uuid[],
  frequency alert_frequency_enum NOT NULL DEFAULT 'daily_digest',
  is_subscribed BOOLEAN NOT NULL DEFAULT false,
  unsubscribe_token UUID NOT NULL DEFAULT gen_random_uuid(),
  consent_timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, channel)
);

CREATE TABLE IF NOT EXISTS public.admin_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  role admin_role_enum NOT NULL,
  granted_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.automation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  correlation_id UUID NOT NULL DEFAULT gen_random_uuid(),
  pipeline_name TEXT NOT NULL,
  status automation_job_status_enum NOT NULL DEFAULT 'queued',
  source_id UUID REFERENCES public.sources(id) ON DELETE SET NULL,
  records_processed INTEGER NOT NULL DEFAULT 0 CHECK (records_processed >= 0),
  records_failed INTEGER NOT NULL DEFAULT 0 CHECK (records_failed >= 0),
  estimated_tokens INTEGER NOT NULL DEFAULT 0 CHECK (estimated_tokens >= 0),
  estimated_cost_usd NUMERIC(10, 6) NOT NULL DEFAULT 0 CHECK (estimated_cost_usd >= 0),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.automation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  correlation_id UUID NOT NULL DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL CHECK (
    job_type IN (
      'source_scan',
      'document_fetch',
      'extract_fields',
      'verify_recruitment',
      'detect_duplicate',
      'generate_article',
      'translate_article',
      'generate_pdf',
      'publish_article',
      'monitor_link',
      'update_lifecycle',
      'send_alert',
      'create_report'
    )
  ),
  priority INTEGER NOT NULL DEFAULT 3 CHECK (priority BETWEEN 1 AND 4),
  idempotency_key TEXT NOT NULL UNIQUE,
  status automation_job_status_enum NOT NULL DEFAULT 'queued',
  source_id UUID REFERENCES public.sources(id) ON DELETE SET NULL,
  record_id UUID,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  output_ref JSONB,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  max_attempts INTEGER NOT NULL DEFAULT 3 CHECK (max_attempts >= 1),
  next_run_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER CHECK (duration_ms IS NULL OR duration_ms >= 0),
  model_version TEXT,
  prompt_version TEXT,
  estimated_tokens INTEGER CHECK (estimated_tokens IS NULL OR estimated_tokens >= 0),
  estimated_cost_usd NUMERIC(10, 6) CHECK (estimated_cost_usd IS NULL OR estimated_cost_usd >= 0),
  error_code TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_automation_jobs_claim
  ON public.automation_jobs (status, priority ASC, next_run_at ASC);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  reason TEXT,
  before_summary JSONB,
  after_summary JSONB,
  correlation_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_time
  ON public.audit_logs (entity_type, entity_id, created_at DESC);

-- Append-only guard for audit_logs (Blueprint Ch. 18)
CREATE OR REPLACE FUNCTION public.sp_prevent_audit_log_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs is append-only and cannot be modified or deleted';
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_logs_immutable ON public.audit_logs;
CREATE TRIGGER trg_audit_logs_immutable
  BEFORE UPDATE OR DELETE ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.sp_prevent_audit_log_mutation();

CREATE TABLE IF NOT EXISTS public.seo_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url_path TEXT NOT NULL,
  language_code language_code_enum NOT NULL DEFAULT 'en',
  metric_date DATE NOT NULL,
  impressions INTEGER NOT NULL DEFAULT 0 CHECK (impressions >= 0),
  clicks INTEGER NOT NULL DEFAULT 0 CHECK (clicks >= 0),
  avg_position NUMERIC(6, 2),
  indexing_status TEXT,
  canonical_ok BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (url_path, language_code, metric_date)
);

CREATE TABLE IF NOT EXISTS public.correction_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_url TEXT NOT NULL,
  recruitment_id UUID REFERENCES public.recruitments(id) ON DELETE SET NULL,
  issue_type TEXT NOT NULL CHECK (
    issue_type IN ('wrong_date', 'wrong_vacancy', 'wrong_eligibility', 'broken_link', 'translation_error', 'other')
  ),
  explanation TEXT NOT NULL CHECK (char_length(explanation) BETWEEN 10 AND 2000),
  reporter_contact TEXT,
  triage_status TEXT NOT NULL DEFAULT 'queued' CHECK (
    triage_status IN ('queued', 'in_review', 'confirmed_corrected', 'dismissed')
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Independent emergency pause / kill switches (Blueprint Ch. 11, 18, App. E)
-- Unattended production publishing defaults to PAUSED (true) until release gates pass.
CREATE TABLE IF NOT EXISTS public.system_controls (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  pause_source_fetching BOOLEAN NOT NULL DEFAULT false,
  pause_ai_generation BOOLEAN NOT NULL DEFAULT false,
  pause_translation BOOLEAN NOT NULL DEFAULT false,
  pause_pdf_creation BOOLEAN NOT NULL DEFAULT false,
  pause_publishing BOOLEAN NOT NULL DEFAULT true,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_reason TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_users_updated_at ON public.users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.sp_set_updated_at();

DROP TRIGGER IF EXISTS trg_notification_preferences_updated_at ON public.notification_preferences;
CREATE TRIGGER trg_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.sp_set_updated_at();

DROP TRIGGER IF EXISTS trg_admin_roles_updated_at ON public.admin_roles;
CREATE TRIGGER trg_admin_roles_updated_at
  BEFORE UPDATE ON public.admin_roles
  FOR EACH ROW EXECUTE FUNCTION public.sp_set_updated_at();

DROP TRIGGER IF EXISTS trg_automation_jobs_updated_at ON public.automation_jobs;
CREATE TRIGGER trg_automation_jobs_updated_at
  BEFORE UPDATE ON public.automation_jobs
  FOR EACH ROW EXECUTE FUNCTION public.sp_set_updated_at();

DROP TRIGGER IF EXISTS trg_correction_reports_updated_at ON public.correction_reports;
CREATE TRIGGER trg_correction_reports_updated_at
  BEFORE UPDATE ON public.correction_reports
  FOR EACH ROW EXECUTE FUNCTION public.sp_set_updated_at();

-- <<< END 0005_users_admin_ops.sql

-- >>> BEGIN 0006_rls_and_storage_policies.sql
-- =============================================================================
-- Migration 0006: Row-Level Security (RLS) & Storage Bucket Isolation
-- SarkariPulse Database Security (Blueprint Ch. 07, 15, 17, 23, 24)
--
-- Rules enforced:
--   1. RLS enabled on EVERY table exposed through Supabase APIs.
--   2. Public (anon/authenticated) may read ONLY records explicitly marked
--      published AND is_public_safe = true (and is_public_approved = true for PDFs).
--   3. Users may read/update ONLY their own profile, bookmarks & alert preferences.
--   4. Admin/operational/source tables have ZERO public policies (server-side
--      service_role + server-verified admin_roles only).
-- =============================================================================

-- Enable RLS on ALL 24 application tables
ALTER TABLE public.states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruitment_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruitment_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruitment_qualifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruitment_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.correction_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_controls ENABLE ROW LEVEL SECURITY;

-- 1. Public Taxonomy Read Policies (active items only)
DROP POLICY IF EXISTS "public_read_active_states" ON public.states;
CREATE POLICY "public_read_active_states"
  ON public.states
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "public_read_active_categories" ON public.categories;
CREATE POLICY "public_read_active_categories"
  ON public.categories
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- 2. Public Published Recruitment Read Policies
DROP POLICY IF EXISTS "public_read_published_recruitments" ON public.recruitments;
CREATE POLICY "public_read_published_recruitments"
  ON public.recruitments
  FOR SELECT
  TO anon, authenticated
  USING (editorial_state = 'published' AND is_public_safe = true);

DROP POLICY IF EXISTS "public_read_published_recruitment_posts" ON public.recruitment_posts;
CREATE POLICY "public_read_published_recruitment_posts"
  ON public.recruitment_posts
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.recruitments r
      WHERE r.id = recruitment_posts.recruitment_id
        AND r.editorial_state = 'published'
        AND r.is_public_safe = true
    )
  );

DROP POLICY IF EXISTS "public_read_published_recruitment_dates" ON public.recruitment_dates;
CREATE POLICY "public_read_published_recruitment_dates"
  ON public.recruitment_dates
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.recruitments r
      WHERE r.id = recruitment_dates.recruitment_id
        AND r.editorial_state = 'published'
        AND r.is_public_safe = true
    )
  );

DROP POLICY IF EXISTS "public_read_published_recruitment_qualifications" ON public.recruitment_qualifications;
CREATE POLICY "public_read_published_recruitment_qualifications"
  ON public.recruitment_qualifications
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.recruitments r
      WHERE r.id = recruitment_qualifications.recruitment_id
        AND r.editorial_state = 'published'
        AND r.is_public_safe = true
    )
  );

DROP POLICY IF EXISTS "public_read_published_recruitment_links" ON public.recruitment_links;
CREATE POLICY "public_read_published_recruitment_links"
  ON public.recruitment_links
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.recruitments r
      WHERE r.id = recruitment_links.recruitment_id
        AND r.editorial_state = 'published'
        AND r.is_public_safe = true
    )
  );

-- 3. Public Published Articles, Translations & Approved Public Guides
DROP POLICY IF EXISTS "public_read_published_articles" ON public.articles;
CREATE POLICY "public_read_published_articles"
  ON public.articles
  FOR SELECT
  TO anon, authenticated
  USING (editorial_state = 'published');

DROP POLICY IF EXISTS "public_read_published_article_translations" ON public.article_translations;
CREATE POLICY "public_read_published_article_translations"
  ON public.article_translations
  FOR SELECT
  TO anon, authenticated
  USING (editorial_state = 'published' AND parity_check_passed = true);

DROP POLICY IF EXISTS "public_read_approved_public_pdfs" ON public.pdf_documents;
CREATE POLICY "public_read_approved_public_pdfs"
  ON public.pdf_documents
  FOR SELECT
  TO anon, authenticated
  USING (
    is_public_approved = true
    AND is_superseded = false
    AND storage_bucket = 'public-guides'
  );

-- 4. Per-User Strict Isolation (User A cannot read or mutate User B's rows)
DROP POLICY IF EXISTS "users_read_own_profile" ON public.users;
CREATE POLICY "users_read_own_profile"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS "users_insert_own_profile" ON public.users;
CREATE POLICY "users_insert_own_profile"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "users_update_own_profile" ON public.users;
CREATE POLICY "users_update_own_profile"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "users_manage_own_bookmarks" ON public.bookmarks;
CREATE POLICY "users_manage_own_bookmarks"
  ON public.bookmarks
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "users_manage_own_notification_preferences" ON public.notification_preferences;
CREATE POLICY "users_manage_own_notification_preferences"
  ON public.notification_preferences
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 5. Internal / Admin Tables — DENY ALL to anon & authenticated by default
-- (No SELECT/INSERT/UPDATE/DELETE policies are created on: sources, source_checks,
--  source_documents, organization_aliases, verification_checks, content_versions,
--  admin_roles, automation_runs, automation_jobs, audit_logs, seo_metrics,
--  correction_reports, system_controls. Access is strictly server-side after
--  RBAC verification against admin_roles.)

-- 6. Storage Bucket Separation (Blueprint Ch. 15 & Ch. 24)
--    - 'official-source-docs': private/controlled bucket for original source notices
--    - 'public-guides': public read-only bucket for approved SarkariPulse guides
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('official-source-docs', 'official-source-docs', false, 26214400, ARRAY['application/pdf', 'text/html']),
  ('public-guides', 'public-guides', true, 15728640, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "public_read_approved_guides_storage" ON storage.objects;
CREATE POLICY "public_read_approved_guides_storage"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'public-guides');

-- <<< END 0006_rls_and_storage_policies.sql

-- >>> BEGIN 0007_seed_taxonomy.sql
-- =============================================================================
-- Migration 0007: Idempotent Taxonomy Seed & Safe System Controls Default
-- SarkariPulse (Blueprint Ch. 02, 06, Appendix E)
-- Note: Sources are NOT seeded as active/verified here (Phase 4 onboarding gate).
-- =============================================================================

INSERT INTO public.states (code, slug, name_en, name_hi, name_mr, is_priority, is_active)
VALUES
  ('MH', 'maharashtra', 'Maharashtra', 'महाराष्ट्र', 'महाराष्ट्र', true, true),
  ('IN', 'all-india', 'All India (Central)', 'अखिल भारतीय (केंद्र)', 'अखिल भारतीय (केंद्र)', false, true),
  ('DL', 'delhi', 'Delhi', 'दिल्ली', 'दिल्ली', false, true),
  ('UP', 'uttar-pradesh', 'Uttar Pradesh', 'उत्तर प्रदेश', 'उत्तर प्रदेश', false, true),
  ('GJ', 'gujarat', 'Gujarat', 'गुजरात', 'गुजरात', false, true),
  ('KA', 'karnataka', 'Karnataka', 'कर्नाटक', 'कर्नाटक', false, true)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.categories (slug, group_kind, name_en, name_hi, name_mr, display_order, is_active)
VALUES
  ('central-government', 'scope', 'Central Government', 'केंद्र सरकार', 'केंद्र सरकार', 1, true),
  ('state-jobs', 'scope', 'State Jobs', 'राज्य नौकरियां', 'राज्य नोकऱ्या', 2, true),
  ('railway', 'sector', 'Railway', 'रेलवे', 'रेल्वे', 3, true),
  ('banking', 'sector', 'Banking', 'बैंकिंग', 'बँकिंग', 4, true),
  ('defence', 'sector', 'Defence', 'रक्षा', 'संरक्षण', 5, true),
  ('police', 'sector', 'Police', 'पुलिस', 'पोलीस', 6, true),
  ('psu', 'sector', 'PSU', 'पीएसयू', 'पीएसयू', 7, true),
  ('teaching', 'sector', 'Teaching', 'शिक्षण', 'शिक्षण', 8, true),
  ('engineering', 'sector', 'Engineering', 'इंजीनियरिंग', 'अभियांत्रिकी', 9, true)
ON CONFLICT (slug) DO NOTHING;

-- Safe production default: unattended publishing PAUSED until Release Gates pass
INSERT INTO public.system_controls (
  id,
  pause_source_fetching,
  pause_ai_generation,
  pause_translation,
  pause_pdf_creation,
  pause_publishing,
  updated_reason
)
VALUES (
  1,
  false,
  false,
  false,
  false,
  true,
  'Initial safe default: unattended publishing disabled until Appendix E Release Gates and pilot audit pass.'
)
ON CONFLICT (id) DO NOTHING;

-- <<< END 0007_seed_taxonomy.sql
