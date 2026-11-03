import { cn } from "@/lib/format";
import type { TextareaHTMLAttributes } from "react";
import { forwardRef } from "react";

interface NeuTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  count?: number;
  max?: number;
}

export const NeuTextarea = forwardRef<HTMLTextAreaElement, NeuTextareaProps>(
  function NeuTextarea({ label, count, max, className, ...props }, ref) {
    const showCount = typeof count === "number" && typeof max === "number";
    return (
      <label className={cn("block", className)}>
        {label && (
          <span className="mb-2 block text-sm font-semibold text-muted">{label}</span>
        )}
        <textarea
          ref={ref}
          className="neu-input min-h-28 resize-y px-4 py-3 text-sm"
          {...props}
        />
        {showCount && (
          <span
            className={cn(
              "mt-1.5 block text-right text-xs tabular-nums",
              count > max! ? "text-danger" : "text-muted",
            )}
          >
            {count} / {max}
          </span>
        )}
      </label>
    );
  },
);