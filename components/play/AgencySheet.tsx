"use client";
import { useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Chip } from "@/components/ui/Chip";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/cn";
import { AGENCIES, TIERS, TIER_ORDER, auditionChance, chanceLabel } from "@/lib/game/agencies";
import type { Career, Tier } from "@/lib/game/types";

const TONE: Record<string, "down" | "warn" | "neutral" | "ok" | "up"> = { "매우 낮음": "down", 낮음: "warn", 보통: "neutral", 높음: "ok", "매우 높음": "up" };

export function AgencySheet({ career, open, onClose, onApply }: { career: Career; open: boolean; onClose: () => void; onApply: (id: string) => void }) {
  const [tier, setTier] = useState<Tier>("indie");
  const locked = career.stage === "idol";
  const monthsLeft = career.contractEnd !== null ? Math.max(0, (career.contractEnd - career.turn) * 6) : 0;
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()} title="기획사 지원" description={locked ? `전속계약 중이에요. 재계약 시점(${monthsLeft}개월 뒤)에 열려요` : "합격 가능성은 지금 실력 기준이에요. 같은 회사는 1년 뒤 다시 지원할 수 있어요"} tall>
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-5 px-5 pb-1">
        {TIER_ORDER.map((t) => (
          <button key={t} onClick={() => setTier(t)} className={cn("press shrink-0 h-9 px-3.5 rounded-full text-[13px] font-bold", tier === t ? "bg-ink text-bg" : "bg-chip text-ink-2")}>
            {TIERS[t].short}
          </button>
        ))}
      </div>
      <p className="t-cap mt-3">{TIERS[tier].description}</p>
      <div className="flex flex-col gap-2 mt-3">
        {AGENCIES.filter((a) => a.tier === tier).map((a, i) => {
          const p = auditionChance(career, a.id);
          const label = chanceLabel(p);
          const cooldown = career.flags[`apply:${a.id}`] !== undefined && career.turn - career.flags[`apply:${a.id}`] < 2;
          const mine = career.agencyId === a.id;
          return (
            <div key={a.id} className="fade-up rounded-2xl bg-sub p-4 flex items-center gap-3" style={{ animationDelay: `${i * 50}ms` }}>
              <Logo id={a.logo} label={a.name} color={a.color} size={44} />
              <div className="min-w-0 flex-1">
                <p className="t-body font-bold truncate">{a.name}</p>
                <p className="text-[13px] text-ink-3 truncate">{a.rank ? `2026 기획사 순위 ${a.rank}위 · ` : ""}{a.strength}</p>
                {!locked && !mine && <Chip tone={TONE[label]} className="mt-1.5 h-6 px-2 text-[13px]">합격 가능성 {label}</Chip>}
              </div>
              <button
                disabled={locked || mine || cooldown}
                onClick={() => onApply(a.id)}
                className="press shrink-0 h-10 px-3.5 rounded-xl bg-primary text-white text-[13px] font-bold disabled:bg-chip disabled:text-ink-3"
              >
                {mine ? "소속" : cooldown ? "대기" : "지원"}
              </button>
            </div>
          );
        })}
      </div>
    </Sheet>
  );
}
