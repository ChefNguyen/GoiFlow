---
description: Implement the next task incrementally — build, test, verify, commit
---

Invoke the incremental-implementation skill alongside test-driven-development.

Pick the next pending task from `tasks/todo.md`. Before writing any code:
1. Run `gitnexus_impact` on any symbol you will modify — report blast radius
2. Read the task's acceptance criteria
3. Load relevant context: existing repo/service pattern, types, related test files

For each increment:
1. Write a failing test for the expected behavior (RED)
2. Implement the minimum code to pass the test (GREEN)
3. Run: `npm run lint && npm run typecheck && npm run test:unit`
4. If anything fails, follow the debugging-and-error-recovery skill before continuing
5. Commit with a descriptive message following Conventional Commits
6. Mark the task complete in `tasks/todo.md`

GoiFlow-specific implementation rules:
- Route ALL data access through repositories/services in `src/server/` — never query Prisma directly from route handlers
- Every API route that reads session state MUST validate auth/guest ownership
- Use the existing `GameSession`, `GameRound`, `GameSubmission`, `GameResult` schema — do NOT add fields without an ADR
- Keep feature code in `src/features/<domain>/` — only promote to `src/server/` when stable and reused
- After completing the full task, run `npm run verify` for the final gate
