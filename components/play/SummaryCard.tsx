"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { rankChanges, rankingFor } from "@/lib/game/brand-rank";
import { settlement } from "@/lib/game/economy";
import { isSecondHalf, wonText, yearOf } from "@/lib/game/format";
import { boughtThisSeason, shopOffers, walletOf } from "@/lib/game/shop";
import type { Career } from "@/lib/game/types";
import { cn } from "@/lib/cn";

/** 홈 요약: 순위 · 정산 · 상점을 한 줄씩. 누르면 자세히 보기. 홈에는 지금 결정에 필요한 것만 남긴다. */
export function SummaryCard({ career, onSettlement, onShop }: { career: Career; onSettlement: () => void; onShop: () => void }) {
  const r = rankingFor(career, yearOf(career), isSecondHalf(career));
  const delta = rankChanges(career, yearOf(career), isSecondHalf(career), career.flags.prevPopularity).get("@me");
  const s = settlement(career);
  const wallet = walletOf(career);
  const offers = shopOffers(career);
  const bought = boughtThisSeason(career);
  const rankValue = r.outside ? (r.source.kind === "real" ? "50위 밖" : "순위 밖") : `${r.me.rank}위`;
  return (
    <Card className="fade-up !p-2" style={{ animationDelay: "90ms" }}>
      <Row href="/ranking" icon="🏆" label={r.source.kind === "real" ? "브랜드평판 순위" : "아이돌 인기 순위"} value={rankValue} sub={delta === undefined || delta === null ? (r.outside ? "" : `${r.above ? `${r.above.rank}위 ${r.above.name}` : "1위"} 바로 아래`) : delta === 0 ? "지난 시즌과 같음" : `지난 시즌보다 ${Math.abs(delta)}계단 ${delta > 0 ? "상승" : "하락"}`} tone={delta === undefined || delta === null || delta === 0 ? undefined : delta > 0 ? "up" : "down"} />
      <Row onClick={onSettlement} icon="💰" label="내 정산금" value={wonText(s.mine)} sub={s.unrecovered > 0 ? `제작비 ${wonText(s.unrecovered)} 회수 중` : `순이익의 ${Math.round(s.share * 100)}% 중 내 몫`} />
      <Row onClick={onShop} icon="🛍️" label="상점" value={bought ? "구매 완료" : wallet > 0 ? `${wonText(wallet)} 사용 가능` : "정산금 없음"} sub={bought ? "다음 시즌에 새 물건이 들어와요" : offers.length ? `이번 시즌 ${offers.map((o) => o.name).join(" · ")}` : "살 수 있는 물건이 없어요"} />
    </Card>
  );
}

function Row({ href, onClick, icon, label, value, sub, tone }: { href?: string; onClick?: () => void; icon: string; label: string; value: string; sub: string; tone?: "up" | "down" }) {
  const inner: ReactNode = (
    <>
      <span className="w-10 h-10 rounded-xl bg-sub flex items-center justify-center text-[18px] shrink-0" aria-hidden>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] text-ink-3">{label}</span>
        <span className="block text-[16px] font-bold truncate">{value}</span>
        {sub && <span className={cn("block text-[13px] truncate", tone === "up" ? "text-up" : tone === "down" ? "text-down" : "text-ink-3")}>{sub}</span>}
      </span>
      <span className="text-ink-3 text-[16px] shrink-0">›</span>
    </>
  );
  const cls = "press w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-left";
  return href ? <Link href={href} className={cls}>{inner}</Link> : <button type="button" onClick={onClick} className={cls}>{inner}</button>;
}
