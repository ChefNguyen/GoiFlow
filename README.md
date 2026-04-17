# GoiFlow

GoiFlow is a workflow SaaS starter scaffold built for production-minded work with Claude Code. It ships a Next.js App Router baseline, Prisma multi-tenant foundations, Auth.js wiring, readiness endpoints, and a lean `.claude` harness so feature work can start inside a stable system.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS v4
- PostgreSQL + Prisma
- Auth.js / NextAuth
- Vitest + Playwright

## Folder Map

- `src/app/`: route groups for `(marketing)`, `(auth)`, `(app)`, and `api`
- `src/features/`: domain slices for future product work
- `src/components/`: `ui` primitives and shared app components
- `src/server/`: db client, auth config, repositories, and services
- `src/types/`: shared contracts and NextAuth augmentation
- `docs/product/`, `docs/adr/`, `docs/runbooks/`: product specs, decisions, and operational docs
- `.claude/`: project harness for Claude Code agents, rules, skills, commands, and MCP opt-ins

## Quick Start

1. Install dependencies with `npm install`
2. Copy `.env.example` to `.env`
3. Run `npm run db:generate`
4. Start the app with `npm run dev`

## Quality Gates

- `npm run lint`
- `npm run typecheck`
- `npm run db:validate`
- `npm run test:unit`
- `npm run test:integration`
- `npm run build`
- `npm run test:e2e`

## Working With Claude Code

- Treat [`CLAUDE.md`](/C:/Users/ADMIN/Documents/Project/goiflow_recovery/CLAUDE.md) as the primary operating guide.
- Keep product specs in `docs/product/`, ADRs in `docs/adr/`, and runbooks in `docs/runbooks/`.
- Keep secrets and local-only overrides out of git by using `.env`, `.claude/settings.local.json`, and `.claude/CLAUDE.local.md`.
