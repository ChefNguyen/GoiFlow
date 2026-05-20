---
description: Run TDD workflow — write failing tests first, implement, verify. For bugs, use the Prove-It pattern.
---

Invoke the test-driven-development skill.

GoiFlow test stack: **Vitest** (unit + integration) + **Playwright** (E2E smoke).

## For new features (RED → GREEN → REFACTOR)

1. Identify the public interface being built (service method, API route, or UI interaction)
2. Write tests that describe the expected behavior — they MUST FAIL first
3. Implement the minimum code to make them pass
4. Run `npm run test:unit` or `npm run test:integration` to confirm GREEN
5. Refactor while keeping tests green

**Test placement:**
- Pure logic (scoring, normalization, answer matching) → `src/server/<domain>/<module>.test.ts`
- API routes → `tests/integration/<route>.test.ts`
- Critical user flows (setup→game→results) → `tests/e2e/<flow>.spec.ts` (Playwright)

## For bug fixes (Prove-It pattern)

1. Write a test that **reproduces the bug** — it MUST FAIL with current code
2. Confirm test fails
3. Implement the fix
4. Confirm test passes
5. Run full suite: `npm run test:unit && npm run test:integration`

## GoiFlow-specific testing rules

- Mock at system boundaries only: DB (`prisma`), external HTTP. Never mock between internal service functions
- Test answer normalization logic with real hiragana/katakana samples from the seeded dataset
- Game submission and scoring tests should use the `GameSession` + `GameRound` factory helpers if available
- E2E smoke must cover: `/game/setup` → `/game` → `/results` (core loop)
- Do NOT write snapshot tests for UI components — use behavior assertions instead
