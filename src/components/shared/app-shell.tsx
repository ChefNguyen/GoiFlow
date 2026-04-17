"use client";

import type { Session } from "next-auth";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/shared/sign-out-button";
import { buttonStyles } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/game/setup", label: "Game", isActive: (pathname: string) => pathname.startsWith("/game") },
  { href: "/shiritori", label: "Shiritori", isActive: (pathname: string) => pathname.startsWith("/shiritori") },
  { href: "/library", label: "Library", isActive: (pathname: string) => pathname.startsWith("/library") },
  { href: "/settings", label: "Settings", isActive: (pathname: string) => pathname.startsWith("/settings") },
];

export function AppShell({
  session,
  children,
}: {
  session?: Session | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[var(--color-surface)] text-[var(--color-on-surface)]">
      <header className="border-b-2 border-[var(--color-primary)] bg-[var(--color-surface)]">
        <div className="flex min-h-16 items-center justify-between px-6 py-4 lg:px-8">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="font-[family-name:var(--font-headline)] text-xl font-bold tracking-tight text-[var(--color-primary)]"
            >
              語彙フロー
            </Link>
            <nav className="hidden md:flex items-center gap-6 font-[family-name:var(--font-headline)] tracking-tight">
              {navLinks.map((link) => {
                const isActive = link.isActive(pathname);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "px-2 py-1 transition-none hover:bg-[var(--color-surface-container)]",
                      isActive
                        ? "border-b-2 border-[var(--color-primary)] text-[var(--color-primary)]"
                        : "text-[var(--color-secondary)]",
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {session?.user ? (
              <>
                <Link
                  href="/profile"
                  aria-label="Open profile"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] font-[family-name:var(--font-label)] text-sm font-semibold uppercase text-[var(--color-primary)] transition-none hover:bg-[var(--color-surface-container)]"
                >
                  {(session.user.name ?? session.user.email ?? "U").trim().charAt(0)}
                </Link>
                <SignOutButton />
              </>
            ) : (
              <Link href="/sign-in" className={buttonStyles("secondary", "px-4 py-3")}>
                Sign in
              </Link>
            )}
          </div>
        </div>
        <nav className="grid grid-cols-4 border-t border-[var(--color-outline-variant)] md:hidden">
          {navLinks.map((link) => {
            const isActive = link.isActive(pathname);

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "px-3 py-3 text-center font-[family-name:var(--font-label)] text-xs uppercase tracking-[0.12em] transition-none hover:bg-[var(--color-surface-container)]",
                  isActive
                    ? "bg-[var(--color-surface-container-low)] text-[var(--color-primary)]"
                    : "text-[var(--color-secondary)]",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}
