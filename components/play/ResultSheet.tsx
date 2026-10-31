"use client";
import { useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { fanText, reputationLabel, wonText } from "@/lib/game/format";
import { scenePath } from "@/lib/game/events/index";
import { likeText } from "@/lib/game/reactions";
import type { Change, TurnResult } from "@/lib/game/types";

const PRIORITY = ["fans", "popularity", "ovr", "reputation", "settled", "condition"];

function fmt(ch: Change, v: number) {
  if (ch.fmt === "fans") return fanText(v);
  if (ch.fmt === "won") return wonText(v);
  if (ch.fmt === "rep") return reputationLabel(v);
  return `${Math.round(v)}`;
}
function deltaText(ch: Change) {
  const d = ch.after - ch.before;
  if (ch.fmt === "fans") return `${d > 0 ? "+" : "-"}${fanText(Math.abs(d))}`;
  if (ch.fmt === "won") return `${d > 0 ? "+" : "-"}${wonText(Math.abs(d))}`;
  if (ch.fmt === "rep") return `${d > 0 ? "+" : ""}${Math.round(d)}`;
  return `${d > 0 ? "+" : ""}${Math.round(d * 10) / 10}`;
}

export function pickTop(changes: Change[], n = 3): Change[] {
  return [...changes]
    .sort((a, b) => {
      const pa = PRIORITY.indexOf(a.key);
      const pb = PRIORITY.indexOf(b.key);
      const ra = pa === -1 ? 50 + Math.abs(a.after - a.before) * -1 : pa;
      const rb = pb === -1 ? 50 + Math.abs(b.after - b.before) * -1 : pb;
      return ra - rb;
    })
    .slice(0, n);
}

export function ResultSheet({ result, open, onClose, ctaLabel = "확인" }: { result: TurnResult; open: boolean; onClose: () => void; ctaLabel?: string }) {
  const [more, setMore] = useState(false);
  const top = pickTop(result.changes);
  const rest = result.changes.filter((c) => !top.includes(c));
  const toneColor = result.tone === "bad" ? "text-down" : result.tone === "good" || result.tone === "milestone" ? "text-primary" : "text-ink";
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      {result.scene && (
        <div className="-mx-5 -mt-3">
          <img src={scenePath(result.scene)} alt="" className="w-full aspect-[16/9] object-cover" />
        </div>
      )}
      <p className={`t-cap mt-4 ${toneColor}`}>{result.tone === "bad" ? "아쉬운 결과" : result.tone === "good" ? "좋은 결과" : result.tone === "milestone" ? "중요한 순간" : "이번 반기"}</p>
      <h2 className="t-title mt-1">{result.headline}</h2>
      <p className="t-body text-ink-2 mt-2">{result.text}</p>

      {top.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-4">
          {top.map((ch) => (
            <Chip key={ch.key} tone={ch.after > ch.before ? "up" : "down"}>
              {ch.label} {deltaText(ch)}
            </Chip>
          ))}
        </div>
      )}

      {result.notes.length > 0 && (
        <ul className="mt-4 rounded-2xl bg-[#f9fafb] p-4 flex flex-col gap-1.5">
          {result.notes.map((n, i) => (
            <li key={i} className="text-[13px] text-ink-2 leading-relaxed">· {n}</li>
          ))}
        </ul>
      )}

      {(rest.length > 0 || result.comments.length > 0) && (
        <button onClick={() => setMore((m) => !m)} className="press mt-4 w-full h-11 rounded-xl bg-[#f2f4f6] text-ink-2 text-[14px] font-bold">
          {more ? "접기" : "자세히 보기"}
        </button>
      )}
      {more && (
        <div className="mt-3 fade-up">
          {rest.length > 0 && (
            <div className="rounded-2xl bg-[#f9fafb] p-4 flex flex-col gap-2">
              {rest.map((ch) => (
                <div key={ch.key} className="flex items-center justify-between text-[14px]">
                  <span className="text-ink-2 font-semibold">{ch.label}</span>
                  <span className="font-bold tabular-nums">
                    <span className="text-ink-3 font-medium">{fmt(ch, ch.before)}</span> → {fmt(ch, ch.after)} <span className={ch.after > ch.before ? "text-up" : "text-down"}>({deltaText(ch)})</span>
                  </span>
                </div>
              ))}
            </div>
          )}
          {result.comments.length > 0 && (
            <div className="mt-3">
              <p className="t-cap mb-2">커뮤니티 반응 · 게임 속 가상 댓글</p>
              <div className="flex flex-col gap-2">
                {result.comments.map((cm, i) => (
                  <div key={i} className="rounded-2xl bg-[#f9fafb] p-3.5">
                    <p className="text-[12px] font-bold text-ink-3">{cm.author}</p>
                    <p className="text-[14px] mt-0.5">{cm.text}</p>
                    <p className="text-[12px] text-ink-3 mt-1">♡ {likeText(cm.likes)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-6">
        <Button onClick={onClose}>{ctaLabel}</Button>
      </div>
    </Sheet>
  );
}
