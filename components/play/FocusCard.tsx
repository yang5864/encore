"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { equipmentPath } from "@/lib/art";
import { Card, CardTitle } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { cn } from "@/lib/cn";
import { CONCEPTS, PRODUCERS, PROMOS, TRAIN_AMOUNT, TRAIN_MAX, defaultTrainPicks, focusOptions, type FocusOption } from "@/lib/game/focus";
import { kpiPromo } from "@/lib/game/kpi";
import { conceptStreak } from "@/lib/game/album";
import { rivalFor } from "@/lib/game/team";
import { periodLabel } from "@/lib/game/format";
import { STAT_KEYS, STAT_NAMES } from "@/lib/game/stats";
import type { Career } from "@/lib/game/types";
import { suggestAlbumName } from "@/lib/game/album";
import { AlbumNamePicker } from "./AlbumNamePicker";
import { Icon } from "@/components/ui/Icon";

export type FocusSelection = { id: string; stat?: string; /** 집중 훈련할 능력 (1~3개) */ stats?: string[]; concept?: string; albumName?: string; customName?: boolean; producer?: string; promo?: string };

export function FocusCard({ career, value, onChange }: { career: Career; value: FocusSelection; onChange: (v: FocusSelection) => void }) {
  const options = focusOptions(career);
  const groupOptions = options.filter((o) => o.group !== "solo");
  const soloOptions = options.filter((o) => o.group === "solo");
  // 1단계: 그룹 활동 / 개인 활동 중 하나를 먼저 고르고, 2단계에서 세부 활동을 고른다
  const [tab, setTab] = useState<"group" | "solo">(value.id.startsWith("solo:") ? "solo" : "group");
  useEffect(() => {
    if (value.id.startsWith("solo:") && tab !== "solo") setTab("solo");
    else if (value.id && !value.id.startsWith("solo:") && tab !== "group") setTab("group");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.id]);
  const switchTab = (next: "group" | "solo") => {
    setTab(next);
    const first = (next === "solo" ? soloOptions : groupOptions).find((o) => !o.disabledReason);
    onChange({ id: first?.id ?? "", stat: value.stat ?? STAT_KEYS[0], stats: value.stats, concept: value.concept ?? CONCEPTS[0].id });
  };

  const rival = rivalFor(career);
  const renderOption = (o: FocusOption) => {
    const selected = value.id === o.id;
    const disabled = !!o.disabledReason;
    const equipment = equipmentPath(o.id, value.stat ?? "vocal", career.turn);
    return (
      <div key={o.id}>
        <button
          disabled={disabled}
          onClick={() => onChange({ id: o.id, stat: value.stat ?? STAT_KEYS[0], stats: value.stats, concept: value.concept ?? CONCEPTS[0].id })}
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
          {o.id === "comeback" && rival && !o.disabledReason && (
            <p className="text-[13px] font-bold text-warn mt-1.5 flex gap-1"><Icon name="alert" size={16} className="shrink-0 mt-px" /><span>이번 시즌 {rival.name}도 컴백해요. 초동과 차트를 나눠 가져요</span></p>
          )}
        </button>
        {selected && o.picker === "stats" && (() => {
          // 고른 능력만 오른다: 1~3개, 적게 고를수록 한 능력이 빨리 자란다
          const picks = value.stats?.length ? value.stats : defaultTrainPicks(career.position);
          const toggle = (k: string) => {
            const next = picks.includes(k) ? picks.filter((x) => x !== k) : picks.length < TRAIN_MAX ? [...picks, k] : picks;
            if (next.length) onChange({ ...value, stats: next });
          };
          return (
            <div className="mt-2 mb-3 rounded-2xl border border-primary/40 bg-primary-soft/20 p-3">
              <p className="text-[13px] font-bold text-primary px-1">집중할 능력 {picks.length}/{TRAIN_MAX}</p>
              <div className="grid grid-cols-3 gap-1.5 mt-2">
                {STAT_KEYS.map((k) => {
                  const on = picks.includes(k);
                  const full = !on && picks.length >= TRAIN_MAX;
                  return (
                    <button key={k} aria-pressed={on} disabled={full} onClick={() => toggle(k)} className={cn("press h-12 rounded-xl text-[13px] font-bold tabular-nums", on ? "bg-ink text-bg" : "bg-chip text-ink-2", full && "opacity-45")}>
                      {STAT_NAMES[k]} {career.stats[k]}
                    </button>
                  );
                })}
              </div>
              <p className="text-[13px] text-ink-3 mt-2 px-1">{picks.length === 1 ? "한 능력에 몰아서 가장 빨리 키워요." : picks.length === 2 ? `두 능력을 각각 ${Math.round((TRAIN_AMOUNT[2] / TRAIN_AMOUNT[1]) * 100)}% 속도로 키워요.` : `세 능력을 각각 ${Math.round((TRAIN_AMOUNT[3] / TRAIN_AMOUNT[1]) * 100)}% 속도로 키워요.`} 고르지 않은 능력은 오르지 않고 가끔 조금 떨어져요.</p>
            </div>
          );
        })()}
        {selected && o.picker === "concept" && (
          <div className="mt-2 mb-3 rounded-2xl border border-primary/40 bg-primary-soft/20 p-3">
            <p className="text-[13px] font-bold text-primary px-1">컴백 설정</p>
            <div className="mt-2 px-1">
              <AlbumNamePicker suggested={suggestAlbumName(career)} custom={!!value.customName} name={value.albumName ?? ""} onChange={(custom, name) => onChange({ ...value, customName: custom, albumName: name })} />
            </div>
            <p className="text-[13px] font-bold text-ink-3 mt-3 px-1">콘셉트</p>
            <div className="grid grid-cols-2 gap-1.5 mt-1.5 px-1">
              {CONCEPTS.map((x) => {
                const streak = conceptStreak(career, x.id);
                const tag = streak >= 2 ? `연속 ${streak}번째 · 매너리즘` : career.albums.length > 0 && streak === 0 && conceptStreak(career, career.albums[career.albums.length - 1].concept) >= 2 ? "변신 보너스" : null;
                return (
                  <button key={x.id} onClick={() => onChange({ ...value, concept: x.id })} className={cn("press text-left rounded-xl p-3", value.concept === x.id ? "bg-ink text-bg" : "bg-chip")}>
                    <p className="text-[13px] font-bold">{x.name}{tag && <span className={cn("ml-1.5 font-semibold", value.concept === x.id ? "text-bg" : streak >= 2 ? "text-down" : "text-up")}>{tag}</span>}</p>
                    <p className={cn("text-[13px] mt-0.5", value.concept === x.id ? "text-bg/70" : "text-ink-3")}>{x.description}</p>
                  </button>
                );
              })}
            </div>
            <p className="text-[13px] font-bold text-ink-3 mt-3 px-1">타이틀 제작</p>
            <div className="grid grid-cols-3 gap-1.5 mt-1.5 px-1">
              {PRODUCERS.map((x) => (
                <button key={x.id} onClick={() => onChange({ ...value, producer: x.id })} className={cn("press text-left rounded-xl p-3", (value.producer ?? "inhouse") === x.id ? "bg-ink text-bg" : "bg-chip")}>
                  <p className="text-[13px] font-bold">{x.name}</p>
                  <p className={cn("text-[13px] mt-0.5", (value.producer ?? "inhouse") === x.id ? "text-bg/70" : "text-ink-3")}>{x.description}</p>
                </button>
              ))}
            </div>
            <p className="text-[13px] font-bold text-ink-3 mt-3 px-1">프로모션 비중</p>
            <div className="grid grid-cols-2 gap-1.5 mt-1.5 px-1">
              {PROMOS.map((x) => {
                const locked = x.id === "global" && career.popularity < 55;
                const picked = (value.promo ?? "balanced") === x.id;
                // 회사 목표와 같은 방향의 프로모션을 표시해 둔다
                const recommended = !locked && !!career.kpi && kpiPromo(career.kpi) === x.id;
                return (
                  <button key={x.id} disabled={locked} onClick={() => onChange({ ...value, promo: x.id })} className={cn("press text-left rounded-xl p-3", picked ? "bg-ink text-bg" : recommended ? "bg-primary-soft ring-2 ring-primary" : "bg-chip", locked && "opacity-45")}>
                    <p className="text-[13px] font-bold">{x.name}</p>
                    <p className={cn("text-[13px] mt-0.5", picked ? "text-bg/70" : "text-ink-3")}>{x.description}</p>
                    {recommended && <p className={cn("text-[13px] font-bold mt-1", picked ? "text-bg" : "text-primary")}>회사 목표와 맞아 추천해요</p>}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="fade-up" style={{ animationDelay: "180ms" }} id="focus-card">
      <CardTitle sub={soloOptions.length > 0 ? `${periodLabel(career)} 활동 종류를 먼저 고르고, 무엇을 할지 하나만 골라요` : `${periodLabel(career)} 무엇을 할지 하나만 골라요`}>이번 시즌 계획</CardTitle>
      {soloOptions.length > 0 && (
        <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-sub mb-3" role="tablist" aria-label="활동 종류">
          {(["group", "solo"] as const).map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => switchTab(t)} className={cn("press h-11 rounded-xl text-[16px] font-bold transition-colors", tab === t ? "bg-card text-ink shadow-sm" : "text-ink-3")}>
              {t === "group" ? "그룹 활동" : "개인 활동"}
            </button>
          ))}
        </div>
      )}
      {soloOptions.length > 0 && tab === "solo" ? (
        <>
          <p className="text-[13px] text-ink-3 mb-2">성공 가능성은 해당 능력치가 정해요. 낮은 능력으로 밀어붙이면 묻혀요.</p>
          <div className="flex flex-col gap-2">{soloOptions.map(renderOption)}</div>
        </>
      ) : (
        <div className="flex flex-col gap-2">{groupOptions.map(renderOption)}</div>
      )}
    </Card>
  );
}

export function focusIdOf(v: FocusSelection): string {
  if (v.id === "train") return v.stats?.length ? `train:${v.stats.join("+")}` : "train";
  if (v.id === "comeback") return `comeback:${v.concept ?? "fresh"}:${v.producer ?? "inhouse"}:${v.promo ?? "balanced"}:${v.customName && v.albumName?.trim() ? encodeURIComponent(v.albumName.trim()) : ""}`;
  return v.id;
}
