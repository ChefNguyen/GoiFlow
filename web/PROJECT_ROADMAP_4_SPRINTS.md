# GoiFlow — Project Roadmap (Sprints)

> Roadmap living document. Each sprint lists deliverables with acceptance criteria and sequencing.

---

## 🎯 Completed Foundation

- [x] Next.js App Router + TypeScript + Prisma + PostgreSQL stack
- [x] Auth.js / NextAuth with JWT strategy, OAuth (Google/Facebook) and credentials (OTP+password)
- [x] Multiplayer vocabulary game vertical slice: room → rounds → submissions → score → history → profile
- [x] Content store (VocabularyEntry, AcceptedAnswer) with JLPT-scoped queries
- [x] Data import pipeline (file basis, Jisho, KanjiDictVN, Gemini)
- [x] Profile page: XP/level/rank, streak, accuracy, heatmap, recent sessions
- [x] GitNexus code intelligence, AGENTS.md, .claude harness

---

## 🏃‍➡️ Sprint 🔒 Auth — Secure & Stabilize (current)

| # | Deliverable | Status | Acceptance Criteria |
|---|------------|--------|---------------------|
| 1 | Game APIs require authenticated identity and ownership | ✅ Done | All game routes require `auth()`; participant ID derived server-side, no longer accepted from request body; membership and host checks enforced |
| 2 | Server-authoritative game lifecycle with conditional state updates | ✅ Done | Start → IN_PROGRESS, host-only round progression, conditional updateCurrentRoundNumber with optimistic locking, any-member submission, host-only finalization |
| 3 | Verification gate restored | ✅ Done | `npm run lint`: 0 errors (4 warnings: 2 img, 1 hook deps, 1 unused import); `npm run typecheck`: passes |
| 4 | Vietnamese seed quality enforced | ✅ Done | `scripts/import-vocab.ts` rejects records without `meaningsVi` (no more `meaningsEn` fallback); AI enrichment blocked in sprint policy |
| 5 | Library and global Leaderboard real DB-backed | ✅ Done | Library reads from `VocabularyEntry` via JLPT-filtered service/query; Leaderboard aggregates `GameResult` by authenticated participant; mock data and Shiritori references removed |
| 6 | Roadmap, ADR, and task tracking restored | ✅ Done | This file; ADR 0002; `docs/product/` updated; `tasks/todo.md` populated |

---

## 🗓️ Sprint 2 — Data quality & content library

*Planned after Sprint 1*

- Improve seed coverage per JLPT level (N5–N1)
- Add unit tests for import-pipeline validation/preparation
- Add seed preflight script with failure reporting
- Content library detail view (vocab entry drilldown)
- Vocabulary search by term/reading/meaning

## 🗓️ Sprint 3 — Game features & polish

*Planned after Sprint 2*

- Shiritori game mode (if product spec confirms direction)
- Timer enforcement server-side per `timePerPromptSeconds`
- Game reconnection after tab close / network loss
- Participant ready-state before room starts
- Average response time tracking in results

## 🗓️ Sprint 4 — Production readiness

*Planned after Sprint 3*

- Global leaderboard full page navigation from game/results
- Account settings: password change, email verification
- Organization/multi-tenant foundations
- Monitoring readiness (structured logging, error tracking)
- Rate limiting on game APIs
- Playwright E2E authenticated game flow
