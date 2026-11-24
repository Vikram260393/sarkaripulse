import fs from "node:fs";
import path from "node:path";
import { describe, expect, it, beforeEach } from "vitest";
import {
  evaluateAdminAccess,
  roleHasPermission,
} from "@/server/auth/rbac";
import {
  checkRateLimit,
  resetRateLimitStore,
} from "@/server/security/rate-limit";
import {
  CorrectionReportInputSchema,
  CreateBookmarkInputSchema,
} from "@/lib/schemas/api";

describe("Server-side 5-role RBAC (Blueprint Ch. 18 & Ch. 23)", () => {
  it("grants super_admin full infrastructure and content permissions", () => {
    expect(roleHasPermission("super_admin", "toggle_kill_switch")).toBe(true);
    expect(roleHasPermission("super_admin", "manage_roles")).toBe(true);
    expect(roleHasPermission("super_admin", "publish_article")).toBe(true);
  });

  it("enforces least privilege for editor, verifier, translator, and analyst", () => {
    expect(roleHasPermission("editor", "publish_article")).toBe(true);
    expect(roleHasPermission("editor", "toggle_kill_switch")).toBe(false);

    expect(roleHasPermission("verifier", "verify_recruitment")).toBe(true);
    expect(roleHasPermission("verifier", "publish_article")).toBe(false);

    expect(roleHasPermission("translator", "edit_translation")).toBe(true);
    expect(roleHasPermission("translator", "verify_recruitment")).toBe(false);

    expect(roleHasPermission("analyst", "view_reports")).toBe(true);
    expect(roleHasPermission("analyst", "edit_article")).toBe(false);
    expect(roleHasPermission("analyst", "toggle_kill_switch")).toBe(false);
  });

  it("rejects anonymous, inactive, and under-privileged admin principals", () => {
    const anon = evaluateAdminAccess(null, "view_reports");
    expect(anon.ok).toBe(false);
    if (!anon.ok) expect(anon.status).toBe(401);

    const inactive = evaluateAdminAccess(
      { userId: "u1", email: "a@example.com", role: "super_admin", isActive: false },
      "view_reports"
    );
    expect(inactive.ok).toBe(false);
    if (!inactive.ok) expect(inactive.status).toBe(403);

    const escalation = evaluateAdminAccess(
      { userId: "u2", email: "t@example.com", role: "translator", isActive: true },
      "toggle_kill_switch"
    );
    expect(escalation.ok).toBe(false);
    if (!escalation.ok) expect(escalation.status).toBe(403);

    const allowed = evaluateAdminAccess(
      { userId: "u3", email: "v@example.com", role: "verifier", isActive: true },
      "verify_recruitment"
    );
    expect(allowed.ok).toBe(true);
  });
});

describe("Rate limiter (Blueprint Ch. 07 & Ch. 32)", () => {
  beforeEach(() => {
    resetRateLimitStore();
  });

  it("allows requests within window and blocks excess with Retry-After", () => {
    const t0 = 1_700_000_000_000;
    expect(checkRateLimit("k1", 2, 10_000, t0).allowed).toBe(true);
    expect(checkRateLimit("k1", 2, 10_000, t0 + 1000).allowed).toBe(true);

    const blocked = checkRateLimit("k1", 2, 10_000, t0 + 2000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(8);

    // Resets cleanly after window expires
    expect(checkRateLimit("k1", 2, 10_000, t0 + 10_001).allowed).toBe(true);
  });
});

describe("API Zod Validation Schemas", () => {
  it("rejects javascript: URLs and short explanations in correction reports", () => {
    const badUrl = CorrectionReportInputSchema.safeParse({
      page_url: "javascript:alert(1)",
      issue_type: "broken_link",
      explanation: "This link appears to be broken on the page.",
    });
    expect(badUrl.success).toBe(false);

    const shortText = CorrectionReportInputSchema.safeParse({
      page_url: "/en/jobs/sample",
      issue_type: "wrong_date",
      explanation: "wrong",
    });
    expect(shortText.success).toBe(false);

    const valid = CorrectionReportInputSchema.safeParse({
      page_url: "/en/jobs/maharashtra-group-b-non-gazetted-sample-preview",
      issue_type: "wrong_date",
      explanation: "Official corrigendum extended closing date to 25 Dec 2026.",
    });
    expect(valid.success).toBe(true);
  });

  it("requires either recruitment_id or saved_search_query for bookmarks", () => {
    expect(CreateBookmarkInputSchema.safeParse({}).success).toBe(false);
    expect(
      CreateBookmarkInputSchema.safeParse({
        saved_search_query: { state: "maharashtra" },
      }).success
    ).toBe(true);
  });
});

describe("Client Bundle Secret Isolation (Blueprint Ch. 07 & Ch. 33)", () => {
  function collectSourceFiles(dir: string): string[] {
    if (!fs.existsSync(dir)) return [];
    const results: string[] = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...collectSourceFiles(full));
      } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
        results.push(full);
      }
    }
    return results;
  }

  it("never references SUPABASE_SERVICE_ROLE_KEY or server/db/supabase-admin in components/ or public pages", () => {
    const clientFacingFiles = [
      ...collectSourceFiles(path.resolve(process.cwd(), "components")),
      ...collectSourceFiles(path.resolve(process.cwd(), "app/[lang]")),
    ];

    expect(clientFacingFiles.length).toBeGreaterThan(0);
    for (const file of clientFacingFiles) {
      const content = fs.readFileSync(file, "utf8");
      expect(content, `Secret reference found in ${file}`).not.toContain(
        "SUPABASE_SERVICE_ROLE_KEY"
      );
      expect(content, `Admin client import found in ${file}`).not.toContain(
        "supabase-admin"
      );
    }
  });
});
