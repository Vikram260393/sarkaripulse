# SarkariPulse — Competitor Research & Market Intelligence Report (`COMPETITOR_RESEARCH.md`)

> **Review Date:** 24 November 2026 | **Method:** Blueprint Ch. 03 UX & Product Discovery  
> **Strict Rule:** Research is strictly for UX discovery and differentiation — **zero** competitor wording, tables, images, logos, layouts, or scraped text are copied or stored for reuse. Official recruiting boards remain the sole source of truth for critical facts.

---

## 1. Market Landscape Summary (23 Portals Reviewed: Aggregators, Maharashtra Regional & Official Boards)

- **User-Supplied 6 Reference Sites Slot (`PRE-02`):** Ready to append any 6 specific URLs you want benchmarked in addition to the 23 portals evaluated below.
- **Observed Market Segments:**
  1. **National High-Speed Grid Aggregators** (e.g., SarkariResult, FreeJobAlert, RojgarResult, SarkariExam) — fast low-bandwidth HTML tables, strong task-based 3-column layout (Results / Admit Card / Latest Jobs), but hampered by heavy display ad clutter, inconsistent official-link domain visibility, weak Marathi support, and rare transparent correction logs.
  2. **Maharashtra Regional Portals** (e.g., Majhi Naukri, MahaBharti, Mahasarkar) — strong Marathi-first language coverage, district-wise (*Jilhyanusar*) and qualification-wise discovery, and clear at-a-glance vacancy/last-date boxes, but suffer from intrusive mobile ads near apply buttons and occasional broken/expired links.
  3. **Ed-Tech Job Hubs** (e.g., Testbook Jobs, Adda247 Jobs, Jagran Josh) — strong exam-prep ecosystem (syllabus, previous papers), but often bury direct official notification links beneath promotional banners and course CTAs.
  4. **Official Recruiting Authority Portals (Tier 1 / Tier 2)** (UPSC, SSC, RRB, IBPS, NCS, Employment News, MPSC, Maharashtra Police, MSEDCL, UPPSC, BPSC, Armed Forces) — authoritative primary sources, but frequently rely on dense desktop-only PDFs, non-responsive tables, and inconsistent mobile navigation.

---

## 2. Unmet Candidate Needs & SarkariPulse Product Differentiation

| Unmet Candidate Need Observed | How SarkariPulse Differentiates |
| :--- | :--- |
| **Unclear / unverified deadlines & stale open badges** | Separates editorial state from real-world lifecycle status; date-only calendar dates (never invented `11:59 PM`); automatic closed banners & disabled expired apply links. |
| **Hard-to-spot official links mixed with ads** | Shows explicit destination domain (`mpsc.gov.in`, `upsc.gov.in`, `ssc.gov.in`) on every external link; strict visual separation from any future advertising. |
| **No source traceability or correction logs** | Every critical fact maps to an official Tier 1/2 evidence locator, SHA-256 document hash, `Last Verified` IST timestamp, and transparent `Update & Correction History`. |
| **Weak English / Hindi / Marathi factual parity** | Canonical English master verified first, followed by controlled-glossary `hi`/`mr` translations validated by an automated Critical-Fact Parity Checker (numerals, dates, notification numbers, URLs). |
| **Heavy/unreadable PDF notices on mobile** | Clean responsive web summaries + branded printable **SarkariPulse Informational Guide PDFs** with embedded `Noto Sans Devanagari` fonts, clearly distinguished from official notices. |

---

## 3. Features to Adopt vs. Features to Avoid

- **Adopt:** Compact at-a-glance cards (organisation, vacancies, closing date, qualification), fast low-JS SSR pages for rural 3G/4G mobile networks, prominent Maharashtra priority hub, combinable URL-shareable filters, direct syllabus/result/admit-card lifecycle links, and simple unauthenticated error reporting.
- **Avoid:** Aggressive pop-ups or ad banners adjacent to official apply links, copying competitor prose, thin doorway pages swapping only state/district names, hiding closing dates below long SEO filler, or collecting sensitive identity documents (Aadhaar/PAN/bank details).

*(Detailed 1–5 dimension scores across all 23 portals are stored in `docs/research/FEATURE_MATRIX.csv`; official source onboarding leads are in `docs/research/SOURCE_DISCOVERY_BACKLOG.md`.)*
