import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import nextConfig from "@/next.config";
import { GET as getSitemapEn } from "@/app/sitemap-en.xml/route";
import { GET as getSitemapHi } from "@/app/sitemap-hi.xml/route";
import { GET as getSitemapMr } from "@/app/sitemap-mr.xml/route";
import robots from "@/app/robots";
import { GET as getPreferences } from "@/app/api/account/preferences/route";
import { DELETE as deleteAccount } from "@/app/api/account/delete/route";

describe("Phase 8 Security Hardening, CI & Sitemap Routes (Blueprint Ch. 23, 25, 27)", () => {
  it("configures mandatory HTTP security headers and disables X-Powered-By", async () => {
    expect(nextConfig.poweredByHeader).toBe(false);
    expect(typeof nextConfig.headers).toBe("function");

    const headerRules = await nextConfig.headers!();
    const globalRule = headerRules.find((r) => r.source === "/(.*)");
    expect(globalRule).toBeDefined();

    const headerNames = new Set(globalRule!.headers.map((h) => h.key));
    expect(headerNames.has("X-Content-Type-Options")).toBe(true);
    expect(headerNames.has("X-Frame-Options")).toBe(true);
    expect(headerNames.has("Referrer-Policy")).toBe(true);
    expect(headerNames.has("Permissions-Policy")).toBe(true);
    expect(headerNames.has("Strict-Transport-Security")).toBe(true);
    expect(headerNames.has("Content-Security-Policy")).toBe(true);
  });

  it("serves valid XML for /sitemap-en.xml, /sitemap-hi.xml, /sitemap-mr.xml and clean robots.txt", async () => {
    for (const handler of [getSitemapEn, getSitemapHi, getSitemapMr]) {
      const res = handler();
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("application/xml");
      const xml = await res.text();
      expect(xml).toContain("<urlset");
      expect(xml).toContain("</urlset>");
    }

    const r = robots();
    expect(Array.isArray(r.sitemap)).toBe(true);
    expect((r.sitemap as string[]).some((u) => u.endsWith("/sitemap-mr.xml"))).toBe(true);
  });

  it("includes GitHub Actions CI workflow running lint, typecheck, tests, security scan & build", () => {
    const ciPath = path.resolve(process.cwd(), ".github/workflows/ci.yml");
    expect(fs.existsSync(ciPath)).toBe(true);
    const ciYaml = fs.readFileSync(ciPath, "utf8");
    expect(ciYaml).toContain("npm run typecheck");
    expect(ciYaml).toContain("npm run lint");
    expect(ciYaml).toContain("npm test");
    expect(ciYaml).toContain("npm run security:scan");
    expect(ciYaml).toContain("npm run build");
    expect(ciYaml).toContain("npm run verify:gates");
  });

  it("ships Supabase Edge Function dispatcher, Operations Runbook, Vercel config & Ch. 03 Research deliverables", async () => {
    expect(
      fs.existsSync(
        path.resolve(process.cwd(), "supabase/functions/scheduled-pipeline/index.ts")
      )
    ).toBe(true);
    expect(
      fs.existsSync(path.resolve(process.cwd(), "docs/OPERATIONS_RUNBOOK.md"))
    ).toBe(true);
    expect(fs.existsSync(path.resolve(process.cwd(), "vercel.json"))).toBe(true);
    expect(
      fs.existsSync(
        path.resolve(process.cwd(), "docs/research/COMPETITOR_RESEARCH.md")
      )
    ).toBe(true);
    expect(
      fs.existsSync(
        path.resolve(process.cwd(), "docs/research/FEATURE_MATRIX.csv")
      )
    ).toBe(true);
    expect(
      fs.existsSync(
        path.resolve(process.cwd(), "docs/research/SOURCE_DISCOVERY_BACKLOG.md")
      )
    ).toBe(true);

    // Anonymous callers blocked from account preferences & deletion (401)
    expect((await getPreferences()).status).toBe(401);
    expect((await deleteAccount()).status).toBe(401);
  });
});
