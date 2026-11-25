"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { eventArt, poseFrames, webSrc, type Pose } from "@/lib/art";
import { BEAT, COUNT_IN, GOOD, LANES, SONG_LENGTH, TRAVEL, judgeDelta, makeChart, nearestNote, noteMidi, rhythmScore, type Note } from "@/lib/game/rhythm";
import { startMusic, type Music } from "./music";

/**
 * 예술고 실기 리듬 게임 화면.
 * 위: 연습실 무대에서 내 아바타가 박자에 맞춰 춤춘다 (박마다 들썩이고, 치는 줄에 따라 동작이 바뀌고, 놓치면 울상).
 * 아래: 3줄 노트 길. 노트가 판정선에 닿을 때 같은 줄 패드를 누른다.
 * 노트 위치·아바타 움직임은 프레임마다 DOM을 직접 바꾼다 (리렌더 없이 60fps). 시계는 반주 오디오 시계.
 */
const LANE_COLORS = ["var(--primary)", "var(--up)", "var(--warn)"];
const LANE_KEYS = ["←", "↓", "→"];
const POSES: Pose[] = ["idle", "blink", "sing", "dance", "happy", "sad"];
/** 판정선 위치 (노트 길 높이 대비) */
const LINE = 0.88;

type Judgement = { text: string; tone: "perfect" | "good" | "miss" | "stray"; key: number };

export function RhythmStage({ avatar, gender, seed, label, audio, onFinish }: { avatar: number; gender: "female" | "male"; seed: number; label: string; /** 시작 버튼을 누를 때 만든 오디오 (iOS는 탭 안에서 만들어야 소리가 난다). 없으면 소리 없이 화면 시계로 */ audio: AudioContext | null; onFinish: (score: number) => void }) {
  const chart = useMemo(() => makeChart(seed), [seed]);
  const frames = useMemo(() => poseFrames(avatar), [avatar]);
  const background = useMemo(() => webSrc(eventArt("practice", avatar, gender).background), [avatar, gender]);
  const [judge, setJudge] = useState<Judgement | null>(null);
  const [combo, setCombo] = useState(0);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [count, setCount] = useState<number | null>(COUNT_IN);
  const [bursts, setBursts] = useState<{ lane: number; key: number; perfect: boolean }[]>([]);

  const notes = useRef<Note[]>([]);
  const stray = useRef(0);
  const comboRef = useRef(0);
  const music = useRef<Music | null>(null);
  const t0 = useRef(0);
  const field = useRef<HTMLDivElement>(null);
  const noteEls = useRef<(HTMLSpanElement | null)[]>([]);
  const padEls = useRef<(HTMLButtonElement | null)[]>([]);
  const dancer = useRef<HTMLDivElement>(null);
  const poseEls = useRef<Partial<Record<Pose, HTMLImageElement | null>>>({});
  const progress = useRef<HTMLDivElement>(null);
  const spot = useRef<HTMLDivElement>(null);
  // 춤 상태: 지금 포즈, 마지막으로 친 시각·줄, 점프 크기, 울상이 풀리는 시각
  const move = useRef({ pose: "idle" as Pose, hitAt: -9999, lane: 1, jump: 0, sadUntil: -1, lastBeat: -1, flip: 1 });
  const done = useRef(false);

  const now = () => (music.current ? music.current.now() : performance.now() - t0.current);
  const reduced = typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const setPose = (p: Pose) => {
    if (move.current.pose === p) return;
    move.current.pose = p;
    for (const k of POSES) { const el = poseEls.current[k]; if (el) el.style.opacity = k === p ? "1" : "0"; }
  };

  const updateAccuracy = () => {
    const judged = notes.current.filter((n) => n.hit);
    if (judged.length) setAccuracy(rhythmScore(judged, stray.current));
  };

  // 시작: 반주를 예약하고 프레임 루프를 돈다 (반주가 안 되면 화면 시계로)
  useEffect(() => {
    notes.current = chart.map((n) => ({ ...n }));
    stray.current = 0;
    comboRef.current = 0;
    done.current = false;
    music.current = audio ? startMusic(audio) : null;
    t0.current = performance.now() + 250;
    const mountedAt = performance.now();
    let raf = 0;
    const loop = () => {
      // 오디오가 막혀 시계가 멈춰 있으면 (자동 재생 차단·백그라운드) 소리 없이 화면 시계로 진행한다
      if (music.current && music.current.ctx.state !== "running" && performance.now() - mountedAt > 500 && music.current.now() < 0) {
        music.current.stop();
        music.current = null;
        t0.current = performance.now() + 250;
      }
      const t = now();
      const h = field.current?.clientHeight ?? 0;
      // 노트
      notes.current.forEach((n, i) => {
        const el = noteEls.current[i];
        if (!el) return;
        const p = 1 - (n.t - t) / TRAVEL;
        const visible = !n.hit && p > -0.05 && p < 1.12;
        el.style.opacity = visible ? String(Math.min(1, 0.35 + p)) : "0";
        if (visible) el.style.transform = `translate3d(0, ${p * h * LINE}px, 0) scale(${0.72 + 0.28 * Math.min(1, Math.max(0, p))})`;
        if (!n.hit && t - n.t > GOOD) {
          n.hit = "miss";
          comboRef.current = 0;
          setCombo(0);
          setJudge({ text: "놓침", tone: "miss", key: t });
          move.current.sadUntil = t + 420;
          music.current?.miss();
          updateAccuracy();
        }
      });
      // 카운트다운 (곡 첫 4박)
      const beatNo = Math.floor(t / BEAT);
      if (beatNo < COUNT_IN) setCount(beatNo < 0 ? COUNT_IN : COUNT_IN - beatNo);
      else setCount(null);
      // 진행 막대 · 조명 맥박
      if (progress.current) progress.current.style.transform = `scaleX(${Math.max(0, Math.min(1, t / SONG_LENGTH))})`;
      const phase = ((t % BEAT) + BEAT) % BEAT / BEAT;
      if (spot.current && !reduced) spot.current.style.opacity = String(0.55 + 0.45 * Math.pow(1 - phase, 3));
      // 춤: 박마다 들썩이고, 친 줄 쪽으로 기울고, 잘 치면 점프
      const m = move.current;
      if (t >= m.sadUntil && m.pose === "sad") setPose("idle");
      if (beatNo !== m.lastBeat) {
        m.lastBeat = beatNo;
        if (t >= m.sadUntil && t - m.hitAt > BEAT * 0.9) setPose(beatNo >= COUNT_IN && beatNo % 2 === 0 ? "dance" : beatNo % 8 === 7 ? "blink" : "idle");
      }
      if (dancer.current && !reduced) {
        const since = t - m.hitAt;
        const bounce = Math.abs(Math.sin(Math.PI * phase)) * (t >= COUNT_IN * BEAT ? 3.5 : 1.5);
        const jump = m.jump * Math.exp(-since / 170);
        const lean = (m.lane - 1) * 7 * Math.exp(-since / 260);
        const squash = 1 + 0.035 * Math.pow(1 - phase, 4);
        dancer.current.style.transform = `translate3d(0, ${-(bounce + jump)}%, 0) rotate(${lean}deg) scale(${m.flip * squash}, ${2 - squash})`;
      }
      // 끝
      if (t > SONG_LENGTH + 500 && !done.current) {
        done.current = true;
        const score = rhythmScore(notes.current, stray.current);
        window.setTimeout(() => onFinish(score), 700);
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); music.current?.stop(); music.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chart]);

  const tap = (lane: number) => {
    if (done.current) return;
    const pad = padEls.current[lane];
    if (pad) { pad.dataset.pressed = "1"; window.setTimeout(() => { delete pad.dataset.pressed; }, 110); }
    const t = now();
    const note = nearestNote(notes.current, lane, t);
    const verdict = note ? judgeDelta(t - note.t) : null;
    const m = move.current;
    if (!note || !verdict) {
      stray.current += 1;
      comboRef.current = 0;
      setCombo(0);
      setJudge({ text: "빈 박자", tone: "stray", key: t });
      updateAccuracy();
      return;
    }
    note.hit = verdict;
    comboRef.current += 1;
    setCombo(comboRef.current);
    setJudge({ text: verdict === "perfect" ? "완벽" : "좋아요", tone: verdict, key: t });
    setBursts((b) => [...b.slice(-5), { lane, key: t, perfect: verdict === "perfect" }]);
    music.current?.hit(noteMidi(note), verdict === "perfect");
    // 동작: 왼쪽은 춤, 가운데는 노래, 오른쪽은 춤을 거울처럼. 8콤보마다 활짝 웃으며 크게 뛴다
    const streak = comboRef.current > 0 && comboRef.current % 8 === 0;
    m.hitAt = t;
    m.lane = lane;
    m.flip = lane === 2 ? -1 : 1;
    m.jump = streak ? 9 : verdict === "perfect" ? 5 : 3;
    m.sadUntil = -1;
    setPose(streak ? "happy" : lane === 1 ? "sing" : "dance");
    updateAccuracy();
  };

  // 키보드: ← ↓ → 또는 A S D
  useEffect(() => {
    const map: Record<string, number> = { ArrowLeft: 0, ArrowDown: 1, ArrowRight: 2, a: 0, s: 1, d: 2 };
    const onKey = (e: KeyboardEvent) => { const lane = map[e.key]; if (lane !== undefined && !e.repeat) { e.preventDefault(); tap(lane); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toneColor = judge?.tone === "perfect" ? "text-gold" : judge?.tone === "good" ? "text-primary" : "text-down";

  return (
    <div className="flex-1 min-h-0 flex flex-col pb-3 select-none" aria-label={`${label} 실기`}>
      {/* 진행 · 정확도 */}
      <div className="flex items-center gap-3 h-10 shrink-0">
        <span className="t-cap whitespace-nowrap">{label}</span>
        <div className="flex-1 h-1 rounded-full bg-line overflow-hidden" aria-hidden>
          <div ref={progress} className="h-full bg-primary origin-left" style={{ transform: "scaleX(0)" }} />
        </div>
        <span className="t-cap tabular-nums whitespace-nowrap" aria-live="off">{accuracy === null ? "정확도 –" : `정확도 ${accuracy}`}</span>
      </div>

      {/* 무대: 내 아바타가 춤춘다 */}
      <div className="relative shrink-0 h-[34%] min-h-[180px] rounded-2xl overflow-hidden bg-stage" aria-hidden>
        <img src={background} alt="" className="absolute inset-0 w-full h-full object-cover opacity-55" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/10 to-black/60" />
        <div ref={spot} className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 45% 70% at 50% 100%, color-mix(in srgb, var(--gold) 38%, transparent), transparent 70%)" }} />
        <div className="absolute inset-x-0 bottom-0 h-[92%] flex justify-center">
          <div ref={dancer} className="relative h-full aspect-square origin-bottom will-change-transform">
            {POSES.map((p) => (
              <img key={p} ref={(el) => { poseEls.current[p] = el; }} src={webSrc(frames[p].url)} alt="" className="absolute inset-0 w-full h-full object-contain" style={{ opacity: p === "idle" ? 1 : 0 }} />
            ))}
          </div>
        </div>
        {judge && (
          <span key={judge.key} className={`judge-pop absolute left-0 right-0 top-[14%] text-center text-[22px] font-extrabold tracking-[-0.02em] ${toneColor}`}>{judge.text}</span>
        )}
        {combo >= 3 && <span className="absolute right-3 top-3 rounded-full bg-black/45 px-3 py-1.5 text-[13px] font-bold text-white tabular-nums">{combo} 콤보</span>}
        {count !== null && <span key={count} className="judge-pop absolute inset-0 flex items-center justify-center text-[56px] font-extrabold text-white/90">{count}</span>}
      </div>

      {/* 노트 길 */}
      <div className="relative flex-1 min-h-0 mt-3 [perspective:700px]" aria-hidden>
        <div ref={field} className="absolute inset-0 rounded-2xl overflow-hidden bg-card [transform:rotateX(14deg)] origin-bottom">
          {Array.from({ length: LANES }, (_, i) => (
            <span key={i} className="absolute top-0 bottom-0" style={{ left: `${(i / LANES) * 100}%`, width: `${100 / LANES}%`, background: `linear-gradient(to bottom, transparent, color-mix(in srgb, ${LANE_COLORS[i]} 10%, transparent))` }} />
          ))}
          {Array.from({ length: LANES - 1 }, (_, i) => (
            <span key={i} className="absolute top-0 bottom-0 w-px bg-line" style={{ left: `${((i + 1) / LANES) * 100}%` }} />
          ))}
          {/* 판정선과 받는 자리 */}
          <span className="absolute left-0 right-0 h-[2px] bg-white/40" style={{ top: `${LINE * 100}%` }} />
          {Array.from({ length: LANES }, (_, i) => (
            <span key={i} className="absolute -translate-y-1/2 rounded-full border-2" style={{ top: `${LINE * 100}%`, left: `calc(${((i + 0.5) / LANES) * 100}% - 26px)`, width: 52, height: 22, borderColor: LANE_COLORS[i] }} />
          ))}
          {bursts.map((b) => (
            <span key={b.key} className="hit-burst absolute -translate-y-1/2 rounded-full" style={{ top: `${LINE * 100}%`, left: `calc(${((b.lane + 0.5) / LANES) * 100}% - 34px)`, width: 68, height: 30, border: `3px solid ${b.perfect ? "var(--gold)" : LANE_COLORS[b.lane]}` }} />
          ))}
          {chart.map((n, i) => (
            <span key={i} ref={(el) => { noteEls.current[i] = el; }} className="absolute top-0 h-0 opacity-0 will-change-transform" style={{ left: `${(n.lane / LANES) * 100}%`, width: `${100 / LANES}%` }}>
              <span className="absolute left-[18%] right-[18%] -top-[11px] h-[22px] rounded-full" style={{ background: `linear-gradient(to bottom, color-mix(in srgb, ${LANE_COLORS[n.lane]} 70%, white), ${LANE_COLORS[n.lane]})`, boxShadow: `0 4px 12px color-mix(in srgb, ${LANE_COLORS[n.lane]} 45%, transparent)` }} />
            </span>
          ))}
        </div>
      </div>

      {/* 패드 */}
      <div className="grid grid-cols-3 gap-2 mt-3 shrink-0">
        {Array.from({ length: LANES }, (_, lane) => (
          <button
            key={lane}
            ref={(el) => { padEls.current[lane] = el; }}
            aria-label={`${lane + 1}번 줄 (${LANE_KEYS[lane]})`}
            onPointerDown={(e) => { e.preventDefault(); tap(lane); }}
            className="rhythm-pad h-20 rounded-2xl touch-none select-none text-[16px] font-bold text-white/85"
            style={{ background: LANE_COLORS[lane] }}
          >
            {LANE_KEYS[lane]}
          </button>
        ))}
      </div>
    </div>
  );
}
