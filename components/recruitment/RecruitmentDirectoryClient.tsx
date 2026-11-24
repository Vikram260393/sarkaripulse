"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Filter, RotateCcw, Search, X } from "lucide-react";
import {
  FilterQuery,
  LanguageCode,
  RecruitmentLifecycleStatus,
  RecruitmentRecord,
} from "@/lib/types/recruitment";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { CATEGORIES, QUALIFICATIONS, STATES } from "@/lib/data/taxonomy";
import { resolveLocalizedText } from "@/lib/utils/formatters";
import { filterRecruitments, serializeFilterQuery } from "@/lib/utils/search";
import { RecruitmentCard } from "@/components/recruitment/RecruitmentCard";

interface RecruitmentDirectoryClientProps {
  lang: LanguageCode;
  records: readonly RecruitmentRecord[];
  initialQuery: FilterQuery;
}

const FILTER_STATUSES: RecruitmentLifecycleStatus[] = [
  "application_open",
  "closing_soon",
  "admit_card_released",
  "result_declared",
  "application_closed",
];

export function RecruitmentDirectoryClient({
  lang,
  records,
  initialQuery,
}: RecruitmentDirectoryClientProps) {
  const dict = getDictionary(lang);
  const router = useRouter();
  const pathname = usePathname();

  const [query, setQuery] = useState<FilterQuery>(initialQuery);

  // Sync combinable filters into shareable query parameters (Blueprint Ch. 16)
  useEffect(() => {
    const serialized = serializeFilterQuery(query);
    const nextUrl = serialized ? `${pathname}?${serialized}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [query, pathname, router]);

  const filtered = useMemo(
    () => filterRecruitments(records, query),
    [records, query]
  );

  const activeChips: { key: keyof FilterQuery; label: string }[] = [];
  if (query.q?.trim()) activeChips.push({ key: "q", label: `"${query.q.trim()}"` });
  if (query.state && query.state !== "all") {
    const st = STATES.find((s) => s.slug === query.state);
    activeChips.push({
      key: "state",
      label: st ? resolveLocalizedText(st.name, lang).value : query.state,
    });
  }
  if (query.category && query.category !== "all") {
    const cat = CATEGORIES.find((c) => c.slug === query.category);
    activeChips.push({
      key: "category",
      label: cat ? resolveLocalizedText(cat.name, lang).value : query.category,
    });
  }
  if (query.qualification && query.qualification !== "all") {
    const qual = QUALIFICATIONS.find((q) => q.slug === query.qualification);
    activeChips.push({
      key: "qualification",
      label: qual ? resolveLocalizedText(qual.name, lang).value : query.qualification,
    });
  }
  if (query.status && query.status !== "all") {
    const statusKey = query.status as RecruitmentLifecycleStatus;
    activeChips.push({
      key: "status",
      label: dict.statusLabels[statusKey] ?? query.status,
    });
  }
  if (query.employmentType && query.employmentType !== "all") {
    const empKey = query.employmentType as keyof typeof dict.employmentTypes;
    activeChips.push({
      key: "employmentType",
      label: dict.employmentTypes[empKey] ?? query.employmentType,
    });
  }

  function updateField(field: keyof FilterQuery, value: string) {
    setQuery((prev) => ({
      ...prev,
      [field]: value === "all" || value === "" ? undefined : value,
    }));
  }

  function resetAll() {
    setQuery({});
  }

  return (
    <div className="space-y-6">
      {/* Search + Combinable Filter Controls */}
      <section
        aria-label={dict.search.filtersHeading}
        className="rounded-xl border border-sp-border bg-white p-4 sm:p-5 shadow-xs"
      >
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-base font-bold text-sp-navy">
            <Filter className="h-4 w-4 text-sp-blue" aria-hidden="true" />
            {dict.search.filtersHeading}
          </h2>
          {activeChips.length > 0 && (
            <button
              type="button"
              onClick={resetAll}
              className="inline-flex items-center gap-1.5 rounded-lg border border-sp-border px-3 py-1 text-xs font-semibold text-sp-navy hover:bg-slate-100 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              {dict.search.resetAll}
            </button>
          )}
        </div>

        {/* Keyword Input */}
        <div className="mb-4">
          <label htmlFor="directory-search-input" className="sr-only">
            {dict.search.label}
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
              aria-hidden="true"
            />
            <input
              id="directory-search-input"
              type="search"
              value={query.q ?? ""}
              onChange={(e) => updateField("q", e.target.value)}
              placeholder={dict.search.placeholder}
              className="w-full rounded-lg border border-sp-border bg-sp-bg py-2.5 pl-9 pr-3 text-sm text-sp-text placeholder:text-slate-500 focus:border-sp-blue focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* Combinable Select Filters */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label
              htmlFor="filter-state"
              className="mb-1 block text-xs font-semibold text-sp-muted"
            >
              {dict.search.stateLabel}
            </label>
            <select
              id="filter-state"
              value={query.state ?? "all"}
              onChange={(e) => updateField("state", e.target.value)}
              className="w-full rounded-lg border border-sp-border bg-white px-2.5 py-2 text-sm text-sp-text"
            >
              <option value="all">{dict.search.allOption}</option>
              {STATES.map((st) => (
                <option key={st.slug} value={st.slug}>
                  {resolveLocalizedText(st.name, lang).value}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="filter-category"
              className="mb-1 block text-xs font-semibold text-sp-muted"
            >
              {dict.search.categoryLabel}
            </label>
            <select
              id="filter-category"
              value={query.category ?? "all"}
              onChange={(e) => updateField("category", e.target.value)}
              className="w-full rounded-lg border border-sp-border bg-white px-2.5 py-2 text-sm text-sp-text"
            >
              <option value="all">{dict.search.allOption}</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.slug} value={cat.slug}>
                  {resolveLocalizedText(cat.name, lang).value}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="filter-qualification"
              className="mb-1 block text-xs font-semibold text-sp-muted"
            >
              {dict.search.qualificationLabel}
            </label>
            <select
              id="filter-qualification"
              value={query.qualification ?? "all"}
              onChange={(e) => updateField("qualification", e.target.value)}
              className="w-full rounded-lg border border-sp-border bg-white px-2.5 py-2 text-sm text-sp-text"
            >
              <option value="all">{dict.search.allOption}</option>
              {QUALIFICATIONS.map((qual) => (
                <option key={qual.slug} value={qual.slug}>
                  {resolveLocalizedText(qual.name, lang).value}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="filter-status"
              className="mb-1 block text-xs font-semibold text-sp-muted"
            >
              {dict.search.statusLabel}
            </label>
            <select
              id="filter-status"
              value={query.status ?? "all"}
              onChange={(e) => updateField("status", e.target.value)}
              className="w-full rounded-lg border border-sp-border bg-white px-2.5 py-2 text-sm text-sp-text"
            >
              <option value="all">{dict.search.allOption}</option>
              {FILTER_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {dict.statusLabels[st]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="filter-employment"
              className="mb-1 block text-xs font-semibold text-sp-muted"
            >
              {dict.search.employmentTypeLabel}
            </label>
            <select
              id="filter-employment"
              value={query.employmentType ?? "all"}
              onChange={(e) => updateField("employmentType", e.target.value)}
              className="w-full rounded-lg border border-sp-border bg-white px-2.5 py-2 text-sm text-sp-text"
            >
              <option value="all">{dict.search.allOption}</option>
              <option value="permanent">{dict.employmentTypes.permanent}</option>
              <option value="contractual">{dict.employmentTypes.contractual}</option>
              <option value="apprenticeship">{dict.employmentTypes.apprenticeship}</option>
              <option value="fellowship">{dict.employmentTypes.fellowship}</option>
            </select>
          </div>
        </div>

        {/* Active Filter Chips */}
        {activeChips.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-sp-border pt-3">
            {activeChips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={() => updateField(chip.key, "")}
                aria-label={`${dict.search.removeFilter}: ${chip.label}`}
                className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-semibold text-sp-navy hover:bg-blue-100 cursor-pointer"
              >
                <span>{chip.label}</span>
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Live Result Count */}
      <p
        role="status"
        aria-live="polite"
        className="text-sm font-semibold text-sp-navy"
      >
        {filtered.length} {dict.search.resultsFound}
      </p>

      {/* Results Grid or Empty State */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filtered.map((record) => (
            <RecruitmentCard key={record.id} record={record} lang={lang} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-sp-border bg-white p-8 text-center">
          <h3 className="text-base font-bold text-sp-navy">
            {dict.search.noResultsTitle}
          </h3>
          <p className="mt-2 text-sm text-sp-muted">
            {dict.search.noResultsHint}
          </p>
          <button
            type="button"
            onClick={resetAll}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-sp-navy px-4 py-2 text-sm font-semibold text-white hover:bg-sp-navy-dark cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            {dict.search.resetAll}
          </button>
        </div>
      )}
    </div>
  );
}
