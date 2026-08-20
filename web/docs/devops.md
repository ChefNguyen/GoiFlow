# GoiFlow DevOps, CI & CD

## Delivery model

GitHub Actions is GoiFlow's only deployment source. Do **not** enable Vercel Git Integration auto-deploy for this project: it would create duplicate deployments outside the CI, migration, approval, and smoke-test gates.

- A push to `dev` runs CI and, after CI succeeds, deploys the exact tested commit to Vercel Preview through the GitHub `staging` environment.
- A push to `main` runs CI and, after CI succeeds and the GitHub `production` environment is approved, deploys the exact tested commit to Vercel Production.
- The CD workflow uses `prisma migrate deploy` before Vercel build/deploy. Never use `prisma db push` against staging or production.

## CI

GitHub Actions runs `.github/workflows/ci.yml` for pushes and pull requests targeting `main` or `dev`.

The verification jobs use an ephemeral PostgreSQL 16 service. CI does not connect to staging or production databases.

The checks are:

1. `npm ci`
2. `npx prisma generate`
3. `npx prisma migrate deploy`
4. `npm run lint`
5. `npm run typecheck`
6. `npm run db:validate`
7. Unit and integration tests
8. `npm run build`
9. Playwright E2E tests

## One-time Vercel setup

1. Create one Vercel project manually.
2. Keep Vercel Git Integration disconnected or disable its auto-deploy behavior.
3. Create a least-privilege Vercel token and collect the Vercel organization/team ID and project ID.
4. Store the token, organization ID, and project ID only in the corresponding GitHub Environment secrets. Do not commit `.vercel/project.json`, a token, an ID, or a generated `.vercel` directory.
5. Attach a stable HTTPS staging alias/domain and a stable HTTPS production domain. The staging alias is reassigned by CD to the latest successful Preview deployment.

The CD workflow uses the Vercel CLI with environment-scoped `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, and `VERCEL_TOKEN`; no repository-local Vercel link file is required.

## Vercel runtime configuration

Configure Vercel Preview with staging values and Vercel Production with production values. They must use different databases and auth secrets.

Required runtime variables for both targets:

- `DATABASE_URL`
- `AUTH_SECRET`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `NEXT_PUBLIC_APP_URL`
- `ENABLE_DEV_AUTH=false`

`AUTH_SECRET` is the Auth.js secret currently consumed by the application. Keep `NEXTAUTH_SECRET` equal to its environment's `AUTH_SECRET` for compatibility with the existing environment contract.

Set `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` to the stable HTTPS URL for that target, not a generated per-deployment Preview URL. This is required for a stable Auth.js/OAuth callback origin.

Configure optional values only when that integration is enabled:

- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`
- `GEMINI_API_KEY`
- `RESEND_API_KEY`, `EMAIL_FROM`
- `REDIS_URL`

If Google or Facebook OAuth is enabled, register both callback URLs with the provider:

```text
https://<stable-staging-domain>/api/auth/callback/google
https://<production-domain>/api/auth/callback/google
https://<stable-staging-domain>/api/auth/callback/facebook
https://<production-domain>/api/auth/callback/facebook
```

Only register the callbacks for providers that are actually enabled.

## GitHub Environments

Create and protect `staging` and `production` in **Repository Settings → Environments**.

Each environment requires these secrets:

- `DATABASE_URL`
- `AUTH_SECRET`
- `NEXTAUTH_SECRET`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Each environment requires these variables:

- `NEXTAUTH_URL`
- `NEXT_PUBLIC_APP_URL`

Configure deployment rules:

- `staging`: restrict deployments to `dev`.
- `production`: restrict deployments to `main` and require at least one reviewer.

Environment approval gates access to environment secrets. Therefore, a production reviewer approves **before** the production migration runs.

## CD workflow behavior

`.github/workflows/cd.yml` starts only after `GoiFlow CI Pipeline` succeeds for a push. GitHub evaluates `workflow_run` workflows from the default branch, so merge the CD workflow into `main` before expecting the first `dev` or `main` deployment:

1. Verify the completed CI run came from `dev` or `main`.
2. Check out the exact `workflow_run.head_sha` that passed CI.
3. Install dependencies and generate Prisma Client.
4. Run `npx prisma migrate deploy` using that GitHub Environment's database.
5. Pull Vercel Preview or Production configuration.
6. Build and deploy the Vercel prebuilt artifact.
7. For staging only, assign the configured stable alias to the new Preview deployment.
8. Retry `<stable-app-url>/api/health` up to 30 times, failing the job unless it returns HTTP 200.

`/api/health` is a process liveness check. After a successful CD job, also perform the manual authentication smoke test below to validate runtime configuration and database-backed behavior.

## Branch protection

Protect `main` and require pull requests, an up-to-date branch, and these CI checks before merge:

- `Lint, Typecheck, Test & Build`
- `Playwright E2E Tests`

Apply equivalent protection to `dev` if it is a shared integration branch.

## Staging rollout checklist

- [ ] Vercel project exists and Git Integration auto-deploy is disabled.
- [ ] `staging` has all six secrets and both URL variables.
- [ ] Staging `DATABASE_URL` and auth secrets are distinct from production.
- [ ] Vercel Preview runtime variables match `staging`, including `ENABLE_DEV_AUTH=false`.
- [ ] A stable staging HTTPS alias/domain exists and matches both staging URL variables.
- [ ] OAuth callbacks are registered for every enabled provider.
- [ ] The DevOps/CD commit is reviewed and pushed.
- [ ] A push to `dev` completes CI, staging migration, Preview deploy, alias assignment, and `/api/health` returns 200.
- [ ] Verify sign-in and one minimal authenticated path through the stable staging URL.

## Production rollout checklist

- [ ] The staging rollout, migration, health response, and authenticated smoke path were verified.
- [ ] Vercel Production runtime values and the `production` GitHub Environment are independent from staging.
- [ ] The production domain and OAuth callback URLs are configured.
- [ ] `production` is restricted to `main` and has required reviewer(s).
- [ ] `main` branch protection requires both CI jobs.
- [ ] Merge to `main` only after CI succeeds.
- [ ] A designated reviewer approves the production Environment deployment.
- [ ] Verify production migration, deploy, and `/api/health` success in the CD log.
- [ ] Verify sign-in and a minimal core user flow at the production URL.

## Failure handling and rollback

1. Stop additional promotion and preserve the GitHub Actions and Vercel deployment logs.
2. Determine whether failure occurred before migration, during migration, during deploy, or during the smoke test.
3. Never automatically reverse a Prisma migration. Determine whether the schema remains backward-compatible with the last known-good application version.
4. If it is compatible, redeploy the last known-good Vercel deployment or artifact.
5. If schema/data recovery is required, restore from a verified backup or ship a forward-compatible corrective migration before redeploying.
6. Re-run `/api/health`, sign-in, and a minimal authenticated smoke path after recovery. Record the final deployment SHA, migration state, and follow-up work.

## Local verification

```bash
npm run verify
npm run test:e2e
```

For a local production-like database and application:

```bash
docker compose --env-file .env.docker up -d postgres redis
npx prisma migrate deploy
npm run build
npm run start
```
