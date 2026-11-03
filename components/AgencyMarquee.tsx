"use client";
import { useEffect, useRef } from "react";
import { Logo } from "@/components/Logo";
import { AGENCIES } from "@/lib/game/agencies";

/**
 * 기획사 로고가 왼쪽으로 천천히 흐르는 무한 스트립.
 * 손으로 밀면 그대로 따라가고, 손을 떼고 잠시 뒤 다시 흐른다. 동작 줄이기 설정이면 멈춰 있는 일반 스크롤.
 */
export function AgencyMarquee() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current!;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const SPEED = 22; // px/s
    let raf = 0;
    let last = performance.now();
    let pausedUntil = 0;
    let touching = false;
    const half = () => el.scrollWidth / 2;
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!touching && now >= pausedUntil) el.scrollLeft += SPEED * dt;
      // 같은 목록이 두 번 이어져 있어 절반을 지나면 처음으로 되돌려도 티가 나지 않는다
      if (el.scrollLeft >= half()) el.scrollLeft -= half();
      else if (el.scrollLeft < 0) el.scrollLeft += half();
      raf = requestAnimationFrame(tick);
    };
    const pause = () => { pausedUntil = performance.now() + 2500; };
    const down = () => { touching = true; };
    const up = () => { touching = false; pause(); };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("touchstart", down, { passive: true });
    el.addEventListener("touchend", up);
    el.addEventListener("wheel", pause, { passive: true });
    el.addEventListener("scroll", () => { if (touching) pause(); }, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      el.removeEventListener("touchstart", down);
      el.removeEventListener("touchend", up);
      el.removeEventListener("wheel", pause);
    };
  }, []);
  const items = [...AGENCIES, ...AGENCIES];
  return (
    <div ref={ref} className="mt-3 flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5" aria-label="지원할 수 있는 기획사">
      {items.map((a, i) => (
        <div key={`${a.id}-${i}`} className="shrink-0 flex flex-col items-center gap-1.5 w-16" aria-hidden={i >= AGENCIES.length}>
          <Logo id={a.logo} label={a.name} color={a.color} size={48} rounded="full" />
          <span className="text-[13px] text-ink-2 font-semibold truncate w-full text-center">{a.name}</span>
        </div>
      ))}
    </div>
  );
}
