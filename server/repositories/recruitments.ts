import "server-only";
import { MOCK_RECRUITMENTS, getRecruitmentBySlug } from "@/lib/data/mock-recruitments";
import { CATEGORIES, STATES } from "@/lib/data/taxonomy";
import { FilterQuery, LanguageCode, RecruitmentRecord } from "@/lib/types/recruitment";
import {
  extractDestinationDomain,
  resolveLocalizedText,
} from "@/lib/utils/formatters";
import { filterRecruitments } from "@/lib/utils/search";
import { createPublicSupabaseClient } from "@/server/db/supabase-public";

export type DataSourceMode = "database" | "sample_preview";

export interface PublicRecruitmentSummary {
  id: string;
  slug: string;
  language: LanguageCode;
  is_fallback_language: boolean;
  title: string;
  organisation: string;
  official_english_organisation: string;
  state_code: string;
  state_slug: string;
  category_slug: string;
  qualification_slugs: string[];
  vacancy_total: number | null;
  employment_type: string;
  lifecycle_status: string;
  application_start: string | null;
  application_end: string | null;
  notification_reference: string | null;
  last_verified_at: string;
  source_links: {
    link_type: string;
    url: string;
    destination_domain: string | null;
    is_verified_official: boolean;
    is_expired: boolean;
  }[];
}

export interface PaginatedRecruitmentsResult {
  items: PublicRecruitmentSummary[];
  total: number;
  next_cursor: string | null;
  language: LanguageCode;
  data_source: DataSourceMode;
}

function encodeCursor(offset: number): string {
  return Buffer.from(`v1:${offset}`, "utf8").toString("base64url");
}

function decodeCursor(cursor?: string): number {
  if (!cursor) return 0;
  try {
    const raw = Buffer.from(cursor, "base64url").toString("utf8");
    const match = /^v1:(\d+)$/.exec(raw);
    if (!match) return 0;
    const parsed = Number(match[1]);
    return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

function mapRecordToSummary(
  rec: RecruitmentRecord,
  lang: LanguageCode
): PublicRecruitmentSummary {
  const title = resolveLocalizedText(rec.title, lang);
  const org = resolveLocalizedText(rec.organisation, lang);
  return {
    id: rec.id,
    slug: rec.slug,
    language: lang,
    is_fallback_language: !rec.availableLanguages.includes(lang),
    title: title.value,
    organisation: org.value,
    official_english_organisation: rec.officialEnglishOrganisation,
    state_code: rec.stateCode,
    state_slug: rec.stateSlug,
    category_slug: rec.categorySlug,
    qualification_slugs: [...rec.qualificationSlugs],
    vacancy_total: rec.vacancyTotal,
    employment_type: rec.employmentType,
    lifecycle_status: rec.lifecycleStatus,
    application_start: rec.applicationStart,
    application_end: rec.applicationEnd,
    notification_reference: rec.notificationReference,
    last_verified_at: rec.lastVerifiedAt,
    source_links: rec.links.map((l) => ({
      link_type: l.linkType,
      url: l.url,
      destination_domain: extractDestinationDomain(l.url),
      is_verified_official: l.isVerifiedOfficial,
      is_expired: Boolean(l.isExpired),
    })),
  };
}

/**
 * Fetches published, public-safe recruitments.
 * Uses RLS-bound Supabase anon client when configured; otherwise returns
 * clearly tagged `sample_preview` fixtures for local development.
 */
export async function listPublicRecruitments(options: {
  lang: LanguageCode;
  filters: FilterQuery;
  cursor?: string;
  limit: number;
}): Promise<PaginatedRecruitmentsResult> {
  const offset = decodeCursor(options.cursor);
  const supabase = createPublicSupabaseClient();

  if (supabase) {
    let query = supabase
      .from("recruitments")
      .select(
        "id, slug, title, organisation, state_code, cycle_label, vacancy_total, employment_type, lifecycle_status, application_start, application_end, notification_reference, last_verified_at, categories!inner(slug), states!inner(slug), recruitment_qualifications(qualification_slug), recruitment_links(link_type, url, destination_domain, is_verified_official, is_expired)",
        { count: "exact" }
      )
      .eq("editorial_state", "published")
      .eq("is_public_safe", true)
      .order("last_verified_at", { ascending: false, nullsFirst: false })
      .range(offset, offset + options.limit - 1);

    if (options.filters.state && options.filters.state !== "all") {
      query = query.eq("states.slug", options.filters.state);
    }
    if (options.filters.category && options.filters.category !== "all") {
      query = query.eq("categories.slug", options.filters.category);
    }
    if (options.filters.status && options.filters.status !== "all") {
      query = query.eq("lifecycle_status", options.filters.status);
    }
    if (
      options.filters.employmentType &&
      options.filters.employmentType !== "all"
    ) {
      query = query.eq("employment_type", options.filters.employmentType);
    }
    if (options.filters.q && options.filters.q.trim().length > 0) {
      query = query.textSearch("search_vector", options.filters.q.trim(), {
        type: "websearch",
      });
    }

    const { data, count, error } = await query;
    if (!error && data) {
      interface DbRow {
        id: string;
        slug: string;
        title: string;
        organisation: string;
        state_code: string;
        vacancy_total: number | null;
        employment_type: string;
        lifecycle_status: string;
        application_start: string | null;
        application_end: string | null;
        notification_reference: string | null;
        last_verified_at: string | null;
        categories: { slug: string } | { slug: string }[];
        states: { slug: string } | { slug: string }[];
        recruitment_qualifications?: { qualification_slug: string }[];
        recruitment_links?: {
          link_type: string;
          url: string;
          destination_domain: string;
          is_verified_official: boolean;
          is_expired: boolean;
        }[];
      }

      const rows = data as unknown as DbRow[];
      const items: PublicRecruitmentSummary[] = rows.map((row) => {
        const catSlug = Array.isArray(row.categories)
          ? row.categories[0]?.slug ?? ""
          : row.categories?.slug ?? "";
        const stSlug = Array.isArray(row.states)
          ? row.states[0]?.slug ?? ""
          : row.states?.slug ?? "";

        return {
          id: row.id,
          slug: row.slug,
          language: options.lang,
          is_fallback_language: options.lang !== "en",
          title: row.title,
          organisation: row.organisation,
          official_english_organisation: row.organisation,
          state_code: row.state_code,
          state_slug: stSlug,
          category_slug: catSlug,
          qualification_slugs: (row.recruitment_qualifications ?? []).map(
            (q) => q.qualification_slug
          ),
          vacancy_total: row.vacancy_total,
          employment_type: row.employment_type,
          lifecycle_status: row.lifecycle_status,
          application_start: row.application_start,
          application_end: row.application_end,
          notification_reference: row.notification_reference,
          last_verified_at: row.last_verified_at ?? new Date().toISOString(),
          source_links: (row.recruitment_links ?? []).map((l) => ({
            link_type: l.link_type,
            url: l.url,
            destination_domain: l.destination_domain,
            is_verified_official: l.is_verified_official,
            is_expired: l.is_expired,
          })),
        };
      });

      const total = count ?? items.length;
      const nextOffset = offset + items.length;
      return {
        items,
        total,
        next_cursor: nextOffset < total ? encodeCursor(nextOffset) : null,
        language: options.lang,
        data_source: "database",
      };
    }
  }

  // Local fallback when Supabase env vars are not configured (explicitly labelled)
  const publishedOnly = MOCK_RECRUITMENTS.filter(
    (r) => r.editorialState === "published"
  );
  const filtered = filterRecruitments(publishedOnly, options.filters);
  const pageSlice = filtered.slice(offset, offset + options.limit);
  const nextOffset = offset + pageSlice.length;

  return {
    items: pageSlice.map((r) => mapRecordToSummary(r, options.lang)),
    total: filtered.length,
    next_cursor: nextOffset < filtered.length ? encodeCursor(nextOffset) : null,
    language: options.lang,
    data_source: "sample_preview",
  };
}

export async function getPublicRecruitmentDetail(
  slug: string,
  lang: LanguageCode
): Promise<{
  record: RecruitmentRecord | null;
  data_source: DataSourceMode;
}> {
  const supabase = createPublicSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("recruitments")
      .select("id")
      .eq("slug", slug)
      .eq("editorial_state", "published")
      .eq("is_public_safe", true)
      .maybeSingle();

    if (!error && !data) {
      return { record: null, data_source: "database" };
    }
  }

  const fallback = getRecruitmentBySlug(slug);
  if (!fallback || fallback.editorialState !== "published") {
    return { record: null, data_source: "sample_preview" };
  }
  // Ensure lang param is referenced cleanly
  void lang;
  return { record: fallback, data_source: "sample_preview" };
}

export async function listPublicTaxonomy(lang: LanguageCode) {
  return {
    language: lang,
    categories: CATEGORIES.map((c) => ({
      slug: c.slug,
      group: c.group,
      name: resolveLocalizedText(c.name, lang).value,
      description: resolveLocalizedText(c.description, lang).value,
    })),
    states: STATES.map((s) => ({
      code: s.code,
      slug: s.slug,
      is_priority: Boolean(s.isPriority),
      name: resolveLocalizedText(s.name, lang).value,
      description: resolveLocalizedText(s.description, lang).value,
    })),
  };
}
