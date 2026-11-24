import crypto from "node:crypto";

export const AUTOMATION_JOB_TYPES = [
  "source_scan",
  "document_fetch",
  "extract_fields",
  "verify_recruitment",
  "detect_duplicate",
  "generate_article",
  "translate_article",
  "generate_pdf",
  "publish_article",
  "monitor_link",
  "update_lifecycle",
  "send_alert",
  "create_report",
] as const;

export type AutomationJobType = (typeof AUTOMATION_JOB_TYPES)[number];

export type AutomationJobStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "retrying"
  | "failed"
  | "dead_lettered"
  | "cancelled";

export interface IndependentKillSwitches {
  pauseSourceFetching: boolean;
  pauseAiGeneration: boolean;
  pauseTranslation: boolean;
  pausePdfCreation: boolean;
  pausePublishing: boolean;
}

export interface DurableJobRecord {
  id: string;
  correlationId: string;
  jobType: AutomationJobType;
  priority: 1 | 2 | 3 | 4;
  idempotencyKey: string;
  status: AutomationJobStatus;
  sourceId?: string | null;
  recordId?: string | null;
  payload: Record<string, unknown>;
  outputRef?: Record<string, unknown> | null;
  attempts: number;
  maxAttempts: number;
  nextRunAtMs: number;
  errorCode?: string | null;
  errorMessage?: string | null;
  createdAtMs: number;
  updatedAtMs: number;
}

export interface JobExecutionOutcome {
  ok: boolean;
  outputRef?: Record<string, unknown>;
  errorCode?: string;
  errorMessage?: string;
  /** Permanent errors (404, 403, malformed source, bad creds) skip retries -> DLQ immediately */
  isPermanent?: boolean;
}

/**
 * Checks whether a specific job type is currently paused by one of the
 * 5 independent emergency kill switches (Blueprint Ch. 11 & Ch. 18).
 */
export function isJobBlockedByKillSwitch(
  jobType: AutomationJobType,
  switches: IndependentKillSwitches
): boolean {
  if (
    switches.pauseSourceFetching &&
    (jobType === "source_scan" || jobType === "document_fetch")
  ) {
    return true;
  }
  if (
    switches.pauseAiGeneration &&
    (jobType === "extract_fields" || jobType === "generate_article")
  ) {
    return true;
  }
  if (switches.pauseTranslation && jobType === "translate_article") {
    return true;
  }
  if (switches.pausePdfCreation && jobType === "generate_pdf") {
    return true;
  }
  if (switches.pausePublishing && jobType === "publish_article") {
    return true;
  }
  return false;
}

/**
 * Exponential backoff with bounded jitter for transient errors (Blueprint Ch. 19).
 */
export function computeExponentialBackoffMs(
  attempt: number,
  baseMs = 1000,
  maxMs = 300_000,
  jitterFactor = 0.25,
  randomValue = Math.random()
): number {
  const exp = Math.min(maxMs, baseMs * Math.pow(2, Math.max(0, attempt - 1)));
  const jitter = exp * jitterFactor * randomValue;
  return Math.round(exp + jitter);
}

/**
 * Per-source circuit breaker (Blueprint Ch. 19 & Ch. 26):
 * Prevents repeated harmful requests against failing government websites.
 */
export class SourceCircuitBreaker {
  private readonly failureCounts = new Map<string, number>();
  private readonly openUntilMs = new Map<string, number>();

  constructor(
    private readonly failureThreshold = 3,
    private readonly cooldownMs = 15 * 60_000
  ) {}

  isOpen(sourceId: string, nowMs = Date.now()): boolean {
    const until = this.openUntilMs.get(sourceId);
    if (!until) return false;
    if (nowMs >= until) {
      this.openUntilMs.delete(sourceId);
      this.failureCounts.set(sourceId, 0);
      return false;
    }
    return true;
  }

  recordSuccess(sourceId: string): void {
    this.failureCounts.set(sourceId, 0);
    this.openUntilMs.delete(sourceId);
  }

  recordFailure(sourceId: string, nowMs = Date.now()): { tripped: boolean } {
    const next = (this.failureCounts.get(sourceId) ?? 0) + 1;
    this.failureCounts.set(sourceId, next);
    if (next >= this.failureThreshold) {
      this.openUntilMs.set(sourceId, nowMs + this.cooldownMs);
      return { tripped: true };
    }
    return { tripped: false };
  }
}

/**
 * In-memory durable queue model mirroring `public.automation_jobs` semantics
 * for deterministic unit/integration testing & worker orchestration.
 */
export class DurableJobQueueEngine {
  private readonly jobs = new Map<string, DurableJobRecord>();
  private readonly byIdempotencyKey = new Map<string, string>();

  enqueue(input: {
    jobType: AutomationJobType;
    idempotencyKey: string;
    priority?: 1 | 2 | 3 | 4;
    correlationId?: string;
    sourceId?: string | null;
    recordId?: string | null;
    payload?: Record<string, unknown>;
    maxAttempts?: number;
    nowMs?: number;
  }): { job: DurableJobRecord; created: boolean } {
    const existingId = this.byIdempotencyKey.get(input.idempotencyKey);
    if (existingId) {
      const existing = this.jobs.get(existingId)!;
      return { job: existing, created: false };
    }

    const nowMs = input.nowMs ?? Date.now();
    const job: DurableJobRecord = {
      id: crypto.randomUUID(),
      correlationId: input.correlationId ?? crypto.randomUUID(),
      jobType: input.jobType,
      priority: input.priority ?? 3,
      idempotencyKey: input.idempotencyKey,
      status: "queued",
      sourceId: input.sourceId ?? null,
      recordId: input.recordId ?? null,
      payload: input.payload ?? {},
      outputRef: null,
      attempts: 0,
      maxAttempts: input.maxAttempts ?? 3,
      nextRunAtMs: nowMs,
      errorCode: null,
      errorMessage: null,
      createdAtMs: nowMs,
      updatedAtMs: nowMs,
    };

    this.jobs.set(job.id, job);
    this.byIdempotencyKey.set(job.idempotencyKey, job.id);
    return { job, created: true };
  }

  claimNext(
    switches: IndependentKillSwitches,
    nowMs = Date.now()
  ): DurableJobRecord | null {
    const eligible = [...this.jobs.values()]
      .filter(
        (j) =>
          (j.status === "queued" || j.status === "retrying") &&
          j.nextRunAtMs <= nowMs &&
          !isJobBlockedByKillSwitch(j.jobType, switches)
      )
      .sort((a, b) => a.priority - b.priority || a.createdAtMs - b.createdAtMs);

    const next = eligible[0];
    if (!next) return null;

    next.status = "running";
    next.attempts += 1;
    next.updatedAtMs = nowMs;
    return next;
  }

  complete(
    jobId: string,
    outcome: JobExecutionOutcome,
    nowMs = Date.now()
  ): DurableJobRecord {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    if (outcome.ok) {
      job.status = "succeeded";
      job.outputRef = outcome.outputRef ?? {};
      job.errorCode = null;
      job.errorMessage = null;
      job.updatedAtMs = nowMs;
      return job;
    }

    job.errorCode = outcome.errorCode ?? "JOB_FAILED";
    job.errorMessage = outcome.errorMessage ?? "Job failed.";
    job.updatedAtMs = nowMs;

    if (outcome.isPermanent || job.attempts >= job.maxAttempts) {
      job.status = "dead_lettered";
    } else {
      job.status = "retrying";
      job.nextRunAtMs =
        nowMs + computeExponentialBackoffMs(job.attempts, 1000, 300_000, 0.25, 0.5);
    }

    return job;
  }

  replayDeadLetter(jobId: string, nowMs = Date.now()): DurableJobRecord {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }
    if (job.status !== "dead_lettered" && job.status !== "failed") {
      throw new Error(`Only dead_lettered or failed jobs can be replayed (current: ${job.status})`);
    }
    job.status = "queued";
    job.attempts = 0;
    job.nextRunAtMs = nowMs;
    job.errorCode = null;
    job.errorMessage = null;
    job.updatedAtMs = nowMs;
    return job;
  }

  getById(jobId: string): DurableJobRecord | undefined {
    return this.jobs.get(jobId);
  }

  listAll(): DurableJobRecord[] {
    return [...this.jobs.values()];
  }
}
