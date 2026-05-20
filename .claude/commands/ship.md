---
description: Run the pre-launch checklist via parallel fan-out to specialist personas, then synthesize a go/no-go decision
---

Invoke the shipping-and-launch skill.

`/ship` is a **fan-out orchestrator**. It runs three specialist personas in parallel against the current change, then merges their reports into a single go/no-go decision with a rollback plan.

## Phase A — Parallel fan-out

Spawn three subagents concurrently. Issue all three Agent tool calls in a **single assistant turn**:

1. **`code-reviewer`** — Five-axis review (correctness, readability, architecture, security, performance) on the staged changes. Use the GoiFlow review checklist: auth boundary, Prisma via repository, JLPT filter, answer normalization server-side.
2. **`security-auditor`** — OWASP Top 10 pass. Focus on: participantId ownership validation, raw answer input handling, session token exposure, Prisma injection vectors.
3. **`test-engineer`** — Coverage analysis. Verify: unit tests for scoring/normalization, integration tests for API routes, Playwright smoke for the core game loop (setup→game→results).

## Phase B — Merge in main context

Synthesize all three reports:

1. **Code Quality** — Aggregate Critical/Important findings
2. **Security** — Promote Critical/High to launch blockers
3. **GoiFlow verify gate** — Run `npm run verify` (lint + typecheck + db:validate + unit tests + build). This is mandatory before GO
4. **Accessibility** — Keyboard nav for game input, screen reader for leaderboard
5. **Infrastructure** — Check `.env` vars, Prisma migrations applied, no breaking schema changes
6. **Documentation** — `docs/product/`, `docs/adr/`, `docs/runbooks/` updated if needed

## Phase C — Decision and rollback

```markdown
## Ship Decision: GO | NO-GO

### Blockers (must fix before ship)
- [Source persona: Critical finding + file:line]

### Recommended fixes (should fix before ship)
- [Source persona: Important finding + file:line]

### GoiFlow verify gate
- [ ] npm run verify: PASS | FAIL

### Rollback plan
- Trigger: [what signals prompt rollback]
- Procedure: [exact steps — DB migration rollback, feature flag off]
- RTO: [target recovery time]
```

## Rules

1. The three Phase A personas run in parallel — never sequentially
2. `npm run verify` is a hard gate — NO-GO if it fails
3. Any Critical finding = NO-GO unless user explicitly accepts the risk
4. Skip fan-out ONLY if: ≤2 files changed, diff <50 lines, AND does not touch auth/session/scoring/schema
