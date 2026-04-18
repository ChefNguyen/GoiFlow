import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Checkbox component following "The Calligrapher's Manuscript" design system:
 * - Sharp corners (0px border radius)
 * - 1px outline border, solid fill when checked
 * - Instant transition (0ms)
 */

export type CheckboxProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
>;

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      type="checkbox"
      className={cn(
        "h-5 w-5 cursor-pointer appearance-none",
        "border border-[var(--color-outline)] bg-transparent",
        "transition-none",
        "checked:bg-[var(--color-primary)] checked:border-[var(--color-primary)]",
        "focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      )}
      style={{ borderRadius: 0 }}
      {...props}
    />
  ),
);

Checkbox.displayName = "Checkbox";
