import { cn } from "@/lib/format";
import type { HTMLAttributes, ReactNode } from "react";

interface NeuCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  inset?: boolean;
  padding?: boolean;
}

export function NeuCard({
  children,
  inset = false,
  padding = true,
  className,
  ...props
}: NeuCardProps) {
  return (
    <div
      className={cn(
        inset ? "neu-pressed" : "neu-raised",
        padding && "p-5",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}