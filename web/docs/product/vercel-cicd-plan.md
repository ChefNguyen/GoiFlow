# Vercel CI/CD Plan

## Goal

Release GoiFlow through one controlled path: GitHub Actions deploys successful `dev` pushes to staging Preview and successful `main` pushes to production after Environment approval. Vercel Git Integration auto-deploy remains disabled to avoid duplicate deployments.

## Dependency graph

```text
Prisma schema -> Prisma datasource -> server repositories/services -> API routes -> app UI

CI PostgreSQL + prisma migrate deploy
  -> lint/typecheck/Prisma validation/tests/build/E2E
  -> successful CI SHA
  -> environment-scoped prisma migrate deploy
  -> Vercel Preview or Production prebuilt deploy
  -> stable staging alias (Preview only) + /api/health
```

This slice does not change the Prisma schema, repositories, services, API routes, or UI. `/api/health` remains a process liveness probe; release verification also requires a manual authentication smoke test.

## Tasks

### 1. Deterministic staging promotion

**Dependencies:** Vercel project exists; Git Integration auto-deploy is disabled; `staging` has its six secrets and two URL variables.

**Repository scope:** `.github/workflows/cd.yml`

**Acceptance criteria:**

- Only a successful CI run caused by a push to `dev` can deploy staging.
- CD checks out the exact CI SHA, runs `prisma migrate deploy` against staging before Preview build/deploy, and never uses `prisma db push`.
- The Preview deployment receives a stable staging alias and fails after bounded `/api/health` retries.
- The workflow is non-interactive, pins the Vercel CLI, does not echo secrets, and has a bounded job timeout.

**Verification:** YAML review/parse; `npm run verify`; inspect only intended DevOps files in the diff.

### 2. Protected production promotion

**Dependencies:** Task 1; `production` has independent secrets/variables, is restricted to `main`, requires reviewer(s), and has a production domain.

**Repository scope:** `.github/workflows/cd.yml`

**Acceptance criteria:**

- Only a successful CI run caused by a push to `main` can request production deployment.
- GitHub Environment approval occurs before the production migration can access secrets.
- Production uses `vercel pull --environment=production`, build/deploy `--prod`, migration before deploy, and bounded health checking.
- Failure stops the pipeline without automatic migration reversal or production-domain alias mutation.

**Verification:** `npm run verify`; static review of production guards and flags; manual Environment approval only after staging verification.

### Checkpoint A — Review before rollout

Review the CD diff, pinned CLI version, exact-SHA checkout, migration order, stable staging alias, and production approval boundary. Confirm the external Vercel/GitHub prerequisites before pushing the DevOps commit.

### 3. Deployment and rollback runbook

**Dependencies:** Tasks 1–2.

**Repository scope:** `docs/devops.md`

**Acceptance criteria:**

- Documents Vercel project/token/ID setup, disabled Git Integration, Preview/Production runtime values, staging alias, OAuth callbacks, GitHub Environment rules, branch protection, rollout, failure handling, and rollback.
- Lists required GitHub Environment names without secret values.
- Explicitly requires staging/production DB separation and prohibits `prisma db push` on shared databases.

**Verification:** review the runbook against `cd.yml`; `npm run verify`.

### Checkpoint B — Review before declaring complete

After manual external setup, run the staging checklist with a real `dev` push. Inspect CI/CD and Vercel logs, verify the stable staging URL and authenticated smoke path, then independently approve the production release.

## External prerequisites

### GitHub

For both `staging` and `production`, provide secrets `DATABASE_URL`, `AUTH_SECRET`, `NEXTAUTH_SECRET`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`; provide variables `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL`.

Restrict staging to `dev`; restrict production to `main` with required reviewers. Protect `main` with the CI checks `Lint, Typecheck, Test & Build` and `Playwright E2E Tests`.

### Vercel

Create one project manually, leave Git Integration auto-deploy disabled, configure Preview from staging values and Production from production values, and attach stable staging and production HTTPS domains. Configure redirect URLs for enabled OAuth providers.

## Proposed scoped commit

```text
chore(devops): finalize Vercel deployment pipeline

.github/workflows/cd.yml
docs/devops.md
docs/product/vercel-cicd-plan.md
tasks/todo.md
```

Stage paths explicitly so unrelated dirty changes are not included.
