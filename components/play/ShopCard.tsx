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
  const wallet = walletOf(career);
  const bought = boughtThisSeason(career);
  const items = shopOffers(career);
  const owned = new Set(career.items ?? []);
  return (
    <Card className="fade-up" style={{ animationDelay: "150ms" }}>
      <CardTitle sub={bought ? "이번 시즌 구매를 마쳤어요. 다음 시즌에 새 물건이 들어와요" : "시즌마다 3개 중 하나만 살 수 있어요"} right={<span className="t-body font-bold tabular-nums whitespace-nowrap shrink-0">{wonText(wallet)}</span>}>
        상점
      </CardTitle>
      <div className="grid grid-cols-3 gap-2">
        {items.map((item, i) => {
          const price = priceOf(career, item);
          const lacking = wallet < price;
          const justBought = bought && career.items?.[career.items.length - 1] === item.id;
          return (
            <div key={item.id} className={cn("fade-up rounded-2xl bg-sub p-2.5 flex flex-col items-center text-center", bought && !justBought && "opacity-45")} style={{ animationDelay: `${180 + i * 50}ms` }}>
              <Image src={item.image} alt="" width={64} height={64} className="w-16 h-16 [image-rendering:pixelated]" />
              <p className="text-[13px] font-bold mt-1 leading-tight min-h-[2.4em] flex items-center">{item.name}</p>
              <p className="text-[13px] text-up font-bold mb-2">{STAT_NAMES[item.stat]} +{item.amount}</p>
              <button
                disabled={bought || lacking}
                onClick={() => onBuy(item.id)}
                className="press mt-auto w-full h-9 rounded-xl bg-primary text-white text-[13px] font-bold disabled:bg-chip disabled:text-ink-3"
              >
                {justBought ? "구매 완료" : bought ? "다음 시즌" : wonText(price)}
              </button>
              {owned.has(item.id) && !justBought && <p className="text-[13px] text-ink-3 mt-1">보유 중</p>}
            </div>
          );
        })}
      </div>
      {wallet === 0 && !bought && <p className="text-[13px] text-ink-3 mt-3">정산금이 들어오면 살 수 있어요.</p>}
    </Card>
  );
}
