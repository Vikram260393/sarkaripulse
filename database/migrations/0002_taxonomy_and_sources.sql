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
