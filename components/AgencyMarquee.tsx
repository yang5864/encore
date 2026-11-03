"use client";
import { useEffect, useRef } from "react";
import { Logo } from "@/components/Logo";
import { AGENCIES } from "@/lib/game/agencies";

const BASE = 22; // 기본 속도 px/s (왼쪽으로)

/**
 * 기획사 로고가 왼쪽으로 천천히 흐르는 무한 스트립.
 * scrollLeft 대신 transform으로 움직인다: iOS 사파리는 scrollLeft를 정수로 반올림해 프레임당 0.3px 이동이 사라진다.
 * 손으로 밀면 그 속도를 이어받고, 손을 떼면 서서히 기본 속도로 돌아온다. 잡고 있는 동안만 멈춘다.
 */
export function AgencyMarquee() {
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const vp = viewport.current!;
    const tr = track.current!;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      vp.style.overflowX = "auto";
      return;
    }
    let pos = 0; // 왼쪽으로 밀린 거리
    let v = BASE;
    let dragging = false;
    let lastX = 0;
    let lastT = 0;
    let raf = 0;
    let last = performance.now();
    const half = () => (tr.scrollWidth + 8) / 2; // 묶음 사이 gap-2(8px)까지 더해야 한 바퀴 길이가 정확하다
    const render = () => {
      const h = half();
      if (h > 0) pos = ((pos % h) + h) % h;
      tr.style.transform = `translate3d(${-pos}px,0,0)`;
    };
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!dragging) {
        // 기본 속도로 지수적으로 복귀: 빠르면 서서히 느려지고, 느리거나 거꾸로면 다시 빨라진다
        v += (BASE - v) * (1 - Math.exp(-dt * 1.4));
        pos += v * dt;
      }
      render();
      raf = requestAnimationFrame(tick);
    };
    const down = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastT = performance.now();
      v = 0;
      vp.setPointerCapture?.(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      const now = performance.now();
      const dx = e.clientX - lastX;
      const dt = Math.max(0.001, (now - lastT) / 1000);
      pos -= dx;
      v = v * 0.5 + (-dx / dt) * 0.5; // 손가락 속도를 부드럽게 따라간다
      lastX = e.clientX;
      lastT = now;
      render();
    };
    const up = () => {
      if (!dragging) return;
      dragging = false;
      // 손을 뗀 뒤 100ms 넘게 멈춰 있었으면 속도 0에서 다시 출발
      if (performance.now() - lastT > 100) v = 0;
      v = Math.max(-600, Math.min(600, v));
    };
    const wheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      pos += e.deltaX;
      v += e.deltaX * 2;
      render();
    };
    vp.addEventListener("pointerdown", down);
    vp.addEventListener("pointermove", move);
    vp.addEventListener("pointerup", up);
    vp.addEventListener("pointercancel", up);
    vp.addEventListener("pointerleave", up);
    vp.addEventListener("wheel", wheel, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      vp.removeEventListener("pointerdown", down);
      vp.removeEventListener("pointermove", move);
      vp.removeEventListener("pointerup", up);
      vp.removeEventListener("pointercancel", up);
      vp.removeEventListener("pointerleave", up);
      vp.removeEventListener("wheel", wheel);
    };
  }, []);
  const items = [...AGENCIES, ...AGENCIES];
  return (
    <div ref={viewport} className="mt-3 overflow-hidden -mx-5 px-5 select-none cursor-grab active:cursor-grabbing" style={{ touchAction: "pan-y" }} aria-label="지원할 수 있는 기획사">
      <div ref={track} className="flex gap-2 w-max will-change-transform">
        {items.map((a, i) => (
          <div key={`${a.id}-${i}`} className="shrink-0 flex flex-col items-center gap-1.5 w-16" aria-hidden={i >= AGENCIES.length}>
            <Logo id={a.logo} label={a.name} color={a.color} size={48} rounded="full" />
            <span className="text-[13px] text-ink-2 font-semibold truncate w-full text-center">{a.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
