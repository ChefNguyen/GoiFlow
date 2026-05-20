---
description: Conduct a five-axis code review — correctness, readability, architecture, security, performance
---

Invoke the code-review-and-quality skill.

Review the current changes (staged or recent commits) across all five axes:

1. **Correctness** — Does it match the spec in `docs/product/`? Edge cases handled? Tests adequate?
2. **Readability** — Clear names? Straightforward logic? Well-organized?
3. **Architecture** — Follows GoiFlow patterns? (Repository → Service → API → UI flow, no direct Prisma in route handlers)
4. **Security** — Auth/guest ownership validated? No raw user input to DB? Session tokens not leaked?
5. **Performance** — No N+1 queries on GameRound/submission fetches? Pagination on list endpoints?

**GoiFlow-specific review checklist:**
- [ ] Auth boundary respected: every protected route calls `auth()` or validates `participantId` ownership
- [ ] Prisma queries go through `src/server/` repositories — not inline in API routes
- [ ] No new Prisma schema field added without a corresponding migration and ADR entry
- [ ] JLPT level is always passed as a filter parameter — never fetch entire content tables
- [ ] Answer normalization happens server-side — raw client input is never stored unchecked as correct
- [ ] `npm run verify` passes (lint + typecheck + db:validate + unit tests + build)

Categorize findings as **Critical**, **Important**, or **Suggestion**.
Output a structured review with specific `file:line` references and fix recommendations.
