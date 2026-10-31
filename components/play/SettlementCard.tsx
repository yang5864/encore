"use client";
import { Card, CardTitle } from "@/components/ui/Card";
import { CountUp } from "@/components/ui/CountUp";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { settlement } from "@/lib/game/economy";
import { wonText } from "@/lib/game/format";
import type { Career } from "@/lib/game/types";

export function SettlementCard({ career }: { career: Career }) {
  const s = settlement(career);
  const recovered = s.invested > 0 ? Math.min(100, (Math.min(s.revenue, s.invested) / s.invested) * 100) : 100;
  return (
    <Card className="fade-up" style={{ animationDelay: "120ms" }}>
      <CardTitle sub={s.unrecovered > 0 ? "투자비를 회수한 뒤부터 정산돼요" : `순이익의 ${Math.round(s.share * 100)}% 중 내 몫`}>정산 현황</CardTitle>
      <div className="flex items-end justify-between">
        <div>
          <p className="t-cap">내 정산금</p>
          <CountUp value={s.mine} format={wonText} className="t-num" />
        </div>
        <div className="text-right">
          <p className="t-cap">누적 매출</p>
          <p className="t-num-md">{wonText(s.revenue)}</p>
        </div>
      </div>
      <div className="mt-4">
        <div className="flex justify-between text-[13px] font-semibold text-ink-2 mb-1.5">
          <span>제작비 회수</span>
          <span>{s.unrecovered > 0 ? `${wonText(s.unrecovered)} 남음` : "회수 완료"}</span>
        </div>
        <ProgressBar value={recovered} color={s.unrecovered > 0 ? "var(--warn)" : "var(--ok)"} height={8} label="제작비 회수" />
      </div>
    </Card>
  );
}
