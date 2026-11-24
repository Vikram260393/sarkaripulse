import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import {
  AUTOMATION_JOB_TYPES,
  computeExponentialBackoffMs,
  DurableJobQueueEngine,
  IndependentKillSwitches,
  isJobBlockedByKillSwitch,
  SourceCircuitBreaker,
} from "@/workers/queue/job-queue";
import {
  buildDailyOperationalReport,
  buildDeduplicatedAlertDigests,
  buildEventDrivenProposedUpdate,
  selectDueSourcesForScan,
} from "@/workers/automation/scheduler-and-reports";
import {
  computeHmacSha256Hex,
  verifyCronBearerToken,
  verifyWebhookSignature,
} from "@/server/security/webhook-auth";
import { PILOT_SOURCE_REGISTRY } from "@/workers/sources/registry";
import { POST as postWebhook } from "@/app/api/webhooks/source-event/route";
import { POST as postCronRun } from "@/app/api/cron/run/route";
import { POST as postJobRetry } from "@/app/api/admin/jobs/[id]/retry/route";
import { POST as postPauseControls } from "@/app/api/admin/controls/pause/route";

const ALL_ACTIVE: IndependentKillSwitches = {
  pauseSourceFetching: false,
  pauseAiGeneration: false,
  pauseTranslation: false,
  pausePdfCreation: false,
  pausePublishing: false,
};

describe("Durable 13-Type Job Queue, Idempotency, Retries, DLQ & Kill Switches (Blueprint Ch. 19 & Ch. 33)", () => {
  it("supports all 13 Blueprint job types and enforces idempotent enqueue (processed once)", () => {
    expect(AUTOMATION_JOB_TYPES.length).toBe(13);

    const queue = new DurableJobQueueEngine();
    const first = queue.enqueue({
      jobType: "source_scan",
      idempotencyKey: "scan:mpsc:2026-11-23T18",
      priority: 2,
      nowMs: 1_000,
    });
    const duplicate = queue.enqueue({
      jobType: "source_scan",
      idempotencyKey: "scan:mpsc:2026-11-23T18",
      priority: 2,
      nowMs: 1_500,
    });

    expect(first.created).toBe(true);
    expect(duplicate.created).toBe(false);
    expect(duplicate.job.id).toBe(first.job.id);

    const claimed = queue.claimNext(ALL_ACTIVE, 2_000);
    expect(claimed?.id).toBe(first.job.id);
    queue.complete(claimed!.id, { ok: true, outputRef: { notices: 1 } }, 2_500);
    // Queue is now empty — duplicate trigger never caused a second execution
    expect(queue.claimNext(ALL_ACTIVE, 3_000)).toBeNull();
  });

  it("claims P1 urgent jobs before P3/P4 maintenance jobs", () => {
    const queue = new DurableJobQueueEngine();
    queue.enqueue({ jobType: "create_report", idempotencyKey: "r1", priority: 4, nowMs: 100 });
    queue.enqueue({ jobType: "verify_recruitment", idempotencyKey: "v1", priority: 1, nowMs: 200 });

    const claimed = queue.claimNext(ALL_ACTIVE, 300);
    expect(claimed?.jobType).toBe("verify_recruitment");
  });

  it("retries transient failures with exponential backoff and moves permanent failures immediately to DLQ", () => {
    expect(computeExponentialBackoffMs(1, 1000, 60_000, 0, 0)).toBe(1000);
    expect(computeExponentialBackoffMs(3, 1000, 60_000, 0, 0)).toBe(4000);

    const queue = new DurableJobQueueEngine();
    const { job: transient } = queue.enqueue({
      jobType: "document_fetch",
      idempotencyKey: "fetch:1",
      maxAttempts: 2,
      nowMs: 10_000,
    });
    queue.claimNext(ALL_ACTIVE, 10_000);
    const afterFirstFail = queue.complete(
      transient.id,
      { ok: false, errorCode: "HTTP_503", isPermanent: false },
      10_500
    );
    expect(afterFirstFail.status).toBe("retrying");
    expect(afterFirstFail.nextRunAtMs).toBeGreaterThan(10_500);

    // Second attempt exhausts maxAttempts -> dead_lettered
    queue.claimNext(ALL_ACTIVE, afterFirstFail.nextRunAtMs + 10);
    const afterExhaust = queue.complete(
      transient.id,
      { ok: false, errorCode: "HTTP_503", isPermanent: false },
      afterFirstFail.nextRunAtMs + 20
    );
    expect(afterExhaust.status).toBe("dead_lettered");

    // Permanent 404 routes immediately to DLQ on first attempt
    const { job: permanent } = queue.enqueue({
      jobType: "document_fetch",
      idempotencyKey: "fetch:404",
      maxAttempts: 3,
      nowMs: 50_000,
    });
    queue.claimNext(ALL_ACTIVE, 50_000);
    const after404 = queue.complete(
      permanent.id,
      { ok: false, errorCode: "HTTP_404", isPermanent: true },
      50_100
    );
    expect(after404.status).toBe("dead_lettered");
    expect(after404.attempts).toBe(1);

    // Manual DLQ replay restores queued state cleanly
    const replayed = queue.replayDeadLetter(permanent.id, 60_000);
    expect(replayed.status).toBe("queued");
    expect(replayed.attempts).toBe(0);
  });

  it("pauses publishing independently via kill switch without blocking other pipelines", () => {
    const publishPaused: IndependentKillSwitches = {
      ...ALL_ACTIVE,
      pausePublishing: true,
    };
    expect(isJobBlockedByKillSwitch("publish_article", publishPaused)).toBe(true);
    expect(isJobBlockedByKillSwitch("source_scan", publishPaused)).toBe(false);

    const queue = new DurableJobQueueEngine();
    queue.enqueue({ jobType: "publish_article", idempotencyKey: "pub:1", priority: 1, nowMs: 100 });
    queue.enqueue({ jobType: "source_scan", idempotencyKey: "scan:1", priority: 3, nowMs: 200 });

    const claimed = queue.claimNext(publishPaused, 300);
    expect(claimed?.jobType).toBe("source_scan");
  });

  it("trips per-source circuit breaker after consecutive failures and recovers after cooldown", () => {
    const breaker = new SourceCircuitBreaker(3, 60_000);
    expect(breaker.isOpen("src-mh-mpsc", 1_000)).toBe(false);
    breaker.recordFailure("src-mh-mpsc", 1_000);
    breaker.recordFailure("src-mh-mpsc", 2_000);
    const third = breaker.recordFailure("src-mh-mpsc", 3_000);
    expect(third.tripped).toBe(true);
    expect(breaker.isOpen("src-mh-mpsc", 10_000)).toBe(true);
    expect(breaker.isOpen("src-mh-mpsc", 70_000)).toBe(false);
  });
});

describe("Staggered Scheduler, Event Proposals, Operational Reports & Alert Digests (Blueprint Ch. 17 & Ch. 20)", () => {
  it("selects due healthy active sources and halts when pauseSourceFetching is enabled", () => {
    const states = PILOT_SOURCE_REGISTRY.slice(0, 2).map((source, idx) => ({
      source,
      isActive: true,
      healthStatus: idx === 0 ? ("healthy" as const) : ("blocked" as const),
      lastCheckedAtMs: null,
    }));

    const due = selectDueSourcesForScan(states, ALL_ACTIVE, 100_000);
    expect(due.length).toBe(1);
    expect(due[0].id).toBe(PILOT_SOURCE_REGISTRY[0].id);

    const pausedDue = selectDueSourcesForScan(
      states,
      { ...ALL_ACTIVE, pauseSourceFetching: true },
      100_000
    );
    expect(pausedDue).toEqual([]);
  });

  it("never allows event triggers to overwrite published records directly & flags AI budget alerts", () => {
    const proposal = buildEventDrivenProposedUpdate({
      trigger: "corrigendum_detected",
      sourceId: "src-mh-mpsc",
      evidenceUrl: "https://mpsc.gov.in/corrigendum.pdf",
    });
    expect(proposal.directOverwriteAllowed).toBe(false);
    expect(proposal.requiresValidation).toBe(true);
    expect(proposal.recommendedPriority).toBe(1);

    const report = buildDailyOperationalReport({
      reportDate: "2026-11-23",
      sourcesScanned: 7,
      newNoticesDetected: 3,
      verifiedRecords: 2,
      publishedArticles: 2,
      heldRecords: 1,
      failedOrDeadLetterJobs: 0,
      brokenOfficialLinks: 0,
      approachingDeadlinesCount: 2,
      estimatedAiCostUsd: 4.5,
      dailyAiBudgetUsd: 5.0,
    });
    expect(report.aiBudgetAlertTriggered).toBe(true);
    expect(report.aiHardStopTriggered).toBe(false);
  });

  it("deduplicates candidate alert digests and includes official source, unsubscribe link & safety footer", () => {
    const alerts = buildDeduplicatedAlertDigests([
      {
        userId: "u1",
        email: "candidate@example.com",
        unsubscribeToken: "tok-1",
        recruitmentId: "rec-1",
        eventType: "new_verified",
        title: "MPSC Group-B 2026",
        sarkariPulseUrl: "https://sarkaripulse.in/en/jobs/mpsc",
        officialSourceUrl: "https://mpsc.gov.in/",
      },
      {
        userId: "u1",
        email: "candidate@example.com",
        unsubscribeToken: "tok-1",
        recruitmentId: "rec-1",
        eventType: "new_verified",
        title: "MPSC Group-B 2026",
        sarkariPulseUrl: "https://sarkaripulse.in/en/jobs/mpsc",
        officialSourceUrl: "https://mpsc.gov.in/",
      },
    ]);

    expect(alerts.length).toBe(1);
    expect(alerts[0].unsubscribeUrl).toContain("tok-1");
    expect(alerts[0].safetyFooter).toContain("NEVER sends application payment links");
  });
});

describe("Webhook HMAC, Cron Secret & Protected Admin Endpoints (Blueprint Ch. 32)", () => {
  it("verifies HMAC-SHA256 webhook signatures and fails closed when secret is absent", () => {
    const body = JSON.stringify({ trigger: "new_notification" });
    const sig = computeHmacSha256Hex(body, "test-secret-123");
    expect(verifyWebhookSignature(body, `sha256=${sig}`, "test-secret-123")).toBe(true);
    expect(verifyWebhookSignature(body, "sha256=deadbeef", "test-secret-123")).toBe(false);
    expect(verifyWebhookSignature(body, `sha256=${sig}`, undefined)).toBe(false);

    expect(verifyCronBearerToken("Bearer cron-secret-xyz", "cron-secret-xyz")).toBe(true);
    expect(verifyCronBearerToken("Bearer wrong", "cron-secret-xyz")).toBe(false);
    expect(verifyCronBearerToken("Bearer cron-secret-xyz", undefined)).toBe(false);
  });

  it("blocks unauthenticated calls to webhook, cron, job replay, and kill-switch endpoints (401)", async () => {
    const whRes = await postWebhook(
      new NextRequest("http://localhost:3000/api/webhooks/source-event", {
        method: "POST",
        body: JSON.stringify({}),
      })
    );
    expect(whRes.status).toBe(401);

    const cronRes = await postCronRun(
      new NextRequest("http://localhost:3000/api/cron/run", { method: "POST" })
    );
    expect(cronRes.status).toBe(401);

    const retryRes = await postJobRetry(
      new NextRequest(
        "http://localhost:3000/api/admin/jobs/00000000-0000-0000-0000-000000000001/retry",
        {
          method: "POST",
          body: JSON.stringify({ reason: "replay test" }),
        }
      ),
      { params: Promise.resolve({ id: "00000000-0000-0000-0000-000000000001" }) }
    );
    expect(retryRes.status).toBe(401);

    const pauseRes = await postPauseControls(
      new NextRequest("http://localhost:3000/api/admin/controls/pause", {
        method: "POST",
        body: JSON.stringify({ pause_publishing: true, reason: "emergency pause" }),
      })
    );
    expect(pauseRes.status).toBe(401);
  });
});
