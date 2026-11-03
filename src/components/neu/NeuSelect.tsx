import { cn } from "@/lib/format";
import type { SelectHTMLAttributes } from "react";
import { forwardRef } from "react";

interface NeuSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export const NeuSelect = forwardRef<HTMLSelectElement, NeuSelectProps>(
  function NeuSelect({ label, className, children, id, ...props }, ref) {
    return (
      <label className={cn("block", className)}>
        {label && (
          <span className="mb-2 block text-sm font-semibold text-muted">{label}</span>
        )}
        <span className="relative block">
          <select
            ref={ref}
            id={id}
            className="neu-input appearance-none px-4 py-2.5 pr-10 text-sm"
            {...props}
          >
            {children}
          </select>
          <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-muted">
            <svg width="12" height="8" viewBox="0 0 12 8" fill="none" aria-hidden>
              <path
                d="M1 1l5 5 5-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </span>
      </label>
    );
  },
);