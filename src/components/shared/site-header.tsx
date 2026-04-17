import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  return (
    <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur">
      <div className="container-shell flex h-16 items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-lg font-bold tracking-tight">
            GoiFlow
          </Link>
          <Badge>Starter</Badge>
        </div>
        <nav className="hidden items-center gap-6 text-sm text-[var(--color-ink-soft)] md:flex">
          <Link href="/#product">Product</Link>
          <Link href="/#stack">Stack</Link>
          <Link href="/#workflow">Workflow</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/sign-in" className={cn(buttonStyles("ghost"))}>
            Sign in
          </Link>
          <Link href="/game/setup" className={buttonStyles("primary")}>
            Start game
          </Link>
        </div>
      </div>
    </header>
  );
}
