"use client";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { rankingFor } from "@/lib/game/brand-rank";
import { isSecondHalf, yearOf } from "@/lib/game/format";
import type { Career } from "@/lib/game/types";
import { cn } from "@/lib/cn";

/** 대시보드: 내 순위와 바로 아래(왼쪽)·위(오른쪽). 누르면 전체 순위로 이동. */
export function RankCard({ career }: { career: Career }) {
  const r = rankingFor(career, yearOf(career), isSecondHalf(career));
  const outsideLabel = r.source.kind === "real" ? "50위 밖" : `${r.total}위권 밖`;
  return (
    <Link href="/ranking" className="block">
      <Card className="fade-up press !p-4" style={{ animationDelay: "90ms" }}>
        <div className="flex items-center justify-between mb-3 gap-2">
          <p className="t-cap truncate">{r.source.kind === "real" ? "아이돌 브랜드평판 순위" : "아이돌 인기 순위"} <span className="text-ink-3">· {r.source.kind === "real" ? "실제 지수" : "게임 추정"}</span></p>
          <span className="text-[13px] text-ink-3 shrink-0">전체 보기 ›</span>
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <Neighbor entry={r.outside ? null : r.below} side="아래" />
          <div className="text-center px-2">
            <p className="text-[13px] text-ink-3">{r.outside ? "순위 밖" : "내 순위"}</p>
            <p className="text-[22px] font-extrabold tracking-[-0.02em] text-primary leading-tight whitespace-nowrap">{r.outside ? outsideLabel : `${r.me.rank}위`}</p>
            <p className="text-[13px] font-bold truncate max-w-[120px]">{r.me.name}</p>
          </div>
          <Neighbor entry={r.outside ? r.entries[r.total - 2] : r.above} side="위" align="right" />
        </div>
      </Card>
    </Link>
  );
}

function Neighbor({ entry, side, align = "left" }: { entry: { name: string; rank: number } | null | undefined; side: string; align?: "left" | "right" }) {
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
