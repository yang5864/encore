"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { eventArt } from "@/lib/art";
import type { ArtMood } from "@/lib/art";
import { ArtFrames } from "./ArtFrames";

export type { ArtMood };
export type ArtGroup = { avatars: number[]; center: boolean };

export function EventArt({ scene, avatar, gender, name = "캐릭터", className = "", mood, group }: {
  scene: string; avatar: number; gender?: "female" | "male"; name?: string; className?: string;
  /** 나쁜 결과·논란이면 "sad": 표정 프레임이 있으면 바꿔 끼우고, 장면 전용 동작이 있으면 뱃지로 보여준다 */
  mood?: ArtMood;
  /** 무대·공식 행사에서 같이 서는 멤버들. center면 내가 가운데 */
  group?: ArtGroup;
}) {
  const art = eventArt(scene, avatar, gender, mood);
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
  // 그룹 배치: 나 + 멤버를 무대 바닥에 나란히. 슬롯 i의 중심은 (i + 0.5) / N
  const groupAvatars = group && group.avatars.length >= 1 ? group.avatars : null;
  const total = groupAvatars ? groupAvatars.length + 1 : 1;
  const playerSlot = group?.center ? Math.ceil(total / 2) - 1 : Math.floor(total / 3);
  const groupHeight = Math.min(audition ? 33 : 43, (audition ? 33 : 43) * 3 / total);
  const slotX = (i: number) => ((i + 0.5) / total) * 100;
  // 멤버 목록에서 내 자리를 건너뛰고 채운다
  const memberAt = (i: number) => (i < playerSlot ? i : i - 1);
  return (
    <div role="img" aria-label={`${name}의 이벤트 장면`} className={`event-art ${className}`} data-scene={art.scene} style={{ "--art-foot-y": audition ? "70%" : "86%", opacity: ready ? 1 : 0, ...(mood === "sad" || mood === "happy" ? { filter: mood === "sad" ? "saturate(0.85) brightness(0.95)" : undefined } : {}) } as CSSProperties}>
      <Image src={art.background} alt="" fill sizes="(max-width: 480px) 100vw, 480px" className="object-cover" loading="eager" priority onLoad={() => setBg(true)} />
      {groupAvatars ? (
        <>
          {Array.from({ length: total }, (_, i) => i).filter((i) => i !== playerSlot).map((i) => { const m = groupAvatars[memberAt(i)]; return (
            <ArtFrames key={`m${i}:${art.scene}:${m}`} frames={eventArt(art.scene, m, gender, mood).frames} visibleHeight={groupHeight} sizes="(max-width: 480px) 40vw, 200px" offsetX={slotX(i)} zIndex={1} />
          ); })}
        </>
      ) : null}
      <ArtFrames key={`${art.scene}:${avatar}`} frames={art.frames} visibleHeight={groupAvatars ? groupHeight * 1.06 : audition ? 33 : 43} sizes="(max-width: 480px) 65vw, 310px" onReady={() => setFg(true)}
        {...(groupAvatars ? { offsetX: slotX(playerSlot), zIndex: 2 } : {})} />
      {!art.moodApplied && (mood === "sad" || mood === "happy") ? (
        <span className={`art-mood-badge art-mood-${mood}`} aria-hidden style={{ left: groupAvatars ? `calc(${slotX(playerSlot)}% - 6%)` : undefined }}>{mood === "sad" ? "💧" : "✨"}</span>
      ) : null}
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
