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

## Claude Harness

The `.claude/` directory contains the project harness used by Claude Code:

- `agents/` for role-specific helpers
- `commands/` for repeatable workflows
- `rules/` for non-negotiable conventions
- `skills/` for feature, TDD, release, and security workflows
- `mcp-servers.json` for opt-in external context and browser automation

Use the harness as a guide, not as decoration. Keep it lean and current.
