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
