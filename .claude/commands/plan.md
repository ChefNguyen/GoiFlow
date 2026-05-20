---
description: Break work into small verifiable tasks with acceptance criteria and dependency ordering
---

Invoke the planning-and-task-breakdown skill.

Read the existing spec in `docs/product/` and the relevant codebase sections. Then:

1. Enter plan mode — read only, no code changes
2. Identify the dependency graph:
   - Prisma schema → repositories/services (`src/server/`) → API routes (`src/app/api/`) → UI (`src/app/(app)/`)
3. Slice work **vertically** (one complete path per task DB → API → UI, not horizontal layers)
4. Write tasks with:
   - Acceptance criteria (specific, testable)
   - Verification: `npm run verify` steps (lint, typecheck, db:validate, unit tests, build)
   - Files likely touched
   - Dependencies on other tasks
5. Mark high-risk tasks (auth, schema migrations, scoring logic) as early — fail fast
6. Add checkpoints every 2-3 tasks for human review
7. Present the plan for human review before any code

Save the plan to `docs/product/<feature-name>-plan.md` and the task checklist to `tasks/todo.md`.
