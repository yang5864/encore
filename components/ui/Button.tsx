"use client";
import { useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from "react";
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
/**
 * 화면 아래 고정 버튼 영역. 실제 높이(버튼 개수·오류 문구에 따라 달라짐)를 --cta-h로 알려
 * .shell이 그만큼 아래 여백을 두게 한다: 마지막 목록 항목이 버튼에 가려지지 않는다.
 */
export function FixedCta({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const root = document.documentElement;
    const set = () => root.style.setProperty("--cta-h", `${Math.ceil(el.getBoundingClientRect().height)}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => { ro.disconnect(); root.style.removeProperty("--cta-h"); };
  }, []);
  return (
    <div className="fixed left-0 right-0 bottom-0 z-40 pointer-events-none">
      <div
        ref={ref}
        className="mx-auto max-w-[480px] px-5 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-3 pointer-events-auto"
        style={{ background: "linear-gradient(to top, var(--bg) 70%, transparent)" }}
      >
        {children}
      </div>
    </div>
  );
}
