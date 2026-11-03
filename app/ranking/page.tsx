"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { rankChanges, rankingFor } from "@/lib/game/brand-rank";
import { isSecondHalf, periodLabel, yearOf } from "@/lib/game/format";
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
  const year = yearOf(career);
  const r = rankingFor(career, year, isSecondHalf(career));
  const list = r.entries;
  const changes = rankChanges(career, year, isSecondHalf(career), career.flags.prevPopularity);
  const real = r.source.kind === "real";
  return (
    <main className="shell pt-3">
      <header className="flex items-center h-12 gap-3">
        <Link href="/play" aria-label="뒤로" className="press w-10 h-10 rounded-xl bg-card flex items-center justify-center text-[22px]">‹</Link>
        <div>
          <h1 className="t-card">{real ? "아이돌 개인 브랜드평판" : `${year}년 아이돌 인기 순위`}</h1>
          <p className="text-[13px] text-ink-3">{periodLabel(career)} · {r.source.label}</p>
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
          ? `한국기업평판연구소(brikorea.com)가 발표한 그 달의 아이돌 개인 브랜드평판 순위와 브랜드평판지수예요.${r.source.kind === "real" && r.source.note ? ` ${r.source.note}.` : ""} 내 캐릭터는 인기도(0~100)를 그 달 지수 분포에 환산해 끼워 넣은 것이라 실제 측정값이 아니에요.`
          : "2018년 이전은 공개된 아이돌 개인 브랜드평판 자료가 없어, 당시 음반·음원·대중 인지도를 바탕으로 게임 안에서 만든 추정 지수예요. 2018년 하반기부터는 실제 브랜드평판 자료로 바뀌어요."}
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
