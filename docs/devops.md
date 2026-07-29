# GoiFlow DevOps & CI/CD Documentation

## Overview

GoiFlow uses **GitHub Actions** for Continuous Integration (CI). Every push and Pull Request targeted at `main` or `dev` automatically triggers a verification pipeline to enforce code quality, type safety, database schema consistency, automated testing, and build readiness.

---

## CI Pipeline Workflow (`.github/workflows/ci.yml`)

The CI pipeline consists of two primary jobs:

### 1. `verify` Job (Lint, Typecheck, DB Validate, Unit/Integration Tests, Build)
- **Environment**: `ubuntu-latest` with Node.js 20 & PostgreSQL 16 service container.
- **Steps executed**:
  1. `npm ci`: Clean install of dependencies using exact lockfile.
  2. `npx prisma generate`: Generates Prisma Client.
  3. `npx prisma db push --skip-generate`: Applies database migrations/schema to the ephemeral PostgreSQL container.
  4. `npm run verify`: Runs the full verification suite defined in `package.json`:
     - `npm run lint` (ESLint)
     - `npm run typecheck` (TypeScript type generation & check)
     - `npm run db:validate` (Prisma schema validation script)
     - `npm run test:unit` (Vitest unit tests)
     - `npm run test:integration` (Vitest integration tests)
     - `npm run build` (Next.js production build)

### 2. `e2e` Job (Playwright End-to-End Tests)
- **Dependencies**: Depends on the successful completion of the `verify` job (`needs: verify`).
- **Steps executed**:
  1. Installs Playwright browser binaries (`chromium`).
  2. Sets up database & schema on the Postgres container.
  3. Runs `npm run test:e2e` to ensure critical end-to-end user flows operate correctly.

---

## Local Verification Commands

Developers should run the local verification suite before pushing or creating a Pull Request:

```bash
# Run complete verification (Lint, Typecheck, DB Validate, Unit & Integration Tests, Build)
npm run verify

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run E2E tests locally
npm run test:e2e
```

---

## Recommended GitHub Repository Settings

### Branch Protection Rules
To enforce code quality gates on `main`:
1. Go to **GitHub Repository ➔ Settings ➔ Branches**.
2. Add a branch protection rule for `main`.
3. Enable **Require status checks to pass before merging**.
4. Select `Lint, Typecheck, Test & Build` and `Playwright E2E Tests`.
5. Enable **Require branches to be up to date before merging**.

---

## Deployment Setup (CD - Continuous Deployment)

### Option A: Vercel (Recommended for Next.js)
1. Connect your GitHub repository to Vercel.
2. Set Environment Variables in Vercel Dashboard (`DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`).
3. Vercel automatically deploys **Preview Environments** for each PR and **Production Deployments** when merging to `main`.

### Option B: Docker / Self-Hosted VPS
1. Build the production Docker image using the root `Dockerfile`:
   ```bash
   docker build -t goiflow:latest .
   ```
2. Run with `docker-compose`:
   ```bash
   docker compose --env-file .env.docker up -d
   ```
