"use client";
import { useMemo, useState } from "react";
import { EventArt } from "@/components/EventArt";
import { Button } from "@/components/ui/Button";
import { agencyById } from "@/lib/game/agencies";
import { lineupRoles } from "@/lib/game/debut";
import { artGroupFor, displayName, fanText, koreanAge } from "@/lib/game/format";
import type { Career } from "@/lib/game/types";

type Slide = { chip: string; title: string; text: string; scene: string; mood?: "sad" | "happy"; group?: boolean };

/** 은퇴 직후 한 번 보여주는 스토리형 회고. 탭해서 넘긴다. */
export function RecapOverlay({ career, onDone }: { career: Career; onDone: () => void }) {
  const slides = useMemo<Slide[]>(() => {
    const out: Slide[] = [];
    const a = agencyById(career.agencyId);
    out.push({ chip: "시작", title: `${koreanAge({ turn: 0 })}살, 무소속 지망생`, text: "아무것도 없던 시작이었어요. 꿈 하나만 들고 오디션장 문을 열었어요.", scene: "audition" });
    if (career.debutTurn !== null) {
      const roles = career.lineup ? [`${career.lineup.members}인조`, ...lineupRoles(career.lineup)].join(" · ") : "";
      out.push({
        chip: "데뷔",
        title: `${koreanAge({ turn: career.debutTurn })}살, ${career.groupName || career.name} 데뷔`,
        text: `${a ? `${a.name}에서 ` : ""}첫 무대에 올랐어요.${roles ? ` ${roles}` : ""}`,
        scene: "debut",
        group: true,
      });
    }
    const daesang = career.awards.filter((x) => x.kind === "daesang").length;
    out.push({
      chip: "전성기",
      title: career.flags.bestRank ? `브랜드평판 최고 ${career.flags.bestRank}위` : "묵묵히 걸어온 길",
      text: `음방 1위 ${career.musicWins}회 · 대상 ${daesang}회 · 최다 팬 ${fanText(Math.max(career.fans, ...(career.timeline ?? []).map((t) => t.fans)))}`,
      scene: "awards",
      mood: "happy",
      group: true,
    });
    const moments = career.history.filter((h) => h.kind === "award" || h.kind === "milestone");
    const picked = moments.length <= 4 ? moments : [0, 1, 2, 3].map((k) => moments[Math.round((k * (moments.length - 1)) / 3)]);
    if (picked.length) {
      out.push({ chip: "가장 빛난 순간", title: picked.map((h) => h.title).join("\n"), text: `${picked.length}번의 순간이 이야기를 만들었어요.`, scene: "tour", group: true });
    }
    out.push({ chip: career.ending?.subtitle ?? "커리어 완성", title: career.ending?.title ?? "은퇴", text: career.ending?.text ?? `${displayName(career)}의 이야기가 여기서 마무리돼요.`, scene: "retirement" });
    return out;
  }, [career]);
  const [i, setI] = useState(0);
  const s = slides[i];
  const last = i === slides.length - 1;
  return (
    <div className="fixed inset-0 z-[70] bg-[#111113] text-white flex flex-col" role="dialog" aria-label="커리어 회고">
      <div className="shell w-full flex-1 flex flex-col pt-3 overflow-y-auto no-scrollbar">
        <div className="flex gap-1 pt-2" aria-hidden>
          {slides.map((_, k) => (
            <span key={k} className={`h-[3px] flex-1 rounded-full ${k <= i ? "bg-white" : "bg-white/20"}`} />
          ))}
        </div>
        <div className="flex justify-end h-12 items-center">
          <button type="button" onClick={onDone} className="press text-[16px] text-white/50 px-2 py-1">건너뛰기</button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center pb-6">
          <div className="w-full max-w-[400px] aspect-[3/2] rounded-2xl overflow-hidden bg-black/40">
            <EventArt scene={s.scene} avatar={career.avatar} gender={career.gender} name={career.name} mood={s.mood} group={s.group ? artGroupFor(career.lineup, s.scene.startsWith("awards") ? "awards" : s.scene) : undefined} />
          </div>
          <div key={i} className="min-h-[200px]">
            <span className="fade-up mt-8 inline-block rounded-full bg-[#3a2b0f] text-[#f5b942] text-[13px] font-bold px-4 py-2">{s.chip}</span>
            <h2 className="fade-up mt-4 text-[22px] leading-[1.3] font-extrabold tracking-[-0.02em] whitespace-pre-line">{s.title}</h2>
            <p className="fade-up mt-3 text-[16px] text-white/60 leading-relaxed">{s.text}</p>
          </div>
        </div>
        <div className="pb-[calc(env(safe-area-inset-bottom)+16px)]">
          <Button onClick={() => (last ? onDone() : setI((n) => n + 1))}>{last ? "기록 보기" : "다음"}</Button>
        </div>
      </div>
    </div>
  );
}
