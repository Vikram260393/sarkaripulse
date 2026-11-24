import { ExtractionOutput } from "@/lib/schemas/extraction";
import { isSafeHttpUrl } from "@/lib/utils/formatters";
import { DuplicateMatch } from "@/agents/duplicate-detector";
import {
  isUrlOnAuthorisedApplyDomain,
  isUrlOnOfficialSourceDomain,
  SourceRegistryEntry,
} from "@/workers/sources/registry";
import { OcrConfidenceFlag } from "@/workers/parsers/document-parser";

export const VERIFICATION_RULESET_VERSION = "verification-ruleset-v1.0.0";

export interface ExistingOfficialFactSnapshot {
  documentReference: string | null;
  retrievedAt: string;
  applicationEnd: string | null;
  vacancyTotal: number | null;
}

export interface PublicationKillSwitches {
  pausePublishing: boolean;
}

export interface VerificationEngineInput {
  extraction: ExtractionOutput;
  source: SourceRegistryEntry;
  originalSourceText: string;
  ocrConfidenceFlag: OcrConfidenceFlag;
  promptInjectionSignals: string[];
  duplicateMatches: DuplicateMatch[];
  priorOfficialSnapshot?: ExistingOfficialFactSnapshot | null;
  killSwitches: PublicationKillSwitches;
}

export interface VerificationConflict {
  field: string;
  priorValue: string | number | null;
  incomingValue: string | number | null;
  resolutionPolicy: "prefer_latest_corrigendum_hold_for_review" | "escalate_conflict";
  note: string;
}

export interface VerificationDecisionReport {
  rulesetVersion: string;
  decision: "verified" | "review_required" | "rejected";
  autoPublishEligible: boolean;
  reasons: string[];
  conflicts: VerificationConflict[];
  checks: {
    sourceTierOfficial: boolean;
    sourceDomainValid: boolean;
    applyLinkValid: boolean;
    datesMatchSourceText: boolean;
    vacanciesConsistent: boolean;
    dateOrderValid: boolean;
    ageRangeValid: boolean;
    ocrReadable: boolean;
    promptInjectionClear: boolean;
    noBlockingDuplicates: boolean;
  };
  /** Advisory priority score only — NEVER overrides missing official evidence */
  reviewQueuePriorityScore: number;
}

/**
 * Checks whether an ISO calendar date (YYYY-MM-DD) appears in the official notice text
 * in common Indian formats (YYYY-MM-DD, DD-MM-YYYY, DD/MM/YYYY, DD.MM.YYYY, or DD Mon YYYY).
 */
export function dateAppearsInOfficialText(
  isoDate: string,
  sourceText: string
): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return false;
  const [, yyyy, mm, dd] = match;
  const dNum = String(Number(dd));
  const mNum = String(Number(mm));

  const monthNames = [
    "jan",
    "feb",
    "mar",
    "apr",
    "may",
    "jun",
    "jul",
    "aug",
    "sep",
    "oct",
    "nov",
    "dec",
  ];
  const monthShort = monthNames[Number(mm) - 1];
  const normalized = sourceText.toLowerCase();

  const variants = [
    `${yyyy}-${mm}-${dd}`,
    `${dd}-${mm}-${yyyy}`,
    `${dd}/${mm}/${yyyy}`,
    `${dd}.${mm}.${yyyy}`,
    `${dNum}/${mNum}/${yyyy}`,
    `${dNum}-${mNum}-${yyyy}`,
  ];
  if (variants.some((v) => normalized.includes(v))) {
    return true;
  }

  // e.g., "18 Dec 2026", "18 December 2026", "18th December, 2026"
  const textualRegex = new RegExp(
    `\\b0?${dNum}(?:st|nd|rd|th)?\\s+${monthShort}[a-z]*[.,]?\\s+${yyyy}\\b`,
    "i"
  );
  return textualRegex.test(sourceText);
}

/**
 * Deterministic Verification Engine & Publication Gate (Blueprint Ch. 11, 12, Appendix C).
 *
 * Critical guarantees:
 * - Competitor / Tier 3 sources CANNOT verify critical facts.
 * - Deliberately altered dates or mismatched vacancy totals are blocked (`review_required`).
 * - Unsafe / lookalike apply URLs are rejected (`rejected`).
 * - Conflicts between two official notices NEVER average values; prefer latest corrigendum,
 *   retain earlier record, and hold for human review (`review_required`).
 * - High AI confidence score can NEVER override missing evidence or failing checks.
 * - Auto-publish is allowed ONLY when decision === "verified", source.trustPolicy === "auto_eligible",
 *   and killSwitches.pausePublishing === false.
 */
export function evaluateVerificationGate(
  input: VerificationEngineInput
): VerificationDecisionReport {
  const reasons: string[] = [];
  const conflicts: VerificationConflict[] = [];
  const { extraction, source, originalSourceText } = input;
  const facts = extraction.facts;

  // 1. Source Tier & Domain Provenance Check
  const sourceTierOfficial =
    source.sourceTier === "tier_1_official" ||
    source.sourceTier === "tier_2_official_publication";
  if (!sourceTierOfficial) {
    reasons.push(
      `Source tier '${source.sourceTier}' cannot independently verify critical recruitment facts.`
    );
  }

  const sourceDomainValid =
    isUrlOnOfficialSourceDomain(extraction.source_url, source) &&
    (!facts.official_notification_url ||
      isUrlOnOfficialSourceDomain(facts.official_notification_url, source));
  if (!sourceDomainValid) {
    reasons.push(
      "Source or official notification URL does not match the allowlisted official authority domain."
    );
  }

  // 2. Application Link Safety & Authority Verification
  let applyLinkValid = true;
  let hasUnsafeApplyLink = false;
  if (facts.official_apply_url) {
    if (!isSafeHttpUrl(facts.official_apply_url)) {
      applyLinkValid = false;
      hasUnsafeApplyLink = true;
      reasons.push("Official apply URL uses an unsafe or malformed scheme.");
    } else if (!isUrlOnAuthorisedApplyDomain(facts.official_apply_url, source)) {
      applyLinkValid = false;
      hasUnsafeApplyLink = true;
      reasons.push(
        "Official apply URL points to an unapproved or suspicious lookalike domain."
      );
    }
  } else {
    applyLinkValid = false;
    reasons.push("Official apply URL is missing; human review required.");
  }

  // 3. Text-to-Fact Evidence Verification (catches altered dates & unsupported vacancy numbers)
  let datesMatchSourceText = true;
  if (facts.application_end) {
    if (!dateAppearsInOfficialText(facts.application_end, originalSourceText)) {
      datesMatchSourceText = false;
      reasons.push(
        `Extracted closing date (${facts.application_end}) was not corroborated in the original official source text.`
      );
    }
  } else {
    datesMatchSourceText = false;
    reasons.push("Application closing date is missing from extracted facts.");
  }

  if (
    facts.application_start &&
    !dateAppearsInOfficialText(facts.application_start, originalSourceText)
  ) {
    datesMatchSourceText = false;
    reasons.push(
      `Extracted application start date (${facts.application_start}) was not corroborated in the original official source text.`
    );
  }

  // 4. Internal Consistency: Post-wise vacancy sum vs vacancy_total
  let vacanciesConsistent = true;
  if (facts.vacancy_total !== null && facts.posts.length > 0) {
    const allPostCountsPresent = facts.posts.every(
      (p) => p.vacancy_count !== null
    );
    if (allPostCountsPresent) {
      const postSum = facts.posts.reduce(
        (sum, p) => sum + (p.vacancy_count ?? 0),
        0
      );
      if (postSum !== facts.vacancy_total) {
        vacanciesConsistent = false;
        reasons.push(
          `Vacancy inconsistency: post-wise sum (${postSum}) does not equal vacancy_total (${facts.vacancy_total}).`
        );
      }
    }
  }

  // Also check vacancy total corroboration in source text when present
  if (facts.vacancy_total !== null && facts.vacancy_total > 0) {
    const rawNum = String(facts.vacancy_total);
    const formattedIn = new Intl.NumberFormat("en-IN").format(facts.vacancy_total);
    const formattedUs = new Intl.NumberFormat("en-US").format(facts.vacancy_total);
    if (
      !originalSourceText.includes(rawNum) &&
      !originalSourceText.includes(formattedIn) &&
      !originalSourceText.includes(formattedUs)
    ) {
      vacanciesConsistent = false;
      reasons.push(
        `Extracted vacancy_total (${facts.vacancy_total}) does not appear in the original official text.`
      );
    }
  }

  // 5. Deadline Order & Age Consistency
  const dateOrderValid =
    !facts.application_start ||
    !facts.application_end ||
    facts.application_start <= facts.application_end ||
    extraction.is_corrigendum;
  if (!dateOrderValid) {
    reasons.push("Application start date exceeds application end date.");
  }

  const ageRangeValid =
    facts.min_age === null ||
    facts.max_age === null ||
    facts.min_age <= facts.max_age;
  if (!ageRangeValid) {
    reasons.push("Minimum age exceeds maximum age.");
  }

  // 6. OCR Readability Check
  const ocrReadable = input.ocrConfidenceFlag === "high";
  if (!ocrReadable) {
    reasons.push(
      `OCR confidence is '${input.ocrConfidenceFlag}'; low-quality scans must be reviewed by a human.`
    );
  }

  // 7. Prompt-Injection Signal Check
  const promptInjectionClear = input.promptInjectionSignals.length === 0;
  if (!promptInjectionClear) {
    reasons.push(
      `Prompt-injection signals detected in source content: ${input.promptInjectionSignals.join(", ")}.`
    );
  }

  // 8. Duplicate Collision Check
  const hasExactDuplicate = input.duplicateMatches.some(
    (m) => m.matchType === "exact_duplicate"
  );
  const hasPossibleDuplicate = input.duplicateMatches.some(
    (m) => m.matchType === "possible_duplicate"
  );
  const noBlockingDuplicates = !hasExactDuplicate && !hasPossibleDuplicate;
  if (hasExactDuplicate) {
    reasons.push("Exact duplicate recruitment already exists for this source, reference, and cycle.");
  } else if (hasPossibleDuplicate) {
    reasons.push("Possible duplicate detected; human review required before publishing.");
  }

  // 9. Conflict Handling vs Prior Official Record (Blueprint Ch. 12 — never average!)
  if (input.priorOfficialSnapshot) {
    if (
      input.priorOfficialSnapshot.applicationEnd &&
      facts.application_end &&
      input.priorOfficialSnapshot.applicationEnd !== facts.application_end
    ) {
      conflicts.push({
        field: "application_end",
        priorValue: input.priorOfficialSnapshot.applicationEnd,
        incomingValue: facts.application_end,
        resolutionPolicy: extraction.is_corrigendum
          ? "prefer_latest_corrigendum_hold_for_review"
          : "escalate_conflict",
        note: extraction.is_corrigendum
          ? "Corrigendum updates closing date; retain earlier record and publish change note after review."
          : "Material closing date conflict between official documents; escalated to review queue.",
      });
      reasons.push("Material conflict on application_end escalated to review queue.");
    }

    if (
      input.priorOfficialSnapshot.vacancyTotal !== null &&
      facts.vacancy_total !== null &&
      input.priorOfficialSnapshot.vacancyTotal !== facts.vacancy_total
    ) {
      conflicts.push({
        field: "vacancy_total",
        priorValue: input.priorOfficialSnapshot.vacancyTotal,
        incomingValue: facts.vacancy_total,
        resolutionPolicy: extraction.is_corrigendum
          ? "prefer_latest_corrigendum_hold_for_review"
          : "escalate_conflict",
        note: extraction.is_corrigendum
          ? "Corrigendum updates vacancy total; retain earlier record and hold for review."
          : "Material vacancy total conflict; escalated to review queue without averaging.",
      });
      reasons.push("Material conflict on vacancy_total escalated to review queue.");
    }
  }

  // 10. Corrigenda with material impact always require human review (Blueprint Ch. 11)
  if (extraction.is_corrigendum && conflicts.length === 0) {
    reasons.push("Official corrigendum notice held for human verification.");
  }

  // Final Decision Logic
  let decision: "verified" | "review_required" | "rejected" = "verified";

  if (
    hasUnsafeApplyLink ||
    hasExactDuplicate ||
    source.sourceTier === "competitor_untrusted" ||
    !sourceDomainValid
  ) {
    decision = "rejected";
  } else if (
    !sourceTierOfficial ||
    !applyLinkValid ||
    !datesMatchSourceText ||
    !vacanciesConsistent ||
    !dateOrderValid ||
    !ageRangeValid ||
    !ocrReadable ||
    !promptInjectionClear ||
    hasPossibleDuplicate ||
    conflicts.length > 0 ||
    extraction.is_corrigendum
  ) {
    decision = "review_required";
  }

  const autoPublishEligible =
    decision === "verified" &&
    source.trustPolicy === "auto_eligible" &&
    source.onboardingStatus === "approved" &&
    !input.killSwitches.pausePublishing;

  // Advisory queue priority (AI confidence orders queues but NEVER overrides evidence)
  const reviewQueuePriorityScore = Number(
    (extraction.ai_confidence_priority ?? 0.5).toFixed(3)
  );

  return {
    rulesetVersion: VERIFICATION_RULESET_VERSION,
    decision,
    autoPublishEligible,
    reasons,
    conflicts,
    checks: {
      sourceTierOfficial,
      sourceDomainValid,
      applyLinkValid,
      datesMatchSourceText,
      vacanciesConsistent,
      dateOrderValid,
      ageRangeValid,
      ocrReadable,
      promptInjectionClear,
      noBlockingDuplicates,
    },
    reviewQueuePriorityScore,
  };
}
