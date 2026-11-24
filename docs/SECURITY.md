# SarkariPulse — Security, Privacy & Legal Safeguards (`SECURITY.md`)

> **Version:** 1.0 | **Date:** 23 November 2026 | **Source Brief:** `SarkariPulse_Project_Master_Blueprint.pdf` (Ch. 07, 10, 17, 18, 23, 24, 35)

---

## 1. Privacy by Design & Data Minimisation

1. **Browse Without Registration:** Full recruitment discovery, filtering, official links, and public PDF downloads require zero login.
2. **Forbidden Data Collection:** SarkariPulse must **never** collect Aadhaar numbers, PAN numbers, bank account details, application portal passwords, OTPs, caste certificates, or uploaded identity documents.
3. **Minimal Account Data:** Optional candidate accounts collect only what is required for bookmarks, saved searches, and email alerts, with inline explanation of why each field is requested, explicit consent timestamps, one-click unsubscribe, JSON export, and account deletion.
4. **Legal Compliance Prerequisite (`PRE-09`):** Obtain qualified Indian legal review for Digital Personal Data Protection (DPDP) compliance, consumer-protection disclosures, copyright/redistribution terms, and advertising disclosures prior to public launch.

---

## 2. Authentication, Authorisation & Row-Level Security (RLS)

- **RLS Everywhere:** Enable PostgreSQL Row-Level Security on **every** table exposed through Supabase APIs.
  - Public role: `SELECT` strictly limited to `editorial_state = 'published'` AND `is_public_safe = true`.
  - Candidate role: `SELECT`/`INSERT`/`UPDATE`/`DELETE` strictly limited to rows where `user_id = auth.uid()`.
  - Admin & operational tables: complete deny for public and candidate roles.
- **Server-Side RBAC (5 Least-Privilege Roles — No Shared Accounts):**
  - `super_admin`: Infrastructure controls, role grants, kill switches, and all content permissions.
  - `editor`: Article edits, corrections, publication approvals.
  - `verifier`: Source evidence inspection and verification decisions.
  - `translator`: Hindi/Marathi translation editing and review.
  - `analyst`: Read-only operational, SEO, and performance reports.
  - *Rule:* Always verify roles server-side against `admin_roles`; never trust browser-supplied role claims.
- **Service-Role Key Isolation:** Supabase `service_role` keys bypass RLS and must reside exclusively in server-side runtime/Edge Function secrets — never in `NEXT_PUBLIC_*` variables, client bundles, logs, or prompts.

---

## 3. Secret Management & Monitoring

- Store all credentials (`SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `CRON_SECRET`, `WEBHOOK_SIGNING_SECRET`, email provider keys) in hosting secret managers (Vercel / Supabase Secrets).
- Use strictly separate credentials for Local Dev, Staging, and Production.
- Enforce automated dependency scanning, secret scanning (pre-commit / CI), and static analysis.
- Apply rate limiting to search, authentication, correction reports, PDF endpoints, and public APIs.
- Monitor failed admin logins, auth anomalies, unusual API traffic, storage access anomalies, failed cron signatures, and repeated source fetch failures.

---

## 4. External Links, Fraud Prevention & Prompt-Injection Defence

- **External Link Transparency:** Always mark external links visibly, display the verified destination domain (e.g., `upsc.gov.in`, `mpsc.gov.in`), validate redirect chains, and flag lookalike domains (`link_status = 'suspicious'`).
- **Official Portal Verification:** Never label a portal as "Official Apply Link" unless verified against the Tier 1/2 official notice.
- **Payment Safety Warning:** Never accept application payments; clearly warn candidates to verify fee amounts and payment instructions directly on the official recruiting portal. Never include payment links or request OTPs/passwords in SarkariPulse emails.
- **Untrusted Input & Prompt-Injection Defence:**
  - Sanitise all rendered HTML and Markdown (prevent XSS).
  - Treat all scraped HTML, PDF text, OCR output, and user feedback strictly as untrusted data — never executable instructions.
  - Constrain AI agents to allowlisted domains, approved server tools, and strict JSON Schema output validators.

---

## 5. PDF, Media & File Processing Security (Blueprint Ch. 24)

1. **Strict File Acceptance:** Enforce allowlisted file types and maximum byte sizes; validate **both** MIME type and binary file magic signature (`%PDF-`) — never trust filename extensions. Reject executables and suspicious archives. Integrate malware scanning where available.
2. **Bucket Isolation:** Store original official source documents in a controlled bucket (`official-source-docs`) and approved SarkariPulse informational guides in a separate public bucket (`public-guides`).
3. **Safe PDF Rendering:** Use a maintained PDF library, escape all untrusted text and URLs before rendering, enforce strict limits on page count, image dimensions, extraction timeout, and worker memory to prevent DoS/resource exhaustion. Embed licensed Unicode/Devanagari fonts.
4. **Content Rights & Takedown:** Link to official notices by default; store/serve original PDF copies only where access and redistribution terms permit. Maintain a public contact route and documented takedown procedure for rights holders.

---

## 6. Security Testing Checklist (Required Before Release)

- [ ] Authentication & session handling tests
- [ ] Authorisation & server-side RBAC tests across all 5 admin roles
- [ ] Automated RLS isolation tests (anon vs drafts/admin; User A vs User B)
- [ ] CSRF protection on state-changing routes
- [ ] XSS sanitisation tests (malicious HTML/Markdown/PDF payloads)
- [ ] SQL injection checks (parameterised queries only)
- [ ] File upload / MIME + magic-byte validation tests
- [ ] SSRF & open-redirect tests on source fetcher and outbound links
- [ ] Prompt-injection fixture tests in extraction pipeline
- [ ] Rate-limiting tests & client-bundle/log secret-leakage scan

---

## 7. Incident Response Playbooks (Blueprint Ch. 23 & 35)

Define severity (`SEV-1` Critical to `SEV-4` Low), incident owner, containment, investigation, user communication, recovery, and post-incident review. Never conceal material factual errors from candidates.

1. **Incorrect Recruitment Detail:** Pause/unpublish affected page (or show prominent correction banner) -> verify Tier 1 official source -> correct structured DB record -> regenerate translations & PDFs -> publish transparent change note -> log incident & audit event.
2. **Compromised Credential:** Immediately revoke & rotate leaked key -> inspect Supabase/Vercel/API access logs -> pause affected integrations -> verify clean state -> document root cause & rotation steps.
3. **Official Source Outage / Redesign:** Stop repeated retries via circuit breaker -> mark source `degraded` -> retain last verified published content with a visible freshness warning -> investigate parser/domain change.
4. **AI Provider Outage:** Queue pending extraction/writing jobs safely -> continue serving existing published public pages (graceful degradation) -> block publication of incomplete records -> resume queue cleanly once provider recovers.
