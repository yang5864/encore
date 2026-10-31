"use client";
import { Card } from "@/components/ui/Card";
import { CountUp } from "@/components/ui/CountUp";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { STAT_COLORS, STAT_KEYS, STAT_NAMES, overall } from "@/lib/game/stats";
import { conditionOf, fanText, reputationBand, reputationProgress } from "@/lib/game/format";
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
                <span className="text-[14px] font-bold tabular-nums">
                  {Math.round(career.stats[k])}
                  {d !== null && <span className={`ml-1 text-[11px] ${d > 0 ? "text-up" : "text-down"}`}>{d > 0 ? "+" : ""}{Math.round(d * 10) / 10}</span>}
                </span>
              </div>
              <ProgressBar value={career.stats[k]} color={STAT_COLORS[k]} height={6} label={STAT_NAMES[k]} />
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-2 mt-5">
        <Metric label="팬" value={<CountUp value={career.fans} format={fanText} />} d={delta(changes, "fans")} fmt={(n) => fanText(Math.abs(n))} />
        <Metric label="인기도" value={<CountUp value={Math.round(career.popularity)} />} d={delta(changes, "popularity")} />
        <div className="rounded-2xl bg-[#f9fafb] p-3 min-w-0">
          <p className="text-[12px] text-ink-3 font-semibold">평판</p>
          <p className="text-[18px] font-bold tracking-[-0.02em] whitespace-nowrap truncate" style={{ color: band.color }}>{band.label}</p>
          <ProgressBar value={reputationProgress(career.reputation)} color={band.color} height={4} className="mt-1.5" label="평판 진행" />
        </div>
      </div>
    </Card>
  );
}

function Metric({ label, value, d, fmt = (n: number) => `${Math.round(Math.abs(n))}` }: { label: string; value: React.ReactNode; d: number | null; fmt?: (n: number) => string }) {
  return (
    <div className="rounded-2xl bg-[#f9fafb] p-3 min-w-0">
      <p className="text-[12px] text-ink-3 font-semibold">{label}</p>
      <p className="text-[18px] font-bold tracking-[-0.02em] tabular-nums whitespace-nowrap truncate">{value}</p>
      {d !== null ? <p className={`text-[11px] font-bold mt-0.5 whitespace-nowrap ${d > 0 ? "text-up" : "text-down"}`}>{d > 0 ? "▲ " : "▼ "}{fmt(d)}</p> : <p className="text-[11px] text-ink-3 mt-0.5">&nbsp;</p>}
    </div>
  );
}
