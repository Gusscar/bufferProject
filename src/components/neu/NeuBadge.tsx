import { cn } from "@/lib/format";
import type { ReactNode } from "react";

type Tone = "neutral" | "accent" | "teal" | "danger" | "warning";

const TONE_CLASS: Record<Tone, string> = {
  neutral: "text-muted",
  accent: "bg-accent-soft text-accent",
  teal: "bg-teal-soft text-teal",
  danger: "bg-danger/15 text-danger",
  warning: "bg-warning/20 text-warning",
};

export function NeuBadge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "neu-chip inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold",
        tone === "neutral" && "!shadow-none text-muted",
        TONE_CLASS[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Dot({ className }: { className?: string }) {
  return <span className={cn("inline-block h-2 w-2 rounded-full", className)} aria-hidden />;
}

export function StatusBadge({ status }: { status: string }) {
  const tone: Tone =
    status === "sent"
      ? "teal"
      : status === "scheduled"
        ? "accent"
        : status === "draft"
          ? "neutral"
          : status === "error"
            ? "danger"
            : "warning";
  return (
    <NeuBadge tone={tone}>
      <Dot
        className={cn(
          status === "sent" && "bg-teal",
          status === "scheduled" && "bg-accent",
          status === "draft" && "bg-muted",
          status === "error" && "bg-danger",
          status === "sending" && "bg-warning animate-pulse",
          status === "needs_approval" && "bg-warning",
        )}
      />
      {status}
    </NeuBadge>
  );
}