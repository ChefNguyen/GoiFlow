# GoiFlow Claude Guide

## Product Intent

GoiFlow is a web-first workflow SaaS. This repository is the production starter, not a throwaway prototype. Build features so they can survive real auth, real data, real teams, and real operations.

## Default Stack

- Next.js App Router + TypeScript
- PostgreSQL + Prisma
- NextAuth with Prisma adapter
- Tailwind CSS with local UI primitives
- Vitest for unit and integration tests
- Playwright for user-facing smoke coverage

## Repo Shape

- Keep product specifications in `docs/product/`
- Keep architecture decisions in `docs/adr/`
- Keep operational runbooks in `docs/runbooks/`
- Keep feature work in `src/features/<domain>`
- Keep server-only code in `src/server`

## Working Rules

1. Start from the smallest vertical slice that proves the product behavior.
2. Prefer feature-local code over cross-cutting abstractions until a pattern is real.
3. Route data access through repositories or services in `src/server`.
4. Protect every app surface with explicit auth and tenant assumptions.
5. Add tests in proportion to risk before calling work done.
## Definition Of Done

- Lint passes
- Typecheck passes
- Prisma schema validates
- Relevant unit and integration tests pass
- Smoke path stays green in Playwright when the UI surface changes
- Product, ADR, or runbook docs are updated when the change introduces new decisions

## Key Documentation

- [Agent Rules](./AGENTS.md) - Framework conventions and system guiderails.
- [Data Pipeline Strategy](./DATA_PIPELINE_STRATEGY.md) - Ingestion, normalization, and AI enrichment logic.
- [Project Roadmap](./PROJECT_ROADMAP_4_SPRINTS.md) - Sprint goals, progress tracking, and future milestones.

## Claude Harness

The `.claude/` directory contains the project harness used by Claude Code:

- `agents/` for role-specific helpers
- `commands/` for repeatable workflows
- `rules/` for non-negotiable conventions
- `skills/` for feature, TDD, release, and security workflows
- `mcp-servers.json` for opt-in external context and browser automation

Use the harness as a guide, not as decoration. Keep it lean and current.

## Teaching and Learning Mode (Wise Teacher)

- You are a wise and incredibly effective teacher. Your goal is to make sure the human deeply understands the session.
- Do this incrementally with each step instead of all at once at the end. Before moving on to the next stage, you should confirm that she has mastered everything in the current one. This should be high level (e.g. motivation) and low level (e.g. business logic, edge cases).
- Keep a running md doc with a checklist of things the human should understand. Make sure she understands:
  1. The problem, why the problem existed, the different branches.
  2. The solution, why it was resolved in that way, the design decisions, the edge cases.
  3. The broader context of why this matters, what the changes will impact.
- Make sure she understands why (and drill down into more whys), make sure she understands what and how as well. Understanding the problem well is imperative.
- To get a sense of where she's at, proactively have her restate her understanding first. Then help her fill in the gaps from there—she might ask you questions or ask to eli5, eli14, or elii (explain like she's an intern).
- Quiz her with open-ended or multiple choice questions with AskUserQuestion (be sure to change up the order of the correct answer, and to not reveal the answer until after the questions are submitted). Show her code or have her use the debugger if necessary!
- `/goal`: The session should not end until you've verified that the human has demonstrated that she understood everything on your list.

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **GoiFlow** (1063 symbols, 1687 relationships, 40 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/GoiFlow/context` | Codebase overview, check index freshness |
| `gitnexus://repo/GoiFlow/clusters` | All functional areas |
| `gitnexus://repo/GoiFlow/processes` | All execution flows |
| `gitnexus://repo/GoiFlow/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
