"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { cn } from "@/lib/cn";
import { STAT_NAMES } from "@/lib/game/stats";
import { ARTS_MAJORS, ARTS_PASS, artsNeeded, artsTotal, majorAbility, type ArtsMajor } from "@/lib/game/school";
import type { ActiveEvent, Career } from "@/lib/game/types";
import { RhythmStage } from "./rhythm/RhythmStage";
import { createAudio } from "./rhythm/music";
import { makeChart, BPM, SONG_LENGTH } from "@/lib/game/rhythm";

/**
 * 예술고 실기 오디션: 전공을 고르고 리듬 게임 실기(RhythmStage)를 한 번 본다.
 * 정확도(0~100)가 실기 점수가 된다. 규칙은 lib/game/rhythm.ts.
 */
export function ArtsAudition({ career, event, onChoose }: { career: Career; event: ActiveEvent; onChoose: (choiceId: string, extra?: { score?: number }) => void }) {
  const [major, setMajor] = useState<ArtsMajor | null>(null);
  const [phase, setPhase] = useState<"pick" | "ready" | "play" | "done">("pick");
  const [score, setScore] = useState(0);
  // 시작 버튼을 누를 때 만든 오디오 (iOS는 탭 안에서 만들어야 소리가 난다)
  const [audio, setAudio] = useState<AudioContext | null>(null);
  const seed = career.seed + career.turn * 31;

  const need = major ? artsNeeded(career, major) : 0;
  const total = major ? artsTotal(career, major, score) : 0;

  return (
    <div className="fixed inset-0 z-[70] bg-bg flex flex-col" role="dialog" aria-modal="true" aria-label="예술고 실기 오디션">
      <div className="mx-auto w-full max-w-[480px] flex-1 min-h-0 flex flex-col px-5 pt-[calc(env(safe-area-inset-top)+16px)]">
        {phase === "pick" && (
          <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar pb-4">
            <h2 className="t-title">{event.title}</h2>
            <p className="t-body text-ink-2 mt-2">전공 능력과 실기 점수를 반씩 더해 {ARTS_PASS}점을 넘으면 합격이에요. 실기는 한 번만 볼 수 있어요.</p>
            <div className="flex flex-col gap-2 mt-5">
              {ARTS_MAJORS.map((m) => {
                const on = major?.id === m.id;
                const n = artsNeeded(career, m);
                return (
                  <button key={m.id} aria-pressed={on} onClick={() => setMajor(m)} className={cn("press w-full text-left rounded-2xl border-2 p-4", on ? "border-primary bg-primary-soft/50" : "border-transparent bg-card")}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="t-body font-bold">{m.name}</span>
                      <Chip tone={n <= 55 ? "ok" : n <= 75 ? "warn" : "danger"}>실기 {n}점 필요</Chip>
                    </div>
                    <p className="text-[13px] text-ink-2 mt-1">{m.description}</p>
                    <p className="text-[13px] text-ink-3 mt-1.5 tabular-nums">{m.stats.map((k) => `${STAT_NAMES[k]} ${career.stats[k]}`).join(" · ")} → 전공 능력 {Math.round(majorAbility(career, m))}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {phase === "ready" && major && (
          <div className="flex-1 flex flex-col justify-center">
            <p className="t-cap text-primary">{major.name} 실기</p>
            <h2 className="t-title mt-1">박자에 맞춰 눌러요</h2>
            <p className="t-body text-ink-2 mt-3">반주에 맞춰 노트가 내려와요. 노트가 아래 선에 닿는 순간 같은 줄의 버튼을 누르면, 내 캐릭터가 무대에서 그 박자에 맞춰 춤춰요. {BPM}BPM, 노트 {makeChart(seed).length}개, {Math.round(SONG_LENGTH / 1000)}초예요. 소리를 켜면 더 쉬워요.</p>
            <ul className="mt-5 rounded-2xl bg-card p-4 flex flex-col gap-1.5 text-[13px] text-ink-2">
              <li>· 선에 딱 맞추면 완벽, 조금 어긋나면 좋아요, 지나가면 놓침이에요.</li>
              <li>· 노트가 없을 때 누르면 점수가 깎여요.</li>
              <li>· 합격하려면 <b className="text-ink">{need}점</b> 이상이 필요해요.</li>
              <li>· 키보드는 ← ↓ → 또는 A S D.</li>
            </ul>
          </div>
        )}

        {phase === "play" && major && (
          <RhythmStage
            avatar={career.avatar}
            gender={career.gender}
            seed={seed}
            label={`${major.name} 실기`}
            audio={audio}
            onFinish={(sc) => { setScore(sc); setPhase("done"); setAudio(null); }}
          />
        )}

        {phase === "done" && major && (
          <div className="flex-1 flex flex-col justify-center">
            <p className="t-cap">{major.name} 실기 점수</p>
            <p className="t-num mt-1 text-[44px]">{score}<span className="text-[16px] font-bold text-ink-3 ml-1">점</span></p>
            <div className="mt-5 rounded-2xl bg-card p-4 flex flex-col gap-2 text-[13px] tabular-nums">
              <div className="flex justify-between"><span className="text-ink-2">전공 능력</span><span className="font-bold">{Math.round(majorAbility(career, major))}</span></div>
              <div className="flex justify-between"><span className="text-ink-2">실기 점수</span><span className="font-bold">{score}</span></div>
              <div className="flex justify-between border-t border-line pt-2"><span className="text-ink-2">총점 (합격선 {ARTS_PASS})</span><span className={cn("font-bold", total >= ARTS_PASS ? "text-up" : "text-down")}>{total}</span></div>
            </div>
            <p className="t-body text-ink-2 mt-4">{total >= ARTS_PASS ? "합격선을 넘었어요. 결과를 확인해요." : "합격선에 못 미쳤어요. 결과를 확인하고 다른 길을 골라요."}</p>
          </div>
        )}
      </div>

      {phase !== "play" && (
        <div className="shrink-0 mx-auto w-full max-w-[480px] px-5 pt-2 pb-[calc(env(safe-area-inset-bottom)+16px)] border-t border-line bg-bg">
          {phase === "pick" && <Button disabled={!major} onClick={() => setPhase("ready")}>{major ? `${major.name} 실기 보러 가기` : "전공을 골라주세요"}</Button>}
          {phase === "ready" && major && (
            <>
              <Button onClick={() => { setAudio(createAudio()); setPhase("play"); }}>실기 시작</Button>
              <Button variant="ghost" className="mt-2" onClick={() => onChoose(major.id)}>실기 건너뛰기 (그날 컨디션에 맡겨요)</Button>
            </>
          )}
          {phase === "done" && major && <Button onClick={() => onChoose(major.id, { score })}>결과 확인하기</Button>}
        </div>
      )}
    </div>
  );
}
