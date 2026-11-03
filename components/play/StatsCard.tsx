"use client";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { CountUp } from "@/components/ui/CountUp";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { STAT_COLORS, STAT_KEYS, STAT_NAMES, overall } from "@/lib/game/stats";
import { conditionOf, fanText, reputationBand, reputationProgress } from "@/lib/game/format";
import { countText } from "@/lib/game/metrics";
import { Logo } from "@/components/Logo";
import type { Career, Change } from "@/lib/game/types";

function delta(changes: Change[] | undefined, key: string) {
  const ch = changes?.find((c) => c.key === key);
  if (!ch) return null;
  const d = ch.after - ch.before;
  if (Math.abs(d) < 0.05) return null;
  return d;
}

export function StatsCard({ career, changes }: { career: Career; changes?: Change[] }) {
  const ovr = overall(career.stats, career.position);
  const cond = conditionOf(career);
  const band = reputationBand(career.reputation);
  const ovrDelta = delta(changes, "ovr");
  const [showSns, setShowSns] = useState(false);
  return (
    <Card className="fade-up" style={{ animationDelay: "60ms" }}>
      <div className="flex items-end justify-between">
        <div>
          <p className="t-cap">OVR</p>
          <div className="flex items-baseline gap-2">
            <CountUp value={ovr} className="t-num text-primary" />
            {ovrDelta !== null && <span className={`text-[13px] font-bold ${ovrDelta > 0 ? "text-up" : "text-down"}`}>{ovrDelta > 0 ? "+" : ""}{Math.round(ovrDelta)}</span>}
          </div>
        </div>
        <div className="text-right">
          <p className="t-cap">컨디션</p>
          <p className="t-num-md" style={{ color: cond.color }}>{cond.label}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-5 gap-y-3 mt-5">
        {STAT_KEYS.map((k) => {
          const d = delta(changes, k);
          return (
            <div key={k}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[13px] font-semibold text-ink-2">{STAT_NAMES[k]}</span>
                <span className="text-[13px] font-bold tabular-nums">
                  {Math.round(career.stats[k])}
                  {d !== null && <span className={`ml-1 text-[13px] ${d > 0 ? "text-up" : "text-down"}`}>{d > 0 ? "+" : ""}{Math.round(d)}</span>}
                </span>
              </div>
              <ProgressBar value={career.stats[k]} color={STAT_COLORS[k]} height={6} label={STAT_NAMES[k]} />
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-2 mt-5">
        <Metric label="코어 팬덤" value={<CountUp value={career.fans} format={fanText} />} d={delta(changes, "fans")} fmt={(n) => fanText(Math.abs(n))} />
        <Metric label="인기도" value={<CountUp value={Math.round(career.popularity)} />} d={delta(changes, "popularity")} />
        <div className="rounded-2xl bg-sub p-3 min-w-0">
          <p className="text-[13px] text-ink-3 font-semibold">평판</p>
          <p className="text-[16px] font-bold tracking-[-0.02em] whitespace-nowrap truncate" style={{ color: band.color }}>{band.label}</p>
          <ProgressBar value={reputationProgress(career.reputation)} color={band.color} height={4} className="mt-1.5" label="평판 진행" />
        </div>
      </div>

      {(career.stage === "idol" || career.stage === "retired" || (career.metrics?.instagram ?? 0) > 0) && !showSns && (
        <button type="button" onClick={() => setShowSns(true)} className="press mt-3 w-full h-10 rounded-xl bg-sub text-[13px] font-bold text-ink-2">
          SNS · 스트리밍 보기 · 인스타 {countText(career.metrics?.instagram ?? 0)}
        </button>
      )}
      {(career.stage === "idol" || career.stage === "retired" || (career.metrics?.instagram ?? 0) > 0) && showSns && (
        <div className="mt-3 rounded-2xl bg-sub p-3.5">
          <button type="button" onClick={() => setShowSns(false)} className="press w-full flex items-center justify-between mb-2">
            <span className="text-[13px] text-ink-3 font-semibold">SNS · 스트리밍</span>
            <span className="text-[13px] text-ink-3">접기</span>
          </button>
          <div className="flex flex-col gap-2">
            <Row logo="instagram" label="인스타 팔로워" sub="개인 계정" value={career.metrics?.instagram ?? 0} d={delta(changes, "instagram")} />
            {career.stage !== "free" && career.stage !== "trainee" && <Row logo="youtube" label="유튜브 구독자" sub="그룹 채널" value={career.metrics?.youtube ?? 0} d={delta(changes, "youtube")} />}
            {career.stage !== "free" && career.stage !== "trainee" && <Row logo="spotify" label="스포티파이" sub="월간 리스너" value={career.metrics?.spotify ?? 0} d={delta(changes, "spotify")} />}
          </div>
        </div>
      )}
    </Card>
  );
}

function Metric({ label, value, d, fmt = (n: number) => `${Math.round(Math.abs(n))}` }: { label: string; value: React.ReactNode; d: number | null; fmt?: (n: number) => string }) {
  return (
    <div className="rounded-2xl bg-sub p-3 min-w-0">
      <p className="text-[13px] text-ink-3 font-semibold">{label}</p>
      <p className="text-[16px] font-bold tracking-[-0.02em] tabular-nums whitespace-nowrap truncate">{value}</p>
      {d !== null ? <p className={`text-[13px] font-bold mt-0.5 whitespace-nowrap ${d > 0 ? "text-up" : "text-down"}`}>{d > 0 ? "▲ " : "▼ "}{fmt(d)}</p> : <p className="text-[13px] text-ink-3 mt-0.5">&nbsp;</p>}
    </div>
  );
}

function Row({ logo, label, sub, value, d }: { logo: string; label: string; sub: string; value: number; d: number | null }) {
  return (
    <div className="flex items-center gap-3">
      <Logo id={logo} ext="svg" label={label} size={34} rounded="full" />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold">{label}</p>
        <p className="text-[13px] text-ink-3">{sub}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-[16px] font-bold tabular-nums"><CountUp value={value} format={countText} /></p>
        {d !== null && <p className={`text-[13px] font-bold ${d > 0 ? "text-up" : "text-down"}`}>{d > 0 ? "▲ " : "▼ "}{countText(Math.abs(d))}</p>}
      </div>
    </div>
  );
}
