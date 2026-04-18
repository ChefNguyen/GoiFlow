import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/game/setup", label: "Game" },
  { href: "/shiritori/setup", label: "Shiritori" },
  { href: "/library", label: "Library" },
  { href: "/history", label: "History" },
  { href: "/settings", label: "Settings" },
];

export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b-2 border-[var(--color-primary)] bg-[var(--color-surface)]">
      <div className="flex min-h-16 items-center justify-between px-6 py-4 lg:px-8">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="font-[family-name:var(--font-headline)] text-xl font-bold tracking-tight text-[var(--color-primary)]"
          >
            語彙フロー
          </Link>
          <nav className="hidden md:flex items-center gap-6 font-[family-name:var(--font-headline)] tracking-tight">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-2 py-1 text-[var(--color-secondary)] transition-none hover:bg-[var(--color-surface-container)]"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/sign-in" className={buttonStyles("secondary", "px-4 py-3")}>
            Sign in
          </Link>
          <Link href="/game/setup" className={cn(buttonStyles("primary", "px-4 py-3 !text-white"))}>
            Start game
          </Link>
        </div>
      </div>
      <nav className="grid grid-cols-5 border-t border-[var(--color-outline-variant)] md:hidden">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="px-3 py-3 text-center font-[family-name:var(--font-label)] text-xs uppercase tracking-[0.12em] text-[var(--color-secondary)] transition-none hover:bg-[var(--color-surface-container)]"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
