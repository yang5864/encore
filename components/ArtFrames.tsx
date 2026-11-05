"use client";
import Image from "next/image";
import { useState } from "react";
import type { CSSProperties } from "react";
import type { ArtFrame } from "@/lib/art";

export function ArtFrames({ frames, visibleHeight, sizes, blink = false, onReady }: { frames: ArtFrame[]; visibleHeight: number; sizes: string; blink?: boolean; onReady?: () => void }) {
  const [loaded, setLoaded] = useState(0);
  const animated = frames.length > 1 && loaded === 3;
  return frames.map((frame, i) => (
    <span key={frame.url} className={`art-frame ${i ? "art-frame-next" : "art-frame-first"} ${animated ? "art-animated" : ""} ${blink ? "art-blink" : ""}`}
      style={{ width: `${visibleHeight / frame.height}%`, transform: `translate(${-frame.x * 100}%, ${-frame.y * 100}%)` } as CSSProperties}>
      <Image src={frame.url} alt="" fill sizes={sizes} className="object-contain" loading="eager" onLoad={() => { if (i === 0) onReady?.(); setLoaded((mask) => mask | (1 << i)); }} />
    </span>
  ));
}
