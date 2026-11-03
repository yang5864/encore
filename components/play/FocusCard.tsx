"use client";
import Image from "next/image";
import { equipmentPath } from "@/lib/art";
import { Card, CardTitle } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { cn } from "@/lib/cn";
import { CONCEPTS, focusOptions, type FocusOption } from "@/lib/game/focus";
import { periodLabel } from "@/lib/game/format";
import { STAT_KEYS, STAT_NAMES } from "@/lib/game/stats";
import type { Career } from "@/lib/game/types";
import { suggestAlbumName } from "@/lib/game/album";
import { AlbumNamePicker } from "./AlbumNamePicker";

export type FocusSelection = { id: string; stat?: string; concept?: string; albumName?: string; customName?: boolean };

export function FocusCard({ career, value, onChange }: { career: Career; value: FocusSelection; onChange: (v: FocusSelection) => void }) {
  const options = focusOptions(career);
  const groupOptions = options.filter((o) => o.group !== "solo");
  const soloOptions = options.filter((o) => o.group === "solo");

  const renderOption = (o: FocusOption) => {
    const selected = value.id === o.id;
    const disabled = !!o.disabledReason;
    const equipment = equipmentPath(o.id, value.stat ?? "vocal", career.turn);
    return (
      <div key={o.id}>
        <button
          disabled={disabled}
          onClick={() => onChange({ id: o.id, stat: value.stat ?? STAT_KEYS[0], concept: value.concept ?? CONCEPTS[0].id })}
          className={cn(
            "press w-full text-left rounded-2xl border-2 p-4 transition-colors",
            selected ? "border-primary bg-primary-soft/50" : "border-transparent bg-sub",
            disabled && "opacity-45",
          )}
        >
          <div className="flex items-center justify-between gap-2">
            {equipment && <Image src={equipment} alt="" width={44} height={44} sizes="44px" className="shrink-0 object-contain" />}
            <span className="t-body font-bold flex-1">{o.label}</span>
            {o.readiness ? <Chip tone={o.readiness.tone}>{o.readiness.label}</Chip> : <Chip tone={o.risk === "bold" ? "warn" : "ok"}>{o.risk === "bold" ? "도전" : "안정"}</Chip>}
          </div>
          <p className="text-[13px] text-ink-2 mt-1">{o.disabledReason ?? o.hint}</p>
        </button>
        {selected && o.picker === "stat" && (
          <div className="flex flex-wrap gap-1.5 mt-2 px-1">
            {STAT_KEYS.map((k) => (
              <button key={k} onClick={() => onChange({ ...value, stat: k })} className={cn("press h-9 px-3 rounded-full text-[13px] font-bold", value.stat === k ? "bg-ink text-bg" : "bg-chip text-ink-2")}>
                {STAT_NAMES[k]}
              </button>
            ))}
          </div>
        )}
        {selected && o.picker === "concept" && (
          <div className="mt-2 px-1">
            <AlbumNamePicker suggested={suggestAlbumName(career)} custom={!!value.customName} name={value.albumName ?? ""} onChange={(custom, name) => onChange({ ...value, customName: custom, albumName: name })} />
          </div>
        )}
        {selected && o.picker === "concept" && (
          <div className="grid grid-cols-2 gap-1.5 mt-2 px-1">
            {CONCEPTS.map((x) => (
              <button key={x.id} onClick={() => onChange({ ...value, concept: x.id })} className={cn("press text-left rounded-xl p-3", value.concept === x.id ? "bg-ink text-bg" : "bg-chip")}>
                <p className="text-[13px] font-bold">{x.name}</p>
                <p className={cn("text-[13px] mt-0.5", value.concept === x.id ? "text-bg/70" : "text-ink-3")}>{x.description}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="fade-up" style={{ animationDelay: "180ms" }} id="focus-card">
      <CardTitle sub={`${periodLabel(career)} 무엇을 할지 하나만 골라요`}>이번 시즌 계획</CardTitle>
      {soloOptions.length > 0 && <p className="text-[13px] font-bold text-ink-3 mb-2">그룹 활동</p>}
      <div className="flex flex-col gap-2">{groupOptions.map(renderOption)}</div>
      {soloOptions.length > 0 && (
        <>
          <p className="text-[13px] font-bold text-ink-3 mt-5 mb-1">개인 활동</p>
          <p className="text-[13px] text-ink-3 mb-2">성공 가능성은 해당 능력치가 정해요. 낮은 능력으로 밀어붙이면 묻혀요.</p>
          <div className="flex flex-col gap-2">{soloOptions.map(renderOption)}</div>
        </>
      )}
    </Card>
  );
}

export function focusIdOf(v: FocusSelection): string {
  if (v.id === "train") return `train:${v.stat ?? "vocal"}`;
  if (v.id === "comeback") return `comeback:${v.concept ?? "fresh"}${v.customName && v.albumName?.trim() ? `:${encodeURIComponent(v.albumName.trim())}` : ""}`;
  return v.id;
}
