"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { cn } from "@/lib/cn";
import { STAT_NAMES } from "@/lib/game/stats";
import { ARTS_MAJORS, ARTS_PASS, artsNeeded, artsTotal, majorAbility, type ArtsMajor } from "@/lib/game/school";
import type { ActiveEvent, Career } from "@/lib/game/types";

/**
 * 예술고 실기 오디션: 전공을 고르고 3레인 리듬 게임을 한 번 본다.
 * 노트가 판정선에 닿을 때 아래 패드를 누른다. 정확도(0~100)가 실기 점수가 된다.
 */
const LANES = 3;
const TRAVEL = 1500; // 노트가 위에서 판정선까지 내려오는 시간(ms)
const BEAT = 520;
const NOTES = 24;
const PERFECT = 80; // ms
const GOOD = 170;
const LEAD = 1800; // 첫 노트 전 준비 시간
const LANE_COLORS = ["var(--primary)", "var(--up)", "var(--warn)"];

type Note = { t: number; lane: number; hit?: "perfect" | "good" | "miss" };

/** 시드로 정해지는 악보: 같은 레인이 세 번 이어지지 않고, 가끔 반 박자가 낀다 */
function makeChart(seed: number): Note[] {
  let s = (seed >>> 0) || 1;
  const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  const notes: Note[] = [];
  let t = LEAD;
  for (let i = 0; i < NOTES; i++) {
    let lane = Math.floor(rnd() * LANES);
    if (i >= 2 && notes[i - 1].lane === lane && notes[i - 2].lane === lane) lane = (lane + 1) % LANES;
    notes.push({ t, lane });
    t += i > 6 && rnd() < 0.3 ? BEAT / 2 : BEAT;
  }
  return notes;
}

export function ArtsAudition({ career, event, onChoose }: { career: Career; event: ActiveEvent; onChoose: (choiceId: string, extra?: { score?: number }) => void }) {
  const [major, setMajor] = useState<ArtsMajor | null>(null);
  const [phase, setPhase] = useState<"pick" | "ready" | "play" | "done">("pick");
  const [score, setScore] = useState(0);
  const [judge, setJudge] = useState<{ text: string; key: number } | null>(null);
  const [combo, setCombo] = useState(0);
  const chart = useMemo(() => makeChart(career.seed + career.turn * 31), [career.seed, career.turn]);
  const notes = useRef<Note[]>([]);
  const started = useRef(0);
  const stray = useRef(0);
  const noteEls = useRef<(HTMLSpanElement | null)[]>([]);
  const field = useRef<HTMLDivElement>(null);
  const [pressed, setPressed] = useState<number | null>(null);

  // 노트 위치는 React 상태가 아니라 프레임마다 직접 옮긴다 (60fps, 리렌더 없음)
  useEffect(() => {
    if (phase !== "play") return;
    notes.current = chart.map((n) => ({ ...n }));
    stray.current = 0;
    started.current = performance.now();
    let raf = 0;
    const tick = () => {
      const now = performance.now() - started.current;
      const h = field.current?.clientHeight ?? 0;
      const line = h * 0.86;
      notes.current.forEach((n, i) => {
        const el = noteEls.current[i];
        if (!el) return;
        const p = 1 - (n.t - now) / TRAVEL; // 0 = 맨 위, 1 = 판정선
        const visible = !n.hit && p > 0 && p < 1.18;
        el.style.opacity = visible ? "1" : "0";
        if (visible) el.style.transform = `translate3d(0, ${p * line}px, 0)`;
        if (!n.hit && now - n.t > GOOD) { n.hit = "miss"; setCombo(0); setJudge({ text: "놓침", key: now }); }
      });
      if (now > chart[chart.length - 1].t + GOOD + 400) {
        const got = notes.current.reduce((sum, n) => sum + (n.hit === "perfect" ? 1 : n.hit === "good" ? 0.6 : 0), 0);
        // 아무 때나 두드리면 깎인다: 빈 탭 하나에 노트 1/4개
        setScore(Math.max(0, Math.min(100, Math.round(((got - stray.current * 0.25) / chart.length) * 100))));
        setPhase("done");
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, chart]);

  const tap = (lane: number) => {
    if (phase !== "play") return;
    setPressed(lane);
    window.setTimeout(() => setPressed((p) => (p === lane ? null : p)), 90);
    const now = performance.now() - started.current;
    const target = notes.current.filter((n) => !n.hit && n.lane === lane && Math.abs(n.t - now) <= GOOD).sort((a, b) => Math.abs(a.t - now) - Math.abs(b.t - now))[0];
    if (!target) { stray.current += 1; setCombo(0); setJudge({ text: "빈 박자", key: now }); return; }
    target.hit = Math.abs(target.t - now) <= PERFECT ? "perfect" : "good";
    setCombo((c) => c + 1);
    setJudge({ text: target.hit === "perfect" ? "완벽" : "좋아요", key: now });
  };

  // 키보드: ← ↓ → 또는 A S D
  useEffect(() => {
    if (phase !== "play") return;
    const map: Record<string, number> = { ArrowLeft: 0, ArrowDown: 1, ArrowRight: 2, a: 0, s: 1, d: 2 };
    const onKey = (e: KeyboardEvent) => { const lane = map[e.key]; if (lane !== undefined && !e.repeat) { e.preventDefault(); tap(lane); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const need = major ? artsNeeded(career, major) : 0;
  const total = major ? artsTotal(career, major, score) : 0;

  return (
    <div className="fixed inset-0 z-[70] bg-bg flex flex-col" role="dialog" aria-modal="true" aria-label="예술고 실기 오디션">
      <div className="mx-auto w-full max-w-[480px] flex-1 min-h-0 flex flex-col px-5 pt-[calc(env(safe-area-inset-top)+16px)]">
        {phase === "pick" && (
          <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar pb-4">
            <h2 className="t-title">{event.title}</h2>
            <p className="t-body text-ink-2 mt-2">전공 능력과 실기 점수를 반씩 더해 {ARTS_PASS}점을 넘으면 합격이에요. 실기는 한 번만 볼 수 있어요.</p>
            <div className="flex flex-col gap-2 mt-5">
              {ARTS_MAJORS.map((m) => {
                const on = major?.id === m.id;
                const n = artsNeeded(career, m);
                return (
                  <button key={m.id} aria-pressed={on} onClick={() => setMajor(m)} className={cn("press w-full text-left rounded-2xl border-2 p-4", on ? "border-primary bg-primary-soft/50" : "border-transparent bg-card")}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="t-body font-bold">{m.name}</span>
                      <Chip tone={n <= 55 ? "ok" : n <= 75 ? "warn" : "danger"}>실기 {n}점 필요</Chip>
                    </div>
                    <p className="text-[13px] text-ink-2 mt-1">{m.description}</p>
                    <p className="text-[13px] text-ink-3 mt-1.5 tabular-nums">{m.stats.map((k) => `${STAT_NAMES[k]} ${career.stats[k]}`).join(" · ")} → 전공 능력 {Math.round(majorAbility(career, m))}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {phase === "ready" && major && (
          <div className="flex-1 flex flex-col justify-center">
            <p className="t-cap text-primary">{major.name} 실기</p>
            <h2 className="t-title mt-1">박자에 맞춰 눌러요</h2>
            <p className="t-body text-ink-2 mt-3">노트가 아래 선에 닿는 순간, 같은 줄의 버튼을 눌러요. 노트는 {NOTES}개, 20초쯤 걸려요.</p>
            <ul className="mt-5 rounded-2xl bg-card p-4 flex flex-col gap-1.5 text-[13px] text-ink-2">
              <li>· 선에 딱 맞추면 완벽, 조금 어긋나면 좋아요, 지나가면 놓침이에요.</li>
              <li>· 노트가 없을 때 누르면 점수가 깎여요.</li>
              <li>· 합격하려면 <b className="text-ink">{need}점</b> 이상이 필요해요.</li>
              <li>· 키보드는 ← ↓ → 또는 A S D.</li>
            </ul>
          </div>
        )}

        {phase === "play" && (
          <div className="flex-1 min-h-0 flex flex-col pb-3">
            <div className="flex items-center justify-between h-10 shrink-0">
              <span className="t-cap">{major?.name} 실기</span>
              <span className="t-cap tabular-nums" aria-live="off">{combo > 1 ? `${combo} 콤보` : ""}</span>
            </div>
            <div ref={field} className="relative flex-1 min-h-0 rounded-2xl bg-card overflow-hidden" aria-hidden>
              {Array.from({ length: LANES - 1 }, (_, i) => (
                <span key={i} className="absolute top-0 bottom-0 w-px bg-line" style={{ left: `${((i + 1) / LANES) * 100}%` }} />
              ))}
              <span className="absolute left-0 right-0 h-[3px] bg-ink/70" style={{ top: "86%" }} />
              {chart.map((n, i) => (
                <span key={i} ref={(el) => { noteEls.current[i] = el; }} className="absolute top-0 h-0 opacity-0 will-change-transform" style={{ left: `${(n.lane / LANES) * 100}%`, width: `${100 / LANES}%` }}>
                  <span className="absolute left-[14%] right-[14%] -top-[9px] h-[18px] rounded-full" style={{ background: LANE_COLORS[n.lane] }} />
                </span>
              ))}
              {judge && <span key={judge.key} className="fade-in absolute left-0 right-0 text-center text-[16px] font-extrabold" style={{ top: "70%" }}>{judge.text}</span>}
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3 shrink-0">
              {Array.from({ length: LANES }, (_, lane) => (
                <button key={lane} aria-label={`${lane + 1}번 줄`} onPointerDown={(e) => { e.preventDefault(); tap(lane); }} className="h-20 rounded-2xl touch-none select-none" style={{ background: LANE_COLORS[lane], opacity: pressed === lane ? 1 : 0.55 }} />
              ))}
            </div>
          </div>
        )}

        {phase === "done" && major && (
          <div className="flex-1 flex flex-col justify-center">
            <p className="t-cap">{major.name} 실기 점수</p>
            <p className="t-num mt-1 text-[44px]">{score}<span className="text-[16px] font-bold text-ink-3 ml-1">점</span></p>
            <div className="mt-5 rounded-2xl bg-card p-4 flex flex-col gap-2 text-[13px] tabular-nums">
              <div className="flex justify-between"><span className="text-ink-2">전공 능력</span><span className="font-bold">{Math.round(majorAbility(career, major))}</span></div>
              <div className="flex justify-between"><span className="text-ink-2">실기 점수</span><span className="font-bold">{score}</span></div>
              <div className="flex justify-between border-t border-line pt-2"><span className="text-ink-2">총점 (합격선 {ARTS_PASS})</span><span className={cn("font-bold", total >= ARTS_PASS ? "text-up" : "text-down")}>{total}</span></div>
            </div>
            <p className="t-body text-ink-2 mt-4">{total >= ARTS_PASS ? "합격선을 넘었어요. 결과를 확인해요." : "합격선에 못 미쳤어요. 결과를 확인하고 다른 길을 골라요."}</p>
          </div>
        )}
      </div>

      {phase !== "play" && (
        <div className="shrink-0 mx-auto w-full max-w-[480px] px-5 pt-2 pb-[calc(env(safe-area-inset-bottom)+16px)] border-t border-line bg-bg">
          {phase === "pick" && <Button disabled={!major} onClick={() => setPhase("ready")}>{major ? `${major.name} 실기 보러 가기` : "전공을 골라주세요"}</Button>}
          {phase === "ready" && major && (
            <>
              <Button onClick={() => setPhase("play")}>실기 시작</Button>
              <Button variant="ghost" className="mt-2" onClick={() => onChoose(major.id)}>실기 건너뛰기 (그날 컨디션에 맡겨요)</Button>
            </>
          )}
          {phase === "done" && major && <Button onClick={() => onChoose(major.id, { score })}>결과 확인하기</Button>}
        </div>
      )}
    </div>
  );
}
