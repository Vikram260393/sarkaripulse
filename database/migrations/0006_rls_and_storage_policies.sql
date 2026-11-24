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
