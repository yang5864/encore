"use client";
import { Card, CardTitle } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { cn } from "@/lib/cn";
import { CONCEPTS, focusOptions } from "@/lib/game/focus";
import { periodLabel } from "@/lib/game/format";
import { STAT_KEYS, STAT_NAMES } from "@/lib/game/stats";
import type { Career } from "@/lib/game/types";

export type FocusSelection = { id: string; stat?: string; concept?: string };

export function FocusCard({ career, value, onChange }: { career: Career; value: FocusSelection; onChange: (v: FocusSelection) => void }) {
  const options = focusOptions(career);
  return (
    <Card className="fade-up" style={{ animationDelay: "180ms" }} id="focus-card">
      <CardTitle sub={`${periodLabel(career)} 계획을 하나 골라요`}>이번 반기 집중</CardTitle>
      <div className="flex flex-col gap-2">
        {options.map((o) => {
          const selected = value.id === o.id;
          const disabled = !!o.disabledReason;
          return (
            <div key={o.id}>
              <button
                disabled={disabled}
                onClick={() => onChange({ id: o.id, stat: value.stat ?? STAT_KEYS[0], concept: value.concept ?? CONCEPTS[0].id })}
                className={cn(
                  "press w-full text-left rounded-2xl border-2 p-4 transition-colors",
                  selected ? "border-primary bg-primary-soft/50" : "border-transparent bg-[#f9fafb]",
                  disabled && "opacity-45",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="t-body font-bold">{o.label}</span>
                  <Chip tone={o.risk === "bold" ? "warn" : "ok"}>{o.risk === "bold" ? "도전" : "안정"}</Chip>
                </div>
                <p className="text-[13px] text-ink-2 mt-1">{o.disabledReason ?? o.hint}</p>
              </button>
              {selected && o.picker === "stat" && (
                <div className="flex flex-wrap gap-1.5 mt-2 px-1">
                  {STAT_KEYS.map((k) => (
                    <button key={k} onClick={() => onChange({ ...value, stat: k })} className={cn("press h-9 px-3 rounded-full text-[13px] font-bold", value.stat === k ? "bg-ink text-white" : "bg-[#f2f4f6] text-ink-2")}>
                      {STAT_NAMES[k]}
                    </button>
                  ))}
                </div>
              )}
              {selected && o.picker === "concept" && (
                <div className="grid grid-cols-2 gap-1.5 mt-2 px-1">
                  {CONCEPTS.map((x) => (
                    <button key={x.id} onClick={() => onChange({ ...value, concept: x.id })} className={cn("press text-left rounded-xl p-3", value.concept === x.id ? "bg-ink text-white" : "bg-[#f2f4f6]")}>
                      <p className="text-[14px] font-bold">{x.name}</p>
                      <p className={cn("text-[12px] mt-0.5", value.concept === x.id ? "text-white/70" : "text-ink-3")}>{x.description}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export function focusIdOf(v: FocusSelection): string {
  if (v.id === "train") return `train:${v.stat ?? "vocal"}`;
  if (v.id === "comeback") return `comeback:${v.concept ?? "fresh"}`;
  return v.id;
}
