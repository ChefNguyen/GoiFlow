import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Input component following "The Calligrapher's Manuscript" design system:
 * - Underline style: 2px bottom border only (no four-sided box)
 * - Mimics signature line on a document
 * - 0px border radius (sharp corners)
 * - 50ms transition on focus
 */

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "w-full bg-transparent border-none border-b-2 border-[var(--color-primary)]",
        "px-0 py-2 font-[family-name:var(--font-body)] text-base",
        "text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)]",
        "transition-colors duration-[50ms]",
        "focus:outline-none focus:border-[var(--color-primary)] focus:ring-0",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = "Input";
