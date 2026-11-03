"use client";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { rankNeighbors } from "@/lib/game/brand-rank";
import { yearOf } from "@/lib/game/format";
import type { Career } from "@/lib/game/types";
import { cn } from "@/lib/cn";

/** 대시보드: 내 순위와 바로 아래(왼쪽)·위(오른쪽)의 실제 그룹. 누르면 전체 순위로 이동. */
export function RankCard({ career }: { career: Career }) {
  const year = yearOf(career);
  const { me, above, below, total } = rankNeighbors(career, year);
  const outside = me.rank === total && me.index < 20;
  return (
    <Link href="/ranking" className="block">
      <Card className="fade-up press !p-4" style={{ animationDelay: "90ms" }}>
        <div className="flex items-center justify-between mb-3">
          <p className="t-cap">{year}년 아이돌 인기 순위 <span className="text-ink-3">· 게임 추정</span></p>
          <span className="text-[13px] text-ink-3">전체 보기 ›</span>
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <Neighbor entry={below} side="아래" />
          <div className="text-center px-3">
            <p className="text-[13px] text-ink-3">{outside ? "순위 밖" : "내 순위"}</p>
            <p className="text-[22px] font-extrabold tracking-[-0.02em] text-primary leading-tight">{outside ? `${total}위권 밖` : `${me.rank}위`}</p>
            <p className="text-[13px] font-bold truncate max-w-[120px]">{me.name}</p>
          </div>
          <Neighbor entry={above} side="위" align="right" />
        </div>
      </Card>
    </Link>
  );
}

function Neighbor({ entry, side, align = "left" }: { entry: { name: string; rank: number; index: number } | null; side: string; align?: "left" | "right" }) {
  return (
    <div className={cn("min-w-0 rounded-xl bg-sub p-2.5", align === "right" && "text-right")}>
      {entry ? (
        <>
          <p className="text-[13px] text-ink-3">한 순위 {side}</p>
          <p className="text-[13px] font-bold truncate">
            <span className="text-ink-2">{entry.rank}위</span> {entry.name}
          </p>
        </>
      ) : (
        <p className="text-[13px] text-ink-3">{side === "위" ? "1위예요" : "맨 아래예요"}</p>
      )}
    </div>
  );
}
