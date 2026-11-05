"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { eventArt } from "@/lib/art";
import { ArtFrames } from "./ArtFrames";

export function EventArt({ scene, avatar, gender, name = "캐릭터", className = "" }: {
  scene: string; avatar: number; gender?: "female" | "male"; name?: string; className?: string;
}) {
  const art = eventArt(scene, avatar, gender);
  // The audition background has a foreground judging desk; keep feet on the floor behind it.
  const audition = art.scene === "audition";
  // 배경과 캐릭터가 따로 뜨지 않도록, 둘 다 준비될 때까지 숨겼다가 한 번에 보여준다 (최대 1.5초 대기)
  const [bg, setBg] = useState(false);
  const [fg, setFg] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    setBg(false); setFg(false); setTimedOut(false);
    const t = window.setTimeout(() => setTimedOut(true), 1500);
    return () => window.clearTimeout(t);
  }, [art.scene, art.background, avatar]);
  const ready = (bg && fg) || timedOut;
  return (
    <div role="img" aria-label={`${name}의 이벤트 장면`} className={`event-art ${className}`} data-scene={art.scene} style={{ "--art-foot-y": audition ? "70%" : "86%", opacity: ready ? 1 : 0, transition: "opacity 180ms ease-out" } as CSSProperties}>
      <Image src={art.background} alt="" fill sizes="(max-width: 480px) 100vw, 480px" className="object-cover" loading="eager" priority onLoad={() => setBg(true)} />
      <ArtFrames key={`${art.scene}:${avatar}`} frames={art.frames} visibleHeight={audition ? 33 : 43} sizes="(max-width: 480px) 65vw, 310px" onReady={() => setFg(true)} />
    </div>
  );
}

/** 곧 보일 장면의 이미지를 화면 밖에서 미리 받아 둔다. 시트가 열릴 때 배경·캐릭터가 바로 뜬다. */
export function PrefetchArt({ scenes, avatar, gender }: { scenes: string[]; avatar: number; gender?: "female" | "male" }) {
  const unique = [...new Set(scenes.filter(Boolean))];
  if (!unique.length) return null;
  return (
    <div aria-hidden style={{ position: "fixed", left: -9999, top: 0, width: 480, height: 360, opacity: 0, pointerEvents: "none", overflow: "hidden" }}>
      {unique.map((s) => (
        <div key={s} className="event-art" style={{ position: "absolute", inset: 0 }}>
          <EventArt scene={s} avatar={avatar} gender={gender} />
        </div>
      ))}
    </div>
  );
}
