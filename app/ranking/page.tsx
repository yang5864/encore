"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/Avatar";
import { rankWithMe } from "@/lib/game/brand-rank";
import { periodLabel, yearOf } from "@/lib/game/format";
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
  const list = rankWithMe(career, year);
  return (
    <main className="shell pt-3">
      <header className="flex items-center h-12 gap-3">
        <Link href="/play" aria-label="뒤로" className="press w-10 h-10 rounded-xl bg-card flex items-center justify-center text-[22px]">‹</Link>
        <div>
          <h1 className="t-card">{year}년 아이돌 인기 순위</h1>
          <p className="text-[13px] text-ink-3">{periodLabel(career)} 기준 · 게임 추정 지수</p>
        </div>
      </header>
      <Card className="mt-4 !p-2">
        {list.map((e, i) => (
          <div key={`${e.name}-${i}`} className={cn("flex items-center gap-3 px-3 py-3 rounded-2xl", e.me && "bg-primary-soft/60")}>
            <span className={cn("w-7 text-center font-extrabold text-[16px]", e.rank <= 3 ? "text-warn" : e.me ? "text-primary" : "text-ink-3")}>{e.rank}</span>
            {e.me ? (
              <div className="w-9 h-11 rounded-lg bg-chip flex items-end justify-center overflow-hidden">
                <Avatar index={career.avatar} size={30} name={career.name} />
              </div>
            ) : (
              <span className="w-9 h-9 rounded-lg bg-chip flex items-center justify-center text-[13px] font-bold text-ink-3">{e.name.slice(0, 2)}</span>
            )}
            <div className="min-w-0 flex-1">
              <p className={cn("text-[16px] font-bold truncate", e.me && "text-primary")}>{e.name}{e.me ? " (나)" : ""}</p>
            </div>
            <span className="text-[16px] font-bold tabular-nums">{e.index}</span>
          </div>
        ))}
      </Card>
      <p className="mt-4 text-[13px] text-ink-3 leading-relaxed pb-6">
        이 순위는 당시 음반·음원·대중 인지도를 바탕으로 게임 안에서 만든 추정 지수예요. 실제 브랜드평판 지수나 공식 순위가 아니며, 내 캐릭터의 인기도(0~100)를 같은 자리에 넣어 비교해요.
      </p>
    </main>
  );
}
