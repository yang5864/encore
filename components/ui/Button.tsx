"use client";
import { useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import type React from "react";
import { cn } from "@/lib/cn";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "lg" | "md" | "sm";
  full?: boolean;
  children: ReactNode;
};

/** 손가락이 이만큼 넘게 움직이면 탭이 아니라 스크롤로 본다 (px) */
const TAP_SLOP = 10;

/**
 * 탭은 손가락을 뗄 때(touchend) 바로 처리한다.
 * iOS는 스크롤이 관성으로 미끄러지거나 끝에서 튕기는 중의 탭을 "스크롤 멈춤"으로만 쓰고 click을 보내지 않는다.
 * 그래서 주 버튼이 두세 번 눌러야 반응했다. touchend에서 기본 동작을 막으면 뒤따르는 click(과 겹친 화면에 떨어지는 유령 클릭)도 없다.
 */
export function Button({ variant = "primary", size = "lg", full = true, className, children, onClick, onTouchStart, onTouchEnd, ...rest }: Props) {
  const start = useRef<{ x: number; y: number } | null>(null);
  return (
    <button
      {...rest}
      onClick={onClick}
      onTouchStart={(e) => {
        const t = e.touches[0];
        start.current = e.touches.length === 1 && t ? { x: t.clientX, y: t.clientY } : null;
        onTouchStart?.(e);
      }}
      onTouchEnd={(e) => {
        onTouchEnd?.(e);
        const from = start.current;
        start.current = null;
        const t = e.changedTouches[0];
        if (!onClick || !from || !t || rest.disabled || e.defaultPrevented) return;
        if (Math.abs(t.clientX - from.x) > TAP_SLOP || Math.abs(t.clientY - from.y) > TAP_SLOP) return;
        const r = e.currentTarget.getBoundingClientRect();
        if (t.clientX < r.left || t.clientX > r.right || t.clientY < r.top || t.clientY > r.bottom) return;
        e.preventDefault();
        onClick(e as unknown as React.MouseEvent<HTMLButtonElement>);
      }}
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
        // 버튼 바에서 시작한 터치는 화면을 끌지 않는다 (끌리면 iOS가 탭을 버린다)
        className="mx-auto max-w-[480px] px-5 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-3 pointer-events-auto touch-none"
        style={{ background: "linear-gradient(to top, var(--bg) 70%, transparent)" }}
      >
        {children}
      </div>
    </div>
  );
}
