---
description: Simplify code for clarity and maintainability — reduce complexity without changing behavior
---

Invoke the code-simplification skill.

Simplify recently changed code (or the specified scope) while preserving exact behavior:

1. Read `CLAUDE.md` and study GoiFlow conventions
2. Identify the target code — recent changes unless a broader scope is specified
3. Run `gitnexus_context` on the symbol to understand callers and callees before touching it
4. Understand the code's purpose, callers, edge cases, and test coverage
5. Scan for simplification opportunities:
   - Deep nesting → guard clauses or extracted helpers
   - Long functions → split by responsibility
   - Nested ternaries → if/else or early return
   - Generic names → descriptive names
   - Duplicated logic → shared service/repository function
   - Dead code → remove after confirming no callers (verify with gitnexus_impact)
6. Apply each simplification incrementally — run `npm run test:unit` after each change
7. Verify all tests pass, the build succeeds (`npm run build`), and the diff is clean

**GoiFlow-specific rules:**
- Do NOT extract a shared abstraction for fewer than 3 real usages
- Simplifications that touch repository or service methods MUST first pass `gitnexus_impact` at d=1
- Never rename exported symbols without using `gitnexus_rename` (dry-run first)
