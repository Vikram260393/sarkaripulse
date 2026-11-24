# SarkariPulse — Ordered PostgreSQL Migrations

All migrations in this directory are **additive, ordered, and version-controlled** (Blueprint Ch. 06, 07, 27).

## Execution Order

1. `0001_enums_and_extensions.sql` — Extensions (`pgcrypto`, `pg_trgm`), Appendix A controlled status enums, `sp_set_updated_at()` trigger helper.
2. `0002_taxonomy_and_sources.sql` — `states`, `categories`, `sources`, `source_checks`, `source_documents`, `organization_aliases`.
3. `0003_recruitments_core.sql` — `recruitments` (with GIN `search_vector` & deduplication unique index), `recruitment_posts`, `recruitment_dates`, `recruitment_qualifications`, `recruitment_links`.
4. `0004_editorial_verification_pdfs.sql` — `verification_checks`, `articles`, `article_translations`, `content_versions`, `pdf_documents`.
5. `0005_users_admin_ops.sql` — `users` (Privacy-by-Design), `bookmarks`, `notification_preferences`, `admin_roles`, `automation_runs`, `automation_jobs`, append-only `audit_logs`, `seo_metrics`, `correction_reports`, `system_controls` (defaults `pause_publishing = true`).
6. `0006_rls_and_storage_policies.sql` — Enables RLS on all 24 tables, published-only public policies, per-user `auth.uid()` policies, internal-table deny-by-default, and isolated storage buckets (`official-source-docs` private vs `public-guides` public).
7. `0007_seed_taxonomy.sql` — Idempotent seed for `states` (Maharashtra priority), `categories`, and safe `system_controls` row.

## Applying to Supabase Staging

Always create a database recovery point before applying schema migrations, and validate on **Staging** before Production:

```bash
npx supabase link --project-ref <STAGING_PROJECT_REF>
npx supabase db push --include-all
```

Or run files `0001` through `0007` sequentially in the Supabase Staging SQL Editor.
