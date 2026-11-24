import { describe, expect, it, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET as getHealth } from "@/app/api/health/route";
import { GET as getRecruitments } from "@/app/api/public/recruitments/route";
import { GET as getRecruitmentDetail } from "@/app/api/public/recruitments/[slug]/route";
import { GET as getCategories } from "@/app/api/public/categories/route";
import { GET as getSearch } from "@/app/api/public/search/route";
import { POST as postCorrectionReport } from "@/app/api/public/correction-reports/route";
import { GET as getBookmarks } from "@/app/api/account/bookmarks/route";
import { GET as getAdminControls } from "@/app/api/admin/system-controls/route";
import { POST as postAdminScan } from "@/app/api/admin/sources/scan/route";
import { POST as postAdminVerify } from "@/app/api/admin/recruitments/[id]/verify/route";
import { resetRateLimitStore } from "@/server/security/rate-limit";

describe("Phase 3 API Route Integration Tests (Blueprint Ch. 32 & Ch. 33)", () => {
  beforeEach(() => {
    resetRateLimitStore();
  });

  it("GET /api/health returns service status without leaking secrets", async () => {
    const res = await getHealth();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.service).toBe("sarkaripulse");
    expect(JSON.stringify(body)).not.toContain("SERVICE_ROLE");
  });

  it("GET /api/public/recruitments supports filtering and cursor pagination", async () => {
    const req1 = new NextRequest(
      "http://localhost:3000/api/public/recruitments?lang=mr&limit=2"
    );
    const res1 = await getRecruitments(req1);
    expect(res1.status).toBe(200);
    const page1 = await res1.json();
    expect(page1.language).toBe("mr");
    expect(page1.items.length).toBe(2);
    expect(page1.next_cursor).toBeTruthy();

    const req2 = new NextRequest(
      `http://localhost:3000/api/public/recruitments?lang=mr&limit=2&cursor=${page1.next_cursor}`
    );
    const res2 = await getRecruitments(req2);
    expect(res2.status).toBe(200);
    const page2 = await res2.json();
    expect(page2.items.length).toBeGreaterThan(0);
    expect(page2.items[0].id).not.toBe(page1.items[0].id);
  });

  it("GET /api/public/recruitments rejects invalid query parameters with machine-readable error", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/public/recruitments?limit=999&lang=fr"
    );
    const res = await getRecruitments(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("INVALID_REQUEST");
    expect(body.error.correlation_id).toBeTruthy();
  });

  it("GET /api/public/recruitments/[slug] returns record and 404 for unknown slug", async () => {
    const okReq = new NextRequest(
      "http://localhost:3000/api/public/recruitments/maharashtra-group-b-non-gazetted-sample-preview?lang=en"
    );
    const okRes = await getRecruitmentDetail(okReq, {
      params: Promise.resolve({
        slug: "maharashtra-group-b-non-gazetted-sample-preview",
      }),
    });
    expect(okRes.status).toBe(200);
    const okBody = await okRes.json();
    expect(okBody.data.slug).toBe(
      "maharashtra-group-b-non-gazetted-sample-preview"
    );

    const missingReq = new NextRequest(
      "http://localhost:3000/api/public/recruitments/does-not-exist-999"
    );
    const missingRes = await getRecruitmentDetail(missingReq, {
      params: Promise.resolve({ slug: "does-not-exist-999" }),
    });
    expect(missingRes.status).toBe(404);
  });

  it("GET /api/public/categories & /api/public/search return localized structured results", async () => {
    const catRes = await getCategories(
      new NextRequest("http://localhost:3000/api/public/categories?lang=hi")
    );
    expect(catRes.status).toBe(200);
    const catBody = await catRes.json();
    expect(catBody.states.some((s: { code: string; is_priority: boolean }) => s.code === "MH" && s.is_priority)).toBe(true);

    const searchRes = await getSearch(
      new NextRequest("http://localhost:3000/api/public/search?q=MPSC&lang=en")
    );
    expect(searchRes.status).toBe(200);
    const searchBody = await searchRes.json();
    expect(searchBody.items.length).toBe(1);
  });

  it("POST /api/public/correction-reports validates and accepts legitimate user reports", async () => {
    const badReq = new NextRequest(
      "http://localhost:3000/api/public/correction-reports",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          page_url: "javascript:alert(1)",
          issue_type: "broken_link",
          explanation: "Too short",
        }),
      }
    );
    expect((await postCorrectionReport(badReq)).status).toBe(400);

    const goodReq = new NextRequest(
      "http://localhost:3000/api/public/correction-reports",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          page_url: "/en/jobs/maharashtra-group-b-non-gazetted-sample-preview",
          issue_type: "wrong_date",
          explanation: "Official notice extended the closing date by 5 days.",
        }),
      }
    );
    const goodRes = await postCorrectionReport(goodReq);
    expect([201, 202]).toContain(goodRes.status);
  });

  it("blocks anonymous access to candidate bookmarks and admin endpoints (401)", async () => {
    const bmRes = await getBookmarks();
    expect(bmRes.status).toBe(401);
    const bmBody = await bmRes.json();
    expect(bmBody.error.code).toBe("UNAUTHORIZED");

    const adminRes = await getAdminControls();
    expect(adminRes.status).toBe(401);
    const adminBody = await adminRes.json();
    expect(adminBody.error.code).toBe("UNAUTHORIZED");

    const scanRes = await postAdminScan(
      new NextRequest("http://localhost:3000/api/admin/sources/scan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ source_id: "src-mh-mpsc" }),
      })
    );
    expect(scanRes.status).toBe(401);

    const verifyRes = await postAdminVerify(
      new NextRequest(
        "http://localhost:3000/api/admin/recruitments/00000000-0000-0000-0000-000000000001/verify",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ decision: "verified", reason: "test verify" }),
        }
      ),
      {
        params: Promise.resolve({
          id: "00000000-0000-0000-0000-000000000001",
        }),
      }
    );
    expect(verifyRes.status).toBe(401);
  });
});
