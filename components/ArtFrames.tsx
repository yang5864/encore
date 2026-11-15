"use client";
import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import type { ArtFrame } from "@/lib/art";

/**
 * 모든 캐릭터가 같은 시계를 본다: 그룹 장면에서 멤버들이 같은 박자에 같은 동작을 한다.
 * 그림이 늦게 뜬 멤버도 시작 시점이 아니라 지금 시각을 기준으로 맞춰 들어온다.
 */
const STEP_MS = 420;
const listeners = new Set<() => void>();
let timer: number | null = null;
function subscribe(fn: () => void) {
  listeners.add(fn);
  if (timer === null && typeof window !== "undefined") timer = window.setInterval(() => listeners.forEach((l) => l()), STEP_MS / 2);
  return () => {
    listeners.delete(fn);
    if (!listeners.size && timer !== null) { window.clearInterval(timer); timer = null; }
  };
}
const tick = () => Math.floor(Date.now() / STEP_MS);
const reducedMotion = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function ArtFrames({ frames, visibleHeight, sizes, blink = false, onReady, offsetX, zIndex }: { frames: ArtFrame[]; visibleHeight: number; sizes: string; blink?: boolean; onReady?: () => void; offsetX?: number; zIndex?: number }) {
  const [loaded, setLoaded] = useState(0);
  const allLoaded = loaded === (1 << frames.length) - 1;
  const animated = frames.length === 2 && allLoaded;
  // 3프레임 이상은 공용 시계로 순환 재생한다 (2프레임은 CSS 교차 애니메이션을 같은 시각에 맞춘다)
  const multi = frames.length > 2;
  const clock = useSyncExternalStore(multi ? subscribe : noopSubscribe, tick, () => 0);
  const cur = multi && allLoaded && !reducedMotion() ? clock % frames.length : 0;
  // CSS 애니메이션은 붙은 순간부터 돈다: 시작 시각을 문서 시간 0에 맞춰 모든 캐릭터의 박자를 맞춘다
  const spans = useRef<(HTMLSpanElement | null)[]>([]);
  useEffect(() => {
    if (!animated) return;
    for (const el of spans.current) for (const a of el?.getAnimations() ?? []) a.startTime = 0;
  }, [animated, blink]);
  return frames.map((frame, i) => (
    <span key={frame.url} className={`art-frame ${multi ? (i === cur ? "art-frame-first" : "art-frame-next") : i ? "art-frame-next" : "art-frame-first"} ${animated ? "art-animated" : ""} ${blink ? "art-blink" : ""}`}
      style={{ width: `${visibleHeight / frame.height}%`, transform: `translate(${-frame.x * 100}%, ${-frame.y * 100}%)`,
        ...(offsetX !== undefined ? { "--art-x": `${offsetX}%` } : {}), ...(zIndex !== undefined ? { zIndex } : {}) } as CSSProperties} ref={(el) => { spans.current[i] = el; }}>
      <Image src={frame.url} alt="" fill sizes={sizes} className="object-contain" loading="eager" onLoad={() => { if (i === 0) onReady?.(); setLoaded((mask) => mask | (1 << i)); }} />
    </span>
  ));
}

function noopSubscribe() { return () => {}; }
