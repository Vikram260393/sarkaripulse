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
