# SarkariPulse — SEO Strategy, Structured Data & Analytics (`SEO_STRATEGY.md`)

> **Version:** 1.0 | **Date:** 23 November 2026 | **Source Brief:** `SarkariPulse_Project_Master_Blueprint.pdf` (Ch. 21, 22)

---

## 1. SEO Philosophy & Candidate Search Intent

- **Goal:** Build durable discoverability through accurate, fast, crawlable, people-first pages. First-page search rankings are **never guaranteed**.
- **Core Candidate Intents:** Vacancy count, qualification, age limit, last date, salary/pay level, official notification PDF, step-by-step application process, admit card, answer key, syllabus, and result.
- **Improvement Loop:** Optimise based on real candidate search utility and measured Search Console performance — never keyword stuffing or doorway pages.

---

## 2. Technical SEO Specifications

1. **Server-Side Rendering (SSR):** All primary content pages (recruitments, categories, states, qualifications, events, guides) must be server-rendered with full HTML content on first response.
2. **Metadata & Canonicalisation:**
   - Unique, factual `<title>` and `<meta name="description">` per page and language.
   - Strict self-referencing `<link rel="canonical">` using the single canonical HTTPS hostname.
   - Clean Open Graph & Twitter card metadata.
3. **Multilingual Signals (`en`, `hi`, `mr`):**
   - Accurate `<html lang="...">` (`en`, `hi`, `mr`).
   - Bidirectional `hreflang` link alternates (`en-IN` / `en`, `hi`, `mr`, plus `x-default` -> `/en/`) **only** for published equivalent translations.
   - Language-specific XML sitemaps (`/sitemap-en.xml`, `/sitemap-hi.xml`, `/sitemap-mr.xml` referenced from `/sitemap.xml`).
4. **Crawl Hygiene & Indexation Control:**
   - Explicit `robots.txt` pointing to the sitemap index and disallowing `/admin/`, `/api/`, and internal search query paths.
   - Apply `noindex, follow` to search-result parameter combinations (`?q=...`, multi-filter combos) and empty filter/category pages.
   - Avoid redirect chains; return accurate HTTP status codes (`301` for permanent moves, `404`/`410` for removed pages).
5. **Breadcrumbs & Internal Linking:** Structured breadcrumbs on every page; contextual links connecting a recruitment notice to its admit card, syllabus, answer key, result, and newer annual cycle.

---

## 3. Content SEO & E-E-A-T Standards

- **Landing Pages:** State (e.g., `/en/states/maharashtra/`), qualification (`/en/qualification/12th-pass/`), department, and exam hubs must contain **unique explanatory content** plus live links to verified active records.
- **No Doorway Pages:** Never mass-generate thin pages with only a state or city name swapped.
- **Transparency Signals:** Every recruitment page must visibly display:
  - Official source citation & notification reference
  - Editorial attribution / review status
  - `Last Verified` timestamp (rendered in `Asia/Kolkata`)
  - Link to original official notification
  - Link to Correction Policy & independent platform disclaimer
- **Expired / Closed Recruitments:** Retain only when historically useful; visibly label `Application Closed` / `Completed`, disable active-application styling on expired links, and link to newer recruitment cycles when published.

---

## 4. Structured Data (JSON-LD) Governance

Validate every JSON-LD block against the **actual visible page content** and current Google Search Central guidelines before release:

| Schema Type | Eligible Pages | Mandatory Rules |
| :--- | :--- | :--- |
| **`Organization`** | Site-wide / Homepage | SarkariPulse identity, canonical URL, contact/policy links (no government affiliation claims) |
| **`WebSite`** | Homepage | Canonical site URL and `SearchAction` |
| **`BreadcrumbList`** | All inner pages | Exact match to visible breadcrumb hierarchy |
| **`Article`** | Recruitment summaries, event notices, career guides | Author/publisher = SarkariPulse, `datePublished`, `dateModified`, `inLanguage` |
| **`JobPosting`** | **ONLY** specific actual job vacancies satisfying all current Google `JobPosting` requirements | **Never** emit on general exam summaries, admissions, or expired/closed/fictional recruitments. Remove or mark expired strictly in sync with `application_end`. |

---

## 5. Google Search Console Operations

- Verify the canonical production domain in Google Search Console (`PRE-10`).
- Submit the XML sitemap index and monitor indexing, canonicalisation, Core Web Vitals, and structured data enhancement reports weekly.
- Do **not** spam manual "Request Indexing" on every update; rely on clean sitemaps and normal crawling.
- Investigate any traffic drop methodically (page quality, factual accuracy, HTTP status, canonical tags, search intent) before making structural edits.

---

## 6. Privacy-Safe Analytics & Experimentation (Blueprint Ch. 22)

### Tracked Product Events (10)
| Event Name | Allowed Safe Parameters |
| :--- | :--- |
| `search_submitted` | `language`, `has_filters`, `result_count_bucket` *(NO raw user search text that may contain PII)* |
| `filter_applied` | `filter_type`, `filter_slug`, `language` |
| `recruitment_opened` | `recruitment_id`, `category_slug`, `state_code`, `lifecycle_status`, `language` |
| `official_notification_clicked` | `recruitment_id`, `destination_domain`, `language` |
| `official_application_clicked` | `recruitment_id`, `destination_domain`, `language` |
| `pdf_downloaded` | `pdf_id`, `document_type`, `language` |
| `bookmark_added` | `recruitment_id`, `language` |
| `language_changed` | `from_lang`, `to_lang`, `page_type` |
| `alert_subscribed` | `channel`, `frequency`, `language` |
| `correction_reported` | `page_type`, `issue_type`, `language` |

### Strict Privacy & Ethical Experimentation Rules
- Never send PII, candidate application details, email addresses, or raw search strings to analytics.
- Document consent behaviour and retention in the Privacy Policy.
- **Controlled Experiments:** Permitted for navigation labels, search placement, job card density, and summary clarity (recording hypothesis, audience, duration, success metric, and outcome). **Forbidden:** hiding critical dates/eligibility, disguising official links, or creating fake urgency.
- **User Correction Channel:** Provide an unauthenticated correction-report form (page URL, issue type, explanation, optional contact) that routes material factual reports directly to the `verification_queue`.
