# SarkariPulse

**Your Career. Your Opportunity.**  
An independent Indian government recruitment-information platform covering India-wide public-sector opportunities with **Maharashtra priority**, built in **English (`/en`)**, **Hindi (`/hi`)**, and **Marathi (`/mr`)**.

> **Disclaimer:** SarkariPulse is an independent information platform and is NOT affiliated with, authorised by, or endorsed by any government authority, recruiting commission, or examination board.

---

## Quick Local Bootstrap

Prerequisites: **Node.js 22+ LTS** and **npm** (plus **Git** for branch workflows).

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000` (redirects to `/en`).

## Quality & Verification Commands

```bash
npm run typecheck   # TypeScript strict type checking
npm run lint        # ESLint (Next.js core-web-vitals + TypeScript)
npm test            # Vitest unit tests
npm run build       # Production Next.js build verification
```

## Living Documentation

- [AGENTS.md](./AGENTS.md) — Agent rules, editorial boundaries, and Definition of Done
- [TASK_TRACKER.md](./TASK_TRACKER.md) — Phased milestone tracker, prerequisites, and handover checklist
- [docs/PROJECT_PLAN.md](./docs/PROJECT_PLAN.md) — Master roadmap & acceptance criteria
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) — System, IA, multilingual & API architecture
- [docs/DATABASE_DESIGN.md](./docs/DATABASE_DESIGN.md) — Relational schema, status enums & RLS matrix
- [docs/SOURCE_REGISTRY.md](./docs/SOURCE_REGISTRY.md) — Official source tiers, onboarding template & competitor research policy
- [docs/AGENT_WORKFLOWS.md](./docs/AGENT_WORKFLOWS.md) — Extraction, verification gates, queues & kill switches
- [docs/SEO_STRATEGY.md](./docs/SEO_STRATEGY.md) — Technical/content SEO, structured data & PII-free analytics
- [docs/SECURITY.md](./docs/SECURITY.md) — Privacy by design, RBAC, PDF security & incident playbooks
- [docs/DEPLOYMENT_GUIDE.md](./docs/DEPLOYMENT_GUIDE.md) — Staging/production DevOps, Release Gates & runbooks
