"use client";
import { useEffect, useState } from "react";
import { BackButton } from "@/components/ui/BackButton";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { rankChanges, rankingFor } from "@/lib/game/brand-rank";
import { isSecondHalf, MAX_TURN, periodLabel, yearOf } from "@/lib/game/format";
import type { Career } from "@/lib/game/types";
import { loadCareer } from "@/lib/storage";
import { cn } from "@/lib/cn";

export default function RankingPage() {
  const router = useRouter();
  const [career, setCareer] = useState<Career | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setCareer(loadCareer());
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready && !career) router.replace("/");
  }, [ready, career, router]);
  if (!career) return <main className="shell" />;
  // 은퇴한 커리어는 마지막 시즌 기준으로 본다
  const shown = career.turn > MAX_TURN ? { ...career, turn: MAX_TURN } : career;
  const year = yearOf(shown);
  const r = rankingFor(shown, year, isSecondHalf(shown));
  const list = r.entries;
  const changes = rankChanges(shown, year, isSecondHalf(shown), career.flags.prevPopularity);
  const real = r.source.kind === "real";
  return (
    <main className="shell pt-3">
      <header className="flex items-start gap-3 min-h-12 py-1">
        <BackButton href="/play" />
        <div className="min-w-0 pt-1.5">
          <h1 className="t-card">{real ? "아이돌 개인 브랜드평판" : `${year}년 아이돌 인기 순위`}</h1>
          <p className="text-[13px] text-ink-3 leading-snug">{periodLabel(shown)} 기준 · {r.source.kind === "real" ? `${r.source.label.split(" 아이돌 개인")[0]} 자료 · 한국기업평판연구소` : "게임 추정"}</p>
        </div>
      </header>
      <Card className="mt-4 !p-2">
        {list.map((e, i) => (
          <div key={`${e.name}-${i}`} className={cn("flex items-center gap-3 px-3 py-3 rounded-2xl", e.me && "bg-primary-soft/60")}>
            <span className={cn("w-7 text-center font-extrabold text-[16px]", e.rank <= 3 ? "text-warn" : e.me ? "text-primary" : "text-ink-3")}>{e.rank}</span>
            <RankDelta value={changes.has(e.me ? "@me" : e.name) ? changes.get(e.me ? "@me" : e.name)! : undefined} />
            <div className="min-w-0 flex-1">
              <p className={cn("text-[16px] font-bold truncate", e.me && "text-primary")}>{e.name}{e.me ? " (나)" : ""}</p>
            </div>
            <span className="text-[16px] font-bold tabular-nums">{real ? (e.index >= 10000 ? `${Math.round(e.index / 10000).toLocaleString("ko-KR")}만` : e.index.toLocaleString("ko-KR")) : e.index}</span>
          </div>
        ))}
      </Card>
      <p className="mt-4 text-[13px] text-ink-3 leading-relaxed pb-6">
        {real
          ? `한국기업평판연구소(brikorea.com)가 발표한 그 달의 아이돌 개인 브랜드평판이에요.${r.source.kind === "real" && r.source.note ? ` ${r.source.note}.` : ""} 내 캐릭터의 지수는 팬덤 참여·미디어 노출·SNS·화제성을 같은 방식으로 합산한 게임 추정값이라 실제 측정치가 아니에요. 컴백·1위·수상·논란이 있던 시즌에 튀고, 조용한 시즌엔 내려앉아요.`
          : "2018년 이전은 공개 자료가 없어 당시 음반·음원·인지도를 바탕으로 만든 게임 추정 지수예요. 2018년 하반기부터 실제 자료로 바뀌어요."}
      </p>
    </main>
  );
}

/** 순위 변동: 상승은 빨강 ▲, 하락은 파랑 ▼, 유지는 –, 새로 진입은 NEW. 비교 자료가 없으면 빈칸. */
function RankDelta({ value }: { value: number | null | undefined }) {
  const base = "w-11 shrink-0 text-center text-[13px] font-bold tabular-nums";
  if (value === undefined) return <span className={base} />;
  if (value === null) return <span className={cn(base, "text-up")}>NEW</span>;
  if (value === 0) return <span className={cn(base, "text-ink-3")}>–</span>;
  return <span className={cn(base, value > 0 ? "text-up" : "text-down")}>{value > 0 ? "▲" : "▼"}{Math.abs(value)}</span>;
}
