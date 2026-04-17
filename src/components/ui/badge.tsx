import { cn } from "@/lib/utils";

export function Badge({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-brand-strong)]",
        className,
      )}
    >
      {children}
    </span>
  );
}
