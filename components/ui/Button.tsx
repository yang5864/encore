"use client";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "lg" | "md" | "sm";
  full?: boolean;
  children: ReactNode;
};

export function Button({ variant = "primary", size = "lg", full = true, className, children, ...rest }: Props) {
  return (
    <button
      {...rest}
      className={cn(
        "press inline-flex items-center justify-center font-bold rounded-2xl disabled:opacity-40 disabled:pointer-events-none",
        size === "lg" && "h-14 text-[16px]",
        size === "md" && "h-12 text-[16px] rounded-xl px-4",
        size === "sm" && "h-9 text-[13px] rounded-lg px-3",
        full && "w-full",
        variant === "primary" && "bg-primary text-white active:bg-primary-press",
        variant === "secondary" && "bg-primary-soft text-primary",
        variant === "ghost" && "bg-chip text-ink-2",
        variant === "danger" && "bg-danger-soft text-danger",
        className,
      )}
    >
      {children}
    </button>
  );
}

/** Bottom-fixed CTA bar that respects the safe area. */
export function FixedCta({ children }: { children: ReactNode }) {
  return (
    <div className="fixed left-0 right-0 bottom-0 z-40 pointer-events-none">
      <div
        className="mx-auto max-w-[480px] px-5 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-3 pointer-events-auto"
        style={{ background: "linear-gradient(to top, var(--bg) 70%, transparent)" }}
      >
        {children}
      </div>
    </div>
  );
}
