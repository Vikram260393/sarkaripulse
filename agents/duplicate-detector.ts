export interface DuplicateCheckCandidate {
  id?: string;
  sourceId: string;
  notificationReference: string | null;
  organisation: string;
  title: string;
  cycleLabel: string;
  applicationEnd: string | null;
  vacancyTotal: number | null;
}

export interface DuplicateMatch {
  existingId: string;
  matchType: "exact_duplicate" | "possible_duplicate" | "distinct_cycle";
  reason: string;
  similarityScore: number;
}

/**
 * Controlled alias map for Indian government organisations & abbreviations (Blueprint Ch. 12).
 */
export const ORGANIZATION_ALIASES: Readonly<Record<string, string>> = {
  mpsc: "maharashtra public service commission",
  "maharashtra public service commission (mpsc)": "maharashtra public service commission",
  ssc: "staff selection commission",
  "staff selection commission (ssc)": "staff selection commission",
  upsc: "union public service commission",
  "union public service commission (upsc)": "union public service commission",
  mahavitran: "maharashtra state electricity distribution co ltd",
  mahavitaran: "maharashtra state electricity distribution co ltd",
  msedcl: "maharashtra state electricity distribution co ltd",
  "maharashtra state electricity distribution co. ltd. (msedcl)":
    "maharashtra state electricity distribution co ltd",
  mahatransco: "maharashtra state electricity transmission co ltd",
  msetcl: "maharashtra state electricity transmission co ltd",
  ibps: "institute of banking personnel selection",
  rrb: "railway recruitment board",
  "railway recruitment boards (rrbs)": "railway recruitment board",
};

export function normalizeOrganisationName(raw: string): string {
  const cleaned = raw
    .toLowerCase()
    .replace(/[.,()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (ORGANIZATION_ALIASES[raw.toLowerCase().trim()]) {
    return ORGANIZATION_ALIASES[raw.toLowerCase().trim()];
  }
  if (ORGANIZATION_ALIASES[cleaned]) {
    return ORGANIZATION_ALIASES[cleaned];
  }
  return cleaned;
}

function normalizeReference(ref: string | null): string | null {
  if (!ref) return null;
  const cleaned = ref.toLowerCase().replace(/[\s/_-]+/g, "").trim();
  return cleaned.length > 0 ? cleaned : null;
}

function normalizeCycleYear(cycle: string): string {
  const match = /\b(20\d{2})\b/.exec(cycle);
  return match ? match[1] : cycle.trim().toLowerCase();
}

function tokenJaccardSimilarity(a: string, b: string): number {
  const setA = new Set(
    a
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 2)
  );
  const setB = new Set(
    b
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 2)
  );
  if (setA.size === 0 || setB.size === 0) return 0;

  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection += 1;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Duplicate Detector (Blueprint Ch. 12):
 * - Primary: notification number + official source reference + cycle
 * - Secondary: normalized organisation (via alias table), title similarity, dates, vacancies
 * - CRITICAL RULE: NEVER auto-merges distinct recruitment cycles (e.g. 2025 vs 2026).
 */
export function detectDuplicates(
  incoming: DuplicateCheckCandidate,
  existingRecords: readonly (DuplicateCheckCandidate & { id: string })[]
): DuplicateMatch[] {
  const matches: DuplicateMatch[] = [];
  const inRef = normalizeReference(incoming.notificationReference);
  const inOrg = normalizeOrganisationName(incoming.organisation);
  const inCycleYear = normalizeCycleYear(incoming.cycleLabel);

  for (const existing of existingRecords) {
    const exRef = normalizeReference(existing.notificationReference);
    const exOrg = normalizeOrganisationName(existing.organisation);
    const exCycleYear = normalizeCycleYear(existing.cycleLabel);
    const titleSim = tokenJaccardSimilarity(incoming.title, existing.title);

    // 1. Exact primary identifier match (same source + notification ref + same cycle)
    if (
      inRef &&
      exRef &&
      inRef === exRef &&
      incoming.sourceId === existing.sourceId &&
      inCycleYear === exCycleYear
    ) {
      matches.push({
        existingId: existing.id,
        matchType: "exact_duplicate",
        reason: "Matched primary source, notification reference, and recruitment cycle.",
        similarityScore: 1,
      });
      continue;
    }

    // 2. Distinct recruitment cycles must NEVER be auto-merged even with high title similarity
    if (inOrg === exOrg && inCycleYear !== exCycleYear && titleSim >= 0.55) {
      matches.push({
        existingId: existing.id,
        matchType: "distinct_cycle",
        reason: `Same organisation (${inOrg}) across distinct cycles (${exCycleYear} vs ${inCycleYear}); do not merge.`,
        similarityScore: Number(titleSim.toFixed(3)),
      });
      continue;
    }

    // 3. Secondary signal match within the same cycle -> propose possible duplicate for review
    const sameDeadline =
      Boolean(incoming.applicationEnd) &&
      incoming.applicationEnd === existing.applicationEnd;
    const sameVacancy =
      incoming.vacancyTotal !== null &&
      incoming.vacancyTotal === existing.vacancyTotal;

    if (
      inOrg === exOrg &&
      inCycleYear === exCycleYear &&
      (titleSim >= 0.65 || (titleSim >= 0.4 && (sameDeadline || sameVacancy)))
    ) {
      matches.push({
        existingId: existing.id,
        matchType: "possible_duplicate",
        reason:
          "Matched normalised organisation, cycle, and secondary title/date/vacancy signals; human review required.",
        similarityScore: Number(titleSim.toFixed(3)),
      });
    }
  }

  return matches;
}
