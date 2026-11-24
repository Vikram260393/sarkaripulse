# SarkariPulse — Official Source Registry & Research Policy (`SOURCE_REGISTRY.md`)

> **Version:** 1.0 | **Date:** 23 November 2026 | **Source Brief:** `SarkariPulse_Project_Master_Blueprint.pdf` (Ch. 03, 08, 36)  
> **Important Notice:** No source below is marked `VERIFIED` or `APPROVED` yet. Every domain, recruitment URL, robots/terms review, and test parser capture must be executed and recorded during Phase 4 before activation.

---

## 1. Source Trust Hierarchy (Blueprint Ch. 08)

| Tier | Definition | Role in SarkariPulse |
| :--- | :--- | :--- |
| **Tier 1 (Primary Official)** | Official recruiting authority, ministry, department, commission, board, university, PSU, or `.gov.in` / `.nic.in` / verified official portal | Authoritative evidence for all critical recruitment facts |
| **Tier 2 (Authorised Official Channel)** | Official government employment publication (e.g., Employment News) or explicitly authorised official portal | Authoritative evidence when linked/corroborated |
| **Tier 3 (Discovery Only)** | Reputable news outlets or aggregators | May trigger discovery of a candidate notice **only**; must be confirmed against Tier 1 or Tier 2 before verification |
| **Competitor Portals** | Commercial sarkari-job aggregators | **NEVER evidence** for any critical fact; UX benchmarking only (no scraping or text reuse) |

---

## 2. Scanning Etiquette & Technical Controls

1. Prefer official APIs, RSS feeds, XML sitemaps, clean public HTML, and public downloadable PDFs.
2. Respect `robots.txt`, published site terms, rate limits, and staggered request intervals.
3. Use conditional HTTP requests (`If-None-Match` / `ETag`, `If-Modified-Since` / `Last-Modified`) and content hashing (`SHA-256`) to minimise load on government servers.
4. Send a transparent, descriptive `User-Agent` header identifying SarkariPulse with a contact URL.
5. Never bypass CAPTCHA, logins, IP blocks, or anti-bot walls. Never run load tests against government websites.
6. Log HTTP status, retrieval latency, content hash, parser version, and source health for every scan.
7. New or unstable sources default to `trust_policy = 'manual_only'` (human review required) until sustained accuracy is proven.

---

## 3. Pilot Source Onboarding Backlog (Phase 4 Target)

> **Policy:** Start with a small, high-priority verified set (Central + Maharashtra priority). Expand only after extraction and verification accuracy are measured.

| Candidate ID | Organisation | Scope | Proposed Official Domain (Unverified — Must Confirm Ownership) | Onboarding Status |
| :--- | :--- | :--- | :--- | :--- |
| SRC-001 | Union Public Service Commission (UPSC) | Central | *Pending domain & robots/terms verification* | `PENDING_ONBOARDING` |
| SRC-002 | Staff Selection Commission (SSC) | Central | *Pending domain & robots/terms verification* | `PENDING_ONBOARDING` |
| SRC-003 | Maharashtra Public Service Commission (MPSC) | Maharashtra (Priority) | *Pending domain & robots/terms verification* | `PENDING_ONBOARDING` |
| SRC-004 | Maharashtra Police Recruitment | Maharashtra (Priority) | *Pending domain & robots/terms verification* | `PENDING_ONBOARDING` |
| SRC-005 | Institute of Banking Personnel Selection (IBPS) | Central / Banking | *Pending domain & robots/terms verification* | `PENDING_ONBOARDING` |
| SRC-006 | Railway Recruitment Boards (RRBs) | Central / Railway | *Pending domain & robots/terms verification* | `PENDING_ONBOARDING` |
| SRC-007 | SBI Careers | Central / Banking | *Pending domain & robots/terms verification* | `PENDING_ONBOARDING` |
| SRC-008 | MSEDCL / Mahatransco / Maharashtra State PSUs | Maharashtra (Priority) | *Pending domain & robots/terms verification* | `PENDING_ONBOARDING` |
| SRC-009 | Employment News / National Career Service (NCS) | Central (Tier 2/1) | *Pending domain & robots/terms verification* | `PENDING_ONBOARDING` |
| SRC-010 | DRDO / ISRO / Armed Forces Recruitment | Central / Defence | *Pending domain & robots/terms verification* | `PENDING_ONBOARDING` |

*(Expansion backlog: Maharashtra Zilla Parishads, Municipal Corporations, State Universities, and other State PSCs, Police Boards, Health & Education Departments after pilot accuracy gate passes.)*

---

## 4. Mandatory Source Onboarding Record Template (Blueprint Ch. 36)

Every onboarded source must complete this checklist before entering `sources`:

```yaml
source_id: TBD
organisation: ""
official_domain: ""
recruitment_url: ""
source_owner: ""
access_method: "api | rss | sitemap | html | pdf"
official_status_evidence: "" # How domain ownership & authority were verified
terms_and_robots_review:
  reviewed_at: ""
  robots_allowed: true
  pdf_redistribution_allowed: false # Default conservative; link-only unless permitted
  notes: ""
scan_interval_minutes: 360
parser_type: ""
parser_version: "v1.0.0"
test_notice_capture:
  notice_url: ""
  extracted_title: ""
  notification_number: ""
  dates_verified: false
  vacancy_count_verified: false
  official_links_verified: false
verification_result: "PENDING"
trust_policy: "manual_only"
date_approved: null
review_due_date: "" # Quarterly domain & parser revalidation
```

---

## 5. Competitor Research & Market Intelligence Policy (Blueprint Ch. 03)

- **Scope:** Review the **6 user-supplied reference sites** (pending user input — `PRE-02`) plus at least **20 additional Indian recruitment-information portals**.
- **Strict Boundary:** Product & UX discovery only. Never copy wording, tables, images, logos, layouts, or proprietary datasets. Do not store scraped competitor text for reuse.
- **13 Evaluation Dimensions (Score 1–5 with objective evidence notes):**
  1. Homepage information density
  2. Freshness indicators
  3. Search & filters
  4. State & qualification taxonomy
  5. Job detail completeness
  6. Direct official links
  7. PDF handling
  8. Language support (English/Hindi/Marathi)
  9. Accessibility
  10. Advertisement intrusiveness
  11. Page speed
  12. Mobile navigation
  13. Correction mechanisms
- **Planned Deliverables (to be generated in `docs/research/` once reference URLs are provided):**
  - `docs/research/COMPETITOR_RESEARCH.md`
  - `docs/research/FEATURE_MATRIX.csv`
  - `docs/research/SOURCE_DISCOVERY_BACKLOG.md`
  - Product Differentiation Summary
- **Cadence:** Repeat quarterly or prior to major product redesigns.
