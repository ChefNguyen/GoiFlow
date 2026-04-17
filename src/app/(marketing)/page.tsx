import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const pillars = [
  {
    title: "Production-first baseline",
    description:
      "Auth, Prisma, route groups, tests, and docs are already in place before feature work begins.",
  },
  {
    title: "Multi-tenant foundation",
    description:
      "User, organization, and membership contracts are wired from the start so product logic can grow cleanly.",
  },
  {
    title: "Claude-ready harness",
    description:
      "Agents, commands, rules, and skills are organized inside `.claude/` for day-two collaboration.",
  },
];

export default function MarketingPage() {
  return (
    <div className="pb-16">
      <section className="container-shell grid gap-10 py-16 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
        <div className="space-y-6">
          <Badge>Workflow SaaS starter</Badge>
          <div className="space-y-4">
            <h1 className="heading-balance max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
              Start GoiFlow with real foundations, not a disposable prototype.
            </h1>
            <p className="copy-balance max-w-2xl text-lg leading-8 text-[var(--color-ink-soft)]">
              This starter sets up App Router structure, tenant-aware data
              models, Auth.js wiring, verification scripts, and a focused Claude
              Code harness.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/game/setup" className={buttonStyles("primary")}>
              Start game
            </Link>
            <Link href="/sign-in" className={buttonStyles("secondary")}>
              Sign in flow
            </Link>
          </div>
        </div>
        <Card className="surface-muted border-none">
          <CardHeader>
            <CardTitle>What is already locked in</CardTitle>
            <CardDescription>
              The repo is ready for product specs, auth setup, domain modeling,
              and the first vertical slice.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-[var(--color-ink-soft)]">
            <p>Route groups: marketing, auth, app, and api.</p>
            <p>Docs flow: docs/product, docs/adr, and docs/runbooks.</p>
            <p>Quality gate: lint, typecheck, Prisma validate, tests, build, and Playwright smoke.</p>
          </CardContent>
        </Card>
      </section>

      <section id="product" className="container-shell grid gap-5 py-8 md:grid-cols-3">
        {pillars.map((pillar) => (
          <Card key={pillar.title}>
            <CardHeader>
              <CardTitle>{pillar.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-[var(--color-ink-soft)]">
                {pillar.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section id="stack" className="container-shell py-8">
        <div className="surface-card grid gap-6 p-6 lg:grid-cols-[1.3fr_minmax(0,1fr)]">
          <div className="space-y-3">
            <p className="eyebrow">Stack</p>
            <h2 className="text-3xl font-semibold tracking-tight">
              Next.js, Prisma, Auth.js, Tailwind, Vitest, and Playwright.
            </h2>
            <p className="max-w-2xl text-[var(--color-ink-soft)]">
              Enough seriousness for production work, still lean enough to stay
              pleasant inside Claude Code.
            </p>
          </div>
          <div className="grid gap-3 text-sm text-[var(--color-ink-soft)] sm:grid-cols-2">
            <div className="rounded-md border border-[var(--color-border)] p-4">
              Auth surface
            </div>
            <div className="rounded-md border border-[var(--color-border)] p-4">
              Tenant foundation
            </div>
            <div className="rounded-md border border-[var(--color-border)] p-4">
              Docs discipline
            </div>
            <div className="rounded-md border border-[var(--color-border)] p-4">
              Verification scripts
            </div>
          </div>
        </div>
      </section>

      <section id="workflow" className="container-shell py-8">
        <Card>
          <CardHeader>
            <CardTitle>Build flow</CardTitle>
            <CardDescription>
              Define product behavior in docs, implement the slice in
              `src/features`, verify it, and document any durable decision.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 text-sm text-[var(--color-ink-soft)] md:grid-cols-4">
              {["Spec", "Slice", "Verify", "Decide"].map((label) => (
                <div
                  key={label}
                  className={cn(
                    "rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 text-center font-semibold",
                  )}
                >
                  {label}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
