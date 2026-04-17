import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Progress component following "The Calligrapher's Manuscript" design system:
 * - Linear bar with sharp corners (0px border radius)
 * - No rounded caps
 * - Tonal layering for depth (no shadows)
 * - 50ms transition for smooth fill
 */

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        className={cn(
          "relative h-2 w-full overflow-hidden bg-[var(--color-surface-container)]",
          className,
        )}
        style={{ borderRadius: 0 }}
        {...props}
      >
        <div
          className="h-full bg-[var(--color-primary)] transition-all duration-[50ms]"
          style={{
            width: `${percentage}%`,
            borderRadius: 0,
          }}
        />
      </div>
    );
  },
);

Progress.displayName = "Progress";
