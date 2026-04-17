import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Button variants following "The Calligrapher's Manuscript" design system:
 * - primary: Solid black with tonal bleed hover (0ms transition)
 * - secondary: Transparent with border
 * - tertiary: Text only with underline on hover
 * All variants: 0px border radius (sharp corners)
 */
type ButtonVariant = "primary" | "secondary" | "tertiary";

const variantMap: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-primary)] !text-white hover:bg-[var(--color-primary-container)] border border-[var(--color-primary)]",
  secondary:
    "bg-transparent text-[var(--color-primary)] border border-[var(--color-primary)] hover:bg-[var(--color-surface-container)]",
  tertiary:
    "bg-transparent text-[var(--color-primary)] hover:underline underline-offset-4 decoration-1",
};

export function buttonStyles(
  variant: ButtonVariant = "primary",
  className?: string,
) {
  return cn(
    "inline-flex items-center justify-center font-[family-name:var(--font-label)] uppercase tracking-[0.05em] text-xs font-medium",
    "transition-colors duration-[50ms]",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2",
    variantMap[variant],
    className,
  );
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={buttonStyles(variant, className)}
      {...props}
    />
  ),
);

Button.displayName = "Button";
