import { cn } from "@/lib/format";
import { formatCompact } from "@/lib/format";
import type { ReactNode } from "react";

export interface NeuStatCardProps {
  label: string;
  value: number | string;
  icon: ReactNode;
  hint?: string;
  accent?: "accent" | "teal" | "danger" | "warning";
  compact?: boolean;
}

const ACCENT_ICON: Record<string, string> = {
  accent: "text-accent",
  teal: "text-teal",
  danger: "text-danger",
  warning: "text-warning",
};

export function NeuStatCard({
  label,
  value,
  icon,
  hint,
  accent = "accent",
  compact = false,
}: NeuStatCardProps) {
  const display =
    typeof value === "number" && !Number.isFinite(value)
      ? "—"
      : typeof value === "number"
        ? formatCompact(value)
        : value || "—";

  return (
    <div className={cn("neu-raised flex items-center gap-4", compact ? "p-4" : "p-5")}>
      <div className="neu-pressed-sm flex h-12 w-12 shrink-0 items-center justify-center">
        <span className={ACCENT_ICON[accent]}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
        <p className="truncate text-2xl font-bold leading-tight tabular-nums">{display}</p>
        {hint && <p className="mt-0.5 truncate text-xs text-muted">{hint}</p>}
      </div>
    </div>
  );
}