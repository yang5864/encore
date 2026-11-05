"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import type { ArtFrame } from "@/lib/art";

export function ArtFrames({ frames, visibleHeight, sizes, blink = false, onReady }: { frames: ArtFrame[]; visibleHeight: number; sizes: string; blink?: boolean; onReady?: () => void }) {
  const [loaded, setLoaded] = useState(0);
  const allLoaded = loaded === (1 << frames.length) - 1;
  const animated = frames.length === 2 && allLoaded;
  // 3프레임 이상은 JS로 순환 재생한다 (2프레임은 기존 CSS 교차 애니메이션)
  const multi = frames.length > 2;
  const [cur, setCur] = useState(0);
  useEffect(() => {
    if (!multi || !allLoaded) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setCur((n) => (n + 1) % frames.length), 420);
    return () => window.clearInterval(id);
  }, [multi, allLoaded, frames.length]);
  return frames.map((frame, i) => (
    <span key={frame.url} className={`art-frame ${multi ? (i === cur ? "art-frame-first" : "art-frame-next") : i ? "art-frame-next" : "art-frame-first"} ${animated ? "art-animated" : ""} ${blink ? "art-blink" : ""}`}
      style={{ width: `${visibleHeight / frame.height}%`, transform: `translate(${-frame.x * 100}%, ${-frame.y * 100}%)` } as CSSProperties}>
      <Image src={frame.url} alt="" fill sizes={sizes} className="object-contain" loading="eager" onLoad={() => { if (i === 0) onReady?.(); setLoaded((mask) => mask | (1 << i)); }} />
    </span>
  ));
}
