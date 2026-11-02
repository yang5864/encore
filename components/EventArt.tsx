"use client";
import Image from "next/image";
import type { CSSProperties } from "react";
import { eventArt } from "@/lib/art";
import { ArtFrames } from "./ArtFrames";

export function EventArt({ scene, avatar, gender, name = "캐릭터", className = "" }: {
  scene: string; avatar: number; gender?: "female" | "male"; name?: string; className?: string;
}) {
  const art = eventArt(scene, avatar, gender);
  // The audition background has a foreground judging desk; keep feet on the floor behind it.
  const audition = art.scene === "audition";
  return (
    <div role="img" aria-label={`${name}의 이벤트 장면`} className={`event-art ${className}`} data-scene={art.scene} style={{ "--art-foot-y": audition ? "70%" : "86%" } as CSSProperties}>
      <Image src={art.background} alt="" fill sizes="(max-width: 480px) 100vw, 480px" className="object-cover" loading="eager" />
      <ArtFrames key={`${art.scene}:${avatar}`} frames={art.frames} visibleHeight={audition ? 33 : 43} sizes="(max-width: 480px) 65vw, 310px" />
    </div>
  );
}
