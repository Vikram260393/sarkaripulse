import { FilterQuery, RecruitmentRecord } from "@/lib/types/recruitment";

/**
 * Filters and searches across structured recruitment facts (Blueprint Ch. 16):
 * title, organisation, department, post names, qualification, state, category,
 * and notification number — never relying solely on body prose.
 */
export function filterRecruitments(
  records: readonly RecruitmentRecord[],
  query: FilterQuery
): RecruitmentRecord[] {
  const normalizedTerm = query.q?.trim().toLowerCase() ?? "";

  return records.filter((record) => {
    if (query.state && query.state !== "all") {
      if (
        record.stateSlug.toLowerCase() !== query.state.toLowerCase() &&
        record.stateCode.toLowerCase() !== query.state.toLowerCase()
      ) {
        return false;
      }
    }

    if (query.category && query.category !== "all") {
      if (record.categorySlug.toLowerCase() !== query.category.toLowerCase()) {
        return false;
      }
    }

    if (query.qualification && query.qualification !== "all") {
      if (
        !record.qualificationSlugs.some(
          (q) => q.toLowerCase() === query.qualification!.toLowerCase()
        )
      ) {
        return false;
      }
    }

    if (query.status && query.status !== "all") {
      if (record.lifecycleStatus !== query.status) {
        return false;
      }
    }

    if (query.employmentType && query.employmentType !== "all") {
      if (record.employmentType !== query.employmentType) {
        return false;
      }
    }

    if (normalizedTerm.length > 0) {
      const searchableChunks: string[] = [
        record.title.en,
        record.title.hi ?? "",
        record.title.mr ?? "",
        record.organisation.en,
        record.organisation.hi ?? "",
        record.organisation.mr ?? "",
        record.officialEnglishOrganisation,
        record.department.en,
        record.stateSlug,
        record.stateCode,
        record.categorySlug,
        record.notificationReference ?? "",
        ...record.qualificationSlugs,
        ...record.posts.flatMap((p) => [
          p.postName.en,
          p.postName.hi ?? "",
          p.postName.mr ?? "",
          p.postCode ?? "",
        ]),
      ];

      const haystack = searchableChunks.join(" ").toLowerCase();
      const tokens = normalizedTerm.split(/\s+/).filter(Boolean);
      const matchesAllTokens = tokens.every((token) => haystack.includes(token));
      if (!matchesAllTokens) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Serializes active filters into clean, shareable URL search params.
 */
export function serializeFilterQuery(query: FilterQuery): string {
  const params = new URLSearchParams();
  if (query.q && query.q.trim()) params.set("q", query.q.trim());
  if (query.state && query.state !== "all") params.set("state", query.state);
  if (query.category && query.category !== "all")
    params.set("category", query.category);
  if (query.qualification && query.qualification !== "all")
    params.set("qualification", query.qualification);
  if (query.status && query.status !== "all") params.set("status", query.status);
  if (query.employmentType && query.employmentType !== "all")
    params.set("employmentType", query.employmentType);
  return params.toString();
}
