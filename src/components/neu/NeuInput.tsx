import { cn } from "@/lib/format";
import type { InputHTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";

interface NeuInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: ReactNode;
  helper?: string;
}

export const NeuInput = forwardRef<HTMLInputElement, NeuInputProps>(
  function NeuInput({ label, icon, helper, className, id, ...props }, ref) {
    return (
      <label className={cn("block", className)}>
        {label && (
          <span className="mb-2 block text-sm font-semibold text-muted">{label}</span>
        )}
        <span className="relative block">
          {icon && (
            <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-muted">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={id}
            className={cn(
              "neu-input px-4 py-2.5 text-sm",
              icon ? "pl-11" : "",
              props?.readOnly && "opacity-70",
            )}
            {...props}
          />
        </span>
        {helper && <span className="mt-1.5 block text-xs text-muted">{helper}</span>}
      </label>
    );
  },
);