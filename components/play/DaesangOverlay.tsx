"use client";
import { EventArt } from "@/components/EventArt";
import { Button } from "@/components/ui/Button";
import { displayName } from "@/lib/game/format";
import type { Award, Career } from "@/lib/game/types";

/** 받침 유무로 조사를 고른다 */
const hasBatchim = (w: string) => { const c = w.charCodeAt(w.length - 1); return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 !== 0; };
const lastJong = (w: string) => { const c = w.charCodeAt(w.length - 1); return c >= 0xac00 && c <= 0xd7a3 ? (c - 0xac00) % 28 : 0; };
const ga = (w: string) => (hasBatchim(w) ? "이" : "가");
const ro = (w: string) => (hasBatchim(w) && lastJong(w) !== 8 ? "으로" : "로");

/** 연말 시상식 대상 전용 전체 화면 연출. 결과 시트보다 먼저 뜬다. */
export function DaesangOverlay({ career, award, onDone }: { career: Career; award: Award; onDone: () => void }) {
  const count = career.awards.filter((a) => a.kind === "daesang").length;
  const nth = count <= 1 ? "첫" : `${count}번째`;
  const latest = career.albums[career.albums.length - 1];
  const stats = [
    latest ? `초동 ${latest.sales >= 10000 ? `${Math.round(latest.sales / 10000)}만` : latest.sales.toLocaleString("ko-KR")}장` : null,
    career.musicWins ? `음방 1위 ${career.musicWins}회` : null,
    career.peakMelon === 1 ? "멜론 1위" : career.peakMelon ? `멜론 최고 ${career.peakMelon}위` : null,
  ].filter(Boolean);
  return (
    <div className="fixed inset-0 z-[70] bg-[#111113] text-white flex flex-col" role="dialog" aria-label="대상 수상">
      <div className="shell flex-1 flex flex-col pt-3">
        <div className="flex justify-end h-12 items-center">
          <button type="button" onClick={onDone} className="press text-[16px] text-white/50 px-2 py-1">건너뛰기</button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center pb-10">
          <div className="w-full max-w-[400px] fade-up">
            <EventArt scene="awards" avatar={career.avatar} gender={career.gender} name={career.name} className="rounded-2xl" />
          </div>
          <span className="fade-up mt-8 inline-block rounded-full bg-[#3a2b0f] text-[#f5b942] text-[13px] font-bold px-4 py-2" style={{ animationDelay: "120ms" }}>
            {award.year} {award.show}
          </span>
          <h2 className="fade-up mt-4 text-[32px] leading-[1.25] font-extrabold tracking-[-0.02em]" style={{ animationDelay: "200ms" }}>
            {nth} 대상을
            <br />
            받았어요
          </h2>
          <p className="fade-up mt-5 text-[16px] text-white/60" style={{ animationDelay: "280ms" }}>
            {(() => { const who = displayName(career); const what = award.name.replace(/\s*\(대상\)$/, ""); return `${who}${ga(who)} ${what}${ro(what)} 뽑혔어요`; })()}
          </p>
          {stats.length > 0 && (
            <span className="fade-up mt-5 inline-block rounded-2xl bg-white/[0.06] text-[16px] text-white/85 px-5 py-3" style={{ animationDelay: "360ms" }}>
              {stats.join(" · ")}
            </span>
          )}
        </div>
        <div className="pb-[calc(env(safe-area-inset-bottom)+16px)]">
          <Button onClick={onDone}>확인</Button>
        </div>
      </div>
    </div>
  );
}
