import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * TopNavBar following "The Calligrapher's Manuscript" design system
 * - Sharp corners (0px border radius)
 * - Bottom border separator
 * - Material icons for actions
 * - Noto Serif JP for logo/brand
 */

interface TopNavBarProps {
  className?: string;
}

export function TopNavBar({ className }: TopNavBarProps) {
  return (
    <nav
      className={cn(
        "bg-[var(--color-surface)] border-b border-[var(--color-primary)] w-full",
        "flex justify-between items-center px-8 py-4",
        className,
      )}
    >
      {/* Left: Logo + Nav Links */}
      <div className="flex items-center gap-8">
        <span className="text-xl font-bold uppercase tracking-[0.2em] text-[var(--color-primary)] font-[family-name:var(--font-headline)]">
          語彙フロー
        </span>
        <div className="hidden md:flex gap-6 font-[family-name:var(--font-headline)] tracking-wider">
          <Link
            href="/game"
            className="text-[var(--color-secondary)] hover:bg-[var(--color-surface-container)] transition-none px-2 py-1"
          >
            Game
          </Link>
          <Link
            href="/shiritori"
            className="text-[var(--color-secondary)] hover:bg-[var(--color-surface-container)] transition-none px-2 py-1"
          >
            Shiritori
          </Link>
          <Link
            href="/library"
            className="text-[var(--color-primary)] border-b-2 border-[var(--color-primary)] pb-1"
          >
            Library
          </Link>
          <Link
            href="/settings"
            className="text-[var(--color-secondary)] hover:bg-[var(--color-surface-container)] transition-none px-2 py-1"
          >
            Settings
          </Link>
        </div>
      </div>

      {/* Right: Action Icons */}
      <div className="flex items-center gap-4 text-[var(--color-primary)]">
        <button className="hover:bg-[var(--color-surface-container)] transition-none p-2">
          <span className="material-symbols-outlined">search</span>
        </button>
        <button className="hover:bg-[var(--color-surface-container)] transition-none p-2">
          <span className="material-symbols-outlined">history</span>
        </button>
        <button className="hover:bg-[var(--color-surface-container)] transition-none p-2">
          <span className="material-symbols-outlined">account_circle</span>
        </button>
      </div>
    </nav>
  );
}
