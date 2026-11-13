"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { rankChanges, rankingFor } from "@/lib/game/brand-rank";
import { settlement } from "@/lib/game/economy";
import { isSecondHalf, wonText, yearOf } from "@/lib/game/format";
import { boughtThisSeason, priceOf, shopOffers, walletOf } from "@/lib/game/shop";
import { budgetName, budgetOf } from "@/lib/game/team";
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
  const cheapest = offers.length ? Math.min(...offers.map((o) => priceOf(career, o))) : Infinity;
  const canBuy = !bought && wallet >= cheapest;
  const rankValue = r.outside ? (r.source.kind === "real" ? "50위 밖" : "순위 밖") : `${r.me.rank}위`;
  return (
    <Card className="fade-up !p-2" style={{ animationDelay: "90ms" }}>
      <Row href="/ranking" icon="🏆" label={r.source.kind === "real" ? "브랜드평판 순위" : "아이돌 인기 순위"} value={rankValue} sub={delta === undefined || delta === null ? (r.outside ? "" : `${r.above ? `${r.above.rank}위 ${r.above.name}` : "1위"} 바로 아래`) : delta === 0 ? "지난 시즌과 같음" : `지난 시즌보다 ${Math.abs(delta)}계단 ${delta > 0 ? "상승" : "하락"}`} tone={delta === undefined || delta === null || delta === 0 ? undefined : delta > 0 ? "up" : "down"} />
      {career.kpi && (
        <Row icon="🎯" label={`회사 목표 · ${career.kpi.deadline - career.turn === 1 ? "이번 시즌까지" : `${(career.kpi.deadline - career.turn) * 6}개월 남음`}`} value={career.kpi.label} sub={`달성하면 신뢰·제작 지원이 늘고, 놓치면 제작비가 줄어요${career.flags.kpiHits ? ` · 달성 ${career.flags.kpiHits}회` : ""}${career.flags.kpiMisses ? ` · 미달 ${career.flags.kpiMisses}회` : ""}`} />
      )}
      {career.budget && (
        <Row icon="📊" label="올해 홍보 예산" value={budgetName(budgetOf(career))} sub={`MV ${budgetOf(career).mv}% · 음원 ${budgetOf(career).digital}% · 해외 ${budgetOf(career).global}% · 팬 ${budgetOf(career).fan}%`} />
      )}
      <Row onClick={onSettlement} icon="💰" label="내 정산금" value={wonText(s.mine)} sub={s.unrecovered > 0 ? `제작비 ${wonText(s.unrecovered)} 회수 중` : `순이익의 ${Math.round(s.share * 100)}% 중 내 몫`} />
      <Row onClick={onShop} icon="🛍️" label={canBuy ? "상점 · 이번 시즌 아직 안 샀어요" : "상점"} value={bought ? "구매 완료" : wallet > 0 ? `${wonText(wallet)} 사용 가능` : "정산금 없음"} sub={bought ? "다음 시즌에 새 물건이 들어와요" : offers.length ? `이번 시즌 ${offers.map((o) => o.name).join(" · ")}` : "살 수 있는 물건이 없어요"} tone={canBuy ? "up" : undefined} highlight={canBuy} />
    </Card>
  );
}

function Row({ href, onClick, icon, label, value, sub, tone, highlight }: { href?: string; onClick?: () => void; icon: string; label: string; value: string; sub: string; tone?: "up" | "down"; highlight?: boolean }) {
  const inner: ReactNode = (
    <>
      <span className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-[18px] shrink-0 relative", highlight ? "bg-primary-soft" : "bg-sub")} aria-hidden>
        {icon}
        {highlight && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-up ring-2 ring-card" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn("block text-[13px]", highlight ? "text-primary font-bold" : "text-ink-3")}>{label}</span>
        <span className="block text-[16px] font-bold truncate">{value}</span>
        {sub && <span className={cn("block text-[13px] line-clamp-2", tone === "up" ? "text-up" : tone === "down" ? "text-down" : "text-ink-3")}>{sub}</span>}
      </span>
      {(href || onClick) && <span className="text-ink-3 text-[16px] shrink-0">›</span>}
    </>
  );
  const cls = cn("press w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-left", highlight && "bg-primary-soft/40");
  if (!href && !onClick) return <div className={cls.replace("press ", "")}>{inner}</div>;
  return href ? <Link href={href} className={cls}>{inner}</Link> : <button type="button" onClick={onClick} className={cls}>{inner}</button>;
}
