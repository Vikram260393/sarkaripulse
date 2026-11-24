import { SourceRegistryEntry } from "@/workers/sources/registry";
import { IndependentKillSwitches } from "@/workers/queue/job-queue";

export const RECRUITMENT_EVENT_TRIGGERS = [
  "new_notification",
  "corrigendum_detected",
  "deadline_changed",
  "apply_link_changed",
  "admit_card_announced",
  "answer_key_announced",
  "exam_postponed",
  "result_published",
  "source_unavailable",
] as const;

export type RecruitmentEventTrigger =
  (typeof RECRUITMENT_EVENT_TRIGGERS)[number];

export interface ScheduledSourceState {
  source: SourceRegistryEntry;
  isActive: boolean;
  healthStatus: "healthy" | "degraded" | "blocked" | "moved" | "retired";
  lastCheckedAtMs: number | null;
}

/**
 * Staggered Source Scan Selector (Blueprint Ch. 20):
 * Respects per-source scan cadence, active status, health, and emergency pause switches.
 */
export function selectDueSourcesForScan(
  entries: readonly ScheduledSourceState[],
  switches: IndependentKillSwitches,
  nowMs = Date.now()
): SourceRegistryEntry[] {
  if (switches.pauseSourceFetching) {
    return [];
  }

  return entries
    .filter((entry) => {
      if (!entry.isActive) return false;
      if (entry.healthStatus === "blocked" || entry.healthStatus === "retired") {
        return false;
      }
      if (entry.lastCheckedAtMs === null) return true;
      const intervalMs = entry.source.scanIntervalMinutes * 60_000;
      return nowMs - entry.lastCheckedAtMs >= intervalMs;
    })
    .map((e) => e.source);
}

export interface ProposedEventUpdate {
  trigger: RecruitmentEventTrigger;
  sourceId: string;
  recruitmentId: string | null;
  evidenceUrl: string;
  directOverwriteAllowed: false;
  requiresValidation: true;
  recommendedPriority: 1 | 2 | 3 | 4;
  createdAt: string;
}

/**
 * Event Trigger Handler (Blueprint Ch. 20):
 * Always produces an evidence-backed proposed update — NEVER directly overwrites
 * a published recruitment record without passing validation!
 */
export function buildEventDrivenProposedUpdate(params: {
  trigger: RecruitmentEventTrigger;
  sourceId: string;
  recruitmentId?: string | null;
  evidenceUrl: string;
}): ProposedEventUpdate {
  const urgentTriggers: readonly RecruitmentEventTrigger[] = [
    "corrigendum_detected",
    "deadline_changed",
    "apply_link_changed",
    "result_published",
    "admit_card_announced",
  ];
  const recommendedPriority: 1 | 2 | 3 | 4 = urgentTriggers.includes(
    params.trigger
  )
    ? 1
    : params.trigger === "new_notification"
    ? 2
    : 3;

  return {
    trigger: params.trigger,
    sourceId: params.sourceId,
    recruitmentId: params.recruitmentId ?? null,
    evidenceUrl: params.evidenceUrl,
    directOverwriteAllowed: false,
    requiresValidation: true,
    recommendedPriority,
    createdAt: new Date().toISOString(),
  };
}

export interface DailyReportMetrics {
  reportDate: string;
  sourcesScanned: number;
  newNoticesDetected: number;
  verifiedRecords: number;
  publishedArticles: number;
  heldRecords: number;
  failedOrDeadLetterJobs: number;
  brokenOfficialLinks: number;
  approachingDeadlinesCount: number;
  estimatedAiCostUsd: number;
  dailyAiBudgetUsd: number;
}

export interface DailyOperationalReport extends DailyReportMetrics {
  cadence: "daily";
  aiBudgetAlertTriggered: boolean;
  aiHardStopTriggered: boolean;
  generatedAtUtc: string;
}

/**
 * Operational Daily Report + AI Budget Guardrail (Blueprint Ch. 20 & Ch. 28).
 */
export function buildDailyOperationalReport(
  metrics: DailyReportMetrics
): DailyOperationalReport {
  const aiBudgetAlertTriggered =
    metrics.dailyAiBudgetUsd > 0 &&
    metrics.estimatedAiCostUsd >= metrics.dailyAiBudgetUsd * 0.8;
  const aiHardStopTriggered =
    metrics.dailyAiBudgetUsd > 0 &&
    metrics.estimatedAiCostUsd >= metrics.dailyAiBudgetUsd;

  return {
    ...metrics,
    cadence: "daily",
    aiBudgetAlertTriggered,
    aiHardStopTriggered,
    generatedAtUtc: new Date().toISOString(),
  };
}

export interface CandidateAlertCandidate {
  userId: string;
  email: string;
  unsubscribeToken: string;
  recruitmentId: string;
  eventType: "new_verified" | "closing_soon" | "admit_card" | "result";
  title: string;
  sarkariPulseUrl: string;
  officialSourceUrl: string;
}

export interface DeduplicatedAlertMessage {
  dedupKey: string;
  userId: string;
  toEmail: string;
  subject: string;
  senderLabel: "SarkariPulse Independent Career Information";
  sarkariPulseUrl: string;
  officialSourceUrl: string;
  unsubscribeUrl: string;
  safetyFooter: string;
}

/**
 * Alert Digest & Deduplication Builder (Blueprint Ch. 17):
 * - Deduplicates repeated updates for the same `(userId, recruitmentId, eventType)`.
 * - Clearly labels SarkariPulse, links official source, provides unsubscribe link,
 *   and never sends payment links or requests OTPs/passwords.
 */
export function buildDeduplicatedAlertDigests(
  candidates: readonly CandidateAlertCandidate[],
  canonicalHost = "sarkaripulse.in"
): DeduplicatedAlertMessage[] {
  const seen = new Set<string>();
  const messages: DeduplicatedAlertMessage[] = [];

  for (const item of candidates) {
    const dedupKey = `${item.userId}:${item.recruitmentId}:${item.eventType}`;
    if (seen.has(dedupKey)) {
      continue;
    }
    seen.add(dedupKey);

    messages.push({
      dedupKey,
      userId: item.userId,
      toEmail: item.email,
      subject: `[SarkariPulse Alert] ${item.title}`,
      senderLabel: "SarkariPulse Independent Career Information",
      sarkariPulseUrl: item.sarkariPulseUrl,
      officialSourceUrl: item.officialSourceUrl,
      unsubscribeUrl: `https://${canonicalHost}/api/account/unsubscribe?token=${encodeURIComponent(item.unsubscribeToken)}`,
      safetyFooter:
        "SarkariPulse is an independent information service and NEVER sends application payment links or asks for OTPs, passwords, or bank credentials. Always verify instructions on the official portal.",
    });
  }

  return messages;
}
