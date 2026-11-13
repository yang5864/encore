"use client";
import { Card, CardTitle } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { pickTop } from "./ResultSheet";
import { fanText, periodLabel, wonText } from "@/lib/game/format";
import { countText } from "@/lib/game/metrics";
import type { Career, Change } from "@/lib/game/types";
import { Icon } from "@/components/ui/Icon";

function deltaText(ch: Change) {
  const d = ch.after - ch.before;
  if (ch.fmt === "fans") return `${d > 0 ? "+" : "-"}${fanText(Math.abs(d))}`;
  if (ch.fmt === "won") return `${d > 0 ? "+" : "-"}${wonText(Math.abs(d))}`;
  if (ch.fmt === "count") return `${d > 0 ? "+" : "-"}${countText(Math.abs(d))}`;
  return `${d > 0 ? "+" : ""}${Math.round(d)}`;
}

/** 지난 시즌 종합 성과. 결과 시트를 닫은 뒤에도 홈에서 다시 볼 수 있다. */
export function SeasonCard({ career }: { career: Career }) {
  const r = career.lastResult;
  if (!r || career.turn === 0) return null;
  const top = pickTop(r.changes, 4);
  const last = periodLabel({ turn: career.turn - 1 });
  const awards = r.awards ?? [];
  const highlights = [
    ...awards.map((a) => `${a.show} ${a.name}`),
    ...(r.spotlight ? [r.spotlight.title.replace("\n", " ")] : []),
  ];
  return (
    <Card className="fade-up" style={{ animationDelay: "60ms" }}>
      <CardTitle sub={last}>지난 시즌 성과</CardTitle>
      <p className="text-[16px] font-bold">{r.headline}</p>
      {highlights.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {highlights.map((h) => (
            <Chip key={h} tone="warn"><span className="inline-flex items-center gap-1"><Icon name="trophy" size={14} />{h}</span></Chip>
          ))}
        </div>
      )}
      {top.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {top.map((ch) => (
            <Chip key={ch.key} tone={ch.after > ch.before ? "up" : "down"}>
              {ch.label} {deltaText(ch)}
            </Chip>
          ))}
        </div>
      )}
      {r.notes.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1">
          {r.notes.slice(0, 3).map((n, i) => (
            <li key={i} className="text-[13px] text-ink-3 leading-relaxed">· {n}</li>
          ))}
        </ul>
      )}
    </Card>
  );
}
