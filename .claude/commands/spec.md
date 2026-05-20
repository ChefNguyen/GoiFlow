---
description: Start spec-driven development — write a structured specification before writing code
---

Invoke the spec-driven-development skill.

Begin by understanding what the user wants to build. Ask clarifying questions about:
1. The objective and target users
2. Core features and acceptance criteria (tie to GoiFlow game modes: KANJI, Shiritori, etc.)
3. Tech stack preferences and constraints (always: Next.js App Router + Prisma + Auth.js)
4. Known boundaries (what to always do, ask first about, and never do)

Then generate a structured spec covering all six core areas:
- **Objective** — what problem this solves for learners
- **Commands** — npm scripts involved (verify, test, db:generate, etc.)
- **Project structure** — which route groups, features/, server/ modules are touched
- **Code style** — GoiFlow conventions (repository pattern, server-only data access, tenant-aware)
- **Testing strategy** — unit (Vitest) + integration + smoke (Playwright) proportionate to risk
- **Boundaries** — what is always/ask-first/never for this feature

Save the spec as `docs/product/<feature-name>.md` and confirm with the user before proceeding.
Do NOT write any code until the spec is confirmed.
