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
