import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * SideNavBar following "The Calligrapher's Manuscript" design system
 * - Filter sidebar with sharp corners
 * - Checkbox groups for filtering
 * - Category selection with icons
 */

interface SideNavBarProps {
  className?: string;
}

export function SideNavBar({ className }: SideNavBarProps) {
  return (
    <aside
      className={cn(
        "w-64 border-r border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)]",
        "flex flex-col p-6 overflow-y-auto hidden md:flex shrink-0",
        className,
      )}
    >
      <h2 className="text-2xl font-[family-name:var(--font-headline)] mb-8 text-[var(--color-primary)] tracking-wide">
        Filters
      </h2>

      {/* JLPT Level */}
      <div className="mb-8">
        <h3 className="text-xs uppercase text-[var(--color-secondary)] mb-4 tracking-[0.02em] font-medium">
          JLPT Level
        </h3>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-3 p-2 hover:bg-[var(--color-surface-container)] cursor-pointer border border-transparent hover:border-[var(--color-outline-variant)] transition-none">
            <Checkbox />
            <span className="text-base">N5 (Beginner)</span>
          </label>
          <label className="flex items-center gap-3 p-2 hover:bg-[var(--color-surface-container)] cursor-pointer border border-transparent hover:border-[var(--color-outline-variant)] transition-none">
            <Checkbox defaultChecked />
            <span className="text-base font-medium">N4 (Basic)</span>
          </label>
          <label className="flex items-center gap-3 p-2 hover:bg-[var(--color-surface-container)] cursor-pointer border border-transparent hover:border-[var(--color-outline-variant)] transition-none">
            <Checkbox />
            <span className="text-base">N3 (Intermediate)</span>
          </label>
          <label className="flex items-center gap-3 p-2 hover:bg-[var(--color-surface-container)] cursor-pointer border border-transparent hover:border-[var(--color-outline-variant)] transition-none">
            <Checkbox />
            <span className="text-base">N2 (Pre-Advanced)</span>
          </label>
          <label className="flex items-center gap-3 p-2 hover:bg-[var(--color-surface-container)] cursor-pointer border border-transparent hover:border-[var(--color-outline-variant)] transition-none">
            <Checkbox />
            <span className="text-base">N1 (Advanced)</span>
          </label>
        </div>
      </div>

      {/* Category */}
      <div className="mb-8">
        <h3 className="text-xs uppercase text-[var(--color-secondary)] mb-4 tracking-[0.02em] font-medium">
          Category
        </h3>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-3 p-2 bg-[var(--color-surface-container-highest)] border border-[var(--color-outline-variant)] cursor-pointer transition-none">
            <span className="material-symbols-outlined text-[20px]">
              category
            </span>
            <span className="text-base font-medium">Radicals</span>
          </label>
          <label className="flex items-center gap-3 p-2 hover:bg-[var(--color-surface-container)] cursor-pointer border border-transparent hover:border-[var(--color-outline-variant)] transition-none">
            <span className="material-symbols-outlined text-[20px]">sort</span>
            <span className="text-base">Frequency</span>
          </label>
          <label className="flex items-center gap-3 p-2 hover:bg-[var(--color-surface-container)] cursor-pointer border border-transparent hover:border-[var(--color-outline-variant)] transition-none">
            <span className="material-symbols-outlined text-[20px]">
              favorite
            </span>
            <span className="text-base">Saved</span>
          </label>
        </div>
      </div>

      <Button variant="primary" className="mt-auto py-3 px-4">
        Apply Filters
      </Button>
    </aside>
  );
}
