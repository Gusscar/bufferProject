import { cn } from "@/lib/format";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "default" | "primary" | "teal" | "danger" | "ghost";
type Size = "xs" | "sm" | "md" | "lg";

export interface NeuButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: ReactNode;
}

const SIZE_CLASS: Record<Size, string> = {
  xs: "px-3 py-1.5 text-xs",
  sm: "px-4 py-2 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};

export function NeuButton({
  variant = "default",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  ...props
}: NeuButtonProps) {
  return (
    <button
      className={cn(
        "neu-btn",
        variant === "primary" && "neu-btn--primary",
        variant === "teal" && "neu-btn--teal",
        variant === "danger" && "neu-btn--danger",
        variant === "ghost" && "!shadow-none",
        SIZE_CLASS[size],
        (disabled || loading) && "neu-btn--disabled",
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <NeuSpinner className="h-4 w-4" />}
      {children}
    </button>
  );
}

export function NeuSpinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-block animate-spin rounded-full border-2 border-current border-t-transparent",
        className ?? "h-5 w-5",
      )}
      role="status"
      aria-label="Cargando"
    />
  );
}