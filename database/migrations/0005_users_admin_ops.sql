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
