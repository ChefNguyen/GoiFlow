# GoiFlow — Task List

> Cập nhật sau mỗi lần `/plan` hoặc khi hoàn thành một task.
> Trạng thái: `[ ]` pending · `[x]` done · `[~]` in-progress · `[!]` blocked

## Sprint 🔒 Auth — Secure & Stabilize

- [x] 1. Game APIs require authenticated identity and ownership
- [x] 2. Server-authoritative game lifecycle with conditional state updates
- [x] 3. Verification gate restored (0 lint errors, typecheck passes)
- [x] 4. Vietnamese seed quality enforced (no meaningsEn fallback)
- [x] 5. Library and global Leaderboard real DB-backed
- [x] 6. Roadmap, ADR, and task tracking restored

## Sprint 🚀 Vercel CI/CD

- [x] 1. Deterministic staging promotion workflow — CI-success `dev` push deploys the exact SHA, migrates staging with `prisma migrate deploy`, assigns the stable staging alias, and requires `/api/health` to return 200.
- [x] 2. Protected production promotion workflow — CI-success `main` push targets the protected `production` Environment, migrates before `--prod` deploy, and requires health success without automatic rollback.
- [~] Checkpoint A: Review the scoped DevOps diff and manually complete Vercel/GitHub prerequisites before pushing a deployment commit.
- [x] 3. Deployment and rollback runbook — documents Vercel/GitHub setup, runtime configuration, rollout, OAuth callbacks, branch protection, and safe migration rollback handling.
- [ ] Checkpoint B: Validate a real staging deployment and authenticated smoke path before approving the first production deployment.
