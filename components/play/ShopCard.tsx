"use client";
import Image from "next/image";
import { Card, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { boughtThisSeason, priceOf, shopOffers, walletOf } from "@/lib/game/shop";
import { STAT_NAMES } from "@/lib/game/stats";
import { wonText } from "@/lib/game/format";
import type { Career } from "@/lib/game/types";

/** 시즌마다 바뀌는 3개 중 하나만 살 수 있는 상점. 정산금으로 산다. */
export function ShopCard({ career, onBuy }: { career: Career; onBuy: (id: string) => void }) {
  return (
    <Card className="fade-up" style={{ animationDelay: "150ms" }}>
      <CardTitle>상점</CardTitle>
      <ShopBody career={career} onBuy={onBuy} />
    </Card>
  );
}

/** 상점 본문. 홈 요약에서 누르면 시트로 열린다. */
export function ShopBody({ career, onBuy }: { career: Career; onBuy: (id: string) => void }) {
  const wallet = walletOf(career);
  const bought = boughtThisSeason(career);
  const items = shopOffers(career);
  const owned = new Set(career.items ?? []);
  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="t-cap">{bought ? "이번 시즌 구매를 마쳤어요. 다음 시즌에 새 물건이 들어와요" : "시즌마다 하나만 살 수 있어요. 싼 물건부터 보여줘요"}</p>
        <span className="t-body font-bold tabular-nums whitespace-nowrap shrink-0">{wonText(wallet)}</span>
      </div>
      <ul className="flex flex-col gap-2">
        {items.map((item, i) => {
          const price = priceOf(career, item);
          const lacking = wallet < price;
          const justBought = bought && career.items?.[career.items.length - 1] === item.id;
          const tier = item.tier ?? 1;
          return (
            <li key={item.id} className={cn("fade-up rounded-2xl p-3 flex items-center gap-3", tier === 3 ? "bg-gold/10 ring-1 ring-gold/50" : tier === 2 ? "bg-primary-soft/50" : "bg-sub", bought && !justBought && "opacity-45")} style={{ animationDelay: `${180 + i * 50}ms` }}>
              <span className={cn("w-14 h-14 rounded-xl shrink-0 flex items-center justify-center", tier === 3 ? "bg-gold-deep" : "bg-card")}>
                <Image src={item.image} alt="" width={56} height={56} className="w-12 h-12 [image-rendering:pixelated]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-ink-3">{tier === 3 ? "마스터" : tier === 2 ? "프로" : "일반"}</p>
                <p className="text-[16px] font-bold leading-tight truncate">{item.name}</p>
                <p className="text-[13px] font-bold text-up mt-0.5">{STAT_NAMES[item.stat]} +{item.amount}</p>
                {item.perk && <p className="text-[13px] text-ink-2">{item.perk.label}</p>}
              </div>
              <button
                type="button"
                disabled={bought || lacking}
                onClick={() => onBuy(item.id)}
                className="press shrink-0 min-w-[84px] h-11 px-3 rounded-xl bg-primary text-white text-[13px] font-bold tabular-nums disabled:bg-chip disabled:text-ink-3"
              >
                {justBought ? "구매 완료" : bought ? "다음 시즌" : wonText(price)}
              </button>
              {owned.has(item.id) && !justBought && <span className="sr-only">보유 중</span>}
            </li>
          );
        })}
      </ul>
      {wallet === 0 && !bought && <p className="text-[13px] text-ink-3 mt-3">정산금이 들어오면 살 수 있어요.</p>}
    </div>
  );
}
