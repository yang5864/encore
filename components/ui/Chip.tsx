import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Chip({ tone = "neutral", children, className }: { tone?: "up" | "down" | "neutral" | "warn" | "ok"; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center h-7 px-2.5 rounded-lg text-[13px] font-bold whitespace-nowrap",
        tone === "up" && "bg-primary-soft text-primary",
        tone === "down" && "bg-down-soft text-down",
        tone === "warn" && "bg-warn-soft text-warn",
        tone === "ok" && "bg-ok-soft text-ok",
        tone === "neutral" && "bg-chip text-ink-2",
        className,
      )}
    >
      {children}
    </span>
  );
}
