"use client";
import { MILESTONES, milestoneStep } from "@/lib/game/milestones";
import type { Career } from "@/lib/game/types";
import { cn } from "@/lib/cn";

const STEPS = ["연습생", "데뷔", "음방 1위", "대상", "레전드"];

export function MilestoneBar({ career, compact = false }: { career: Pick<Career, "milestones" | "stage">; compact?: boolean }) {
  const step = milestoneStep(career);
  return (
    <div className="w-full">
      <div className="flex items-center gap-1">
        {STEPS.map((label, i) => {
          // 달성한 단계만 파란색. 다음 단계는 회색으로 두어 "아직"임이 분명하게 보이도록 한다.
          const done = i < step;
          return (
            <div key={label} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
              <div className="w-full h-1.5 rounded-full bg-chip overflow-hidden">
                <div className={cn("bar-fill h-full", done ? "bg-primary" : "bg-transparent")} style={{ width: done ? "100%" : "0%" }} />
              </div>
              {!compact && <span className={cn("text-[13px] whitespace-nowrap", done ? "font-bold text-primary" : "font-medium text-ink-3")}>{label}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const milestoneLabel = (id: string) => MILESTONES.find((m) => m.id === id)?.label ?? id;
