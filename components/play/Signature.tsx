"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Signature } from "@/lib/game/types";

const W = 320;
const H = 140;

function toPath(stroke: [number, number][]) {
  if (!stroke.length) return "";
  const pts = stroke.map(([x, y]) => [x * W, y * H] as const);
  if (pts.length === 1) return `M${pts[0][0]},${pts[0][1]} l0.1,0`;
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const [px, py] = pts[i - 1];
    const [x, y] = pts[i];
    const mx = (px + x) / 2;
    const my = (py + y) / 2;
    d += ` Q${px.toFixed(1)},${py.toFixed(1)} ${mx.toFixed(1)},${my.toFixed(1)}`;
  }
  const last = pts[pts.length - 1];
  d += ` L${last[0].toFixed(1)},${last[1].toFixed(1)}`;
  return d;
}

/** Hand-drawn signature pad. Records strokes normalized to 0..1. */
export function SignaturePad({ onChange }: { onChange: (sig: Signature | null) => void }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [strokes, setStrokes] = useState<[number, number][][]>([]);
  const drawing = useRef(false);

  const point = (e: React.PointerEvent) => {
    const r = svgRef.current!.getBoundingClientRect();
    return [Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)), Math.max(0, Math.min(1, (e.clientY - r.top) / r.height))] as [number, number];
  };
  const start = (e: React.PointerEvent) => {
    e.preventDefault();
    drawing.current = true;
    svgRef.current?.setPointerCapture(e.pointerId);
    setStrokes((s) => [...s, [point(e)]]);
  };
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    e.preventDefault();
    const p = point(e);
    setStrokes((s) => {
      const copy = s.slice();
      copy[copy.length - 1] = [...copy[copy.length - 1], p];
      return copy;
    });
  };
  const end = () => {
    drawing.current = false;
  };
  useEffect(() => {
    const total = strokes.reduce((n, s) => n + s.length, 0);
    onChange(total >= 6 ? { strokes, signedAt: Date.now() } : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strokes]);

  return (
    <div>
      <div className="rounded-2xl border-2 border-dashed border-line bg-sub overflow-hidden" style={{ touchAction: "none" }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full block select-none"
          style={{ aspectRatio: `${W} / ${H}`, cursor: "crosshair" }}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
          onPointerLeave={end}
          aria-label="서명 칸"
          role="img"
        >
          {strokes.map((s, i) => (
            <path key={i} d={toPath(s)} fill="none" stroke="var(--text)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
          ))}
          {strokes.length === 0 && (
            <text x={W / 2} y={H / 2 + 5} textAnchor="middle" fontSize={13} fill="var(--text-3)">
              여기에 마우스나 손가락으로 서명해 주세요
            </text>
          )}
        </svg>
      </div>
      <div className="flex items-center justify-between mt-2">
        <p className="text-[13px] text-ink-3">직접 서명한 뒤 계약을 확정하세요</p>
        <button type="button" onClick={() => setStrokes([])} className="press h-9 px-3 rounded-lg bg-chip text-[13px] font-bold text-ink-2">
          지우고 다시 서명
        </button>
      </div>
    </div>
  );
}

/**
 * Replays a stored signature like a real pen: a faint preview sits in the box,
 * and on play the ink is drawn with a speed profile — fast on straight runs,
 * slowing into sharp turns, pausing briefly between strokes.
 */
export function SignatureReplay({ signature, play, onDone }: { signature: Signature; play: boolean; onDone?: () => void }) {
  const paths = useMemo(() => signature.strokes.map(toPath), [signature]);
  const refs = useRef<(SVGPathElement | null)[]>([]);
  const [lengths, setLengths] = useState<number[]>([]);
  const [drawn, setDrawn] = useState<number[]>([]);
  const doneRef = useRef(false);

  useEffect(() => {
    setLengths(refs.current.map((p) => (p ? p.getTotalLength() : 0)));
  }, [paths]);

  // Pen timeline: per-segment durations from length and turning angle.
  const timeline = useMemo(() => {
    const V = 520; // px/s on a straight run (viewBox units)
    const LIFT = 0.12; // seconds between strokes
    const strokes = signature.strokes.map((pts, si) => {
      const P = pts.map(([x, y]) => [x * W, y * H] as const);
      const segs: { len: number; dur: number }[] = [];
      let total = 0;
      for (let i = 1; i < P.length; i++) {
        const dx = P[i][0] - P[i - 1][0];
        const dy = P[i][1] - P[i - 1][1];
        const len = Math.hypot(dx, dy);
        let turn = 0;
        if (i >= 2) {
          const px = P[i - 1][0] - P[i - 2][0];
          const py = P[i - 1][1] - P[i - 2][1];
          const a = Math.atan2(dy, dx) - Math.atan2(py, px);
          turn = Math.abs(Math.atan2(Math.sin(a), Math.cos(a))); // 0..π
        }
        // slow down into corners, ease out of the stroke start
        const corner = 1 - Math.min(0.8, (turn / Math.PI) * 1.4);
        const ramp = Math.min(1, 0.35 + total / 40);
        const speed = V * corner * ramp;
        segs.push({ len, dur: len / Math.max(60, speed) });
        total += len;
      }
      const dur = segs.reduce((a, b) => a + b.dur, 0);
      return { segs, dur: Math.max(0.15, dur), lift: si === 0 ? 0 : LIFT };
    });
    const totalDur = strokes.reduce((a, s) => a + s.dur + s.lift, 0);
    return { strokes, totalDur };
  }, [signature]);

  useEffect(() => {
    if (!play) {
      setDrawn([]);
      doneRef.current = false;
      return;
    }
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setDrawn(lengths.map((l) => l));
      onDone?.();
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      let t = (now - start) / 1000;
      const out: number[] = [];
      for (let si = 0; si < timeline.strokes.length; si++) {
        const st = timeline.strokes[si];
        const len = lengths[si] ?? 0;
        if (t <= st.lift) {
          out.push(0);
          t = -1;
          continue;
        }
        t -= st.lift;
        if (t < 0) {
          out.push(0);
          continue;
        }
        if (t >= st.dur) {
          out.push(len);
          t -= st.dur;
          continue;
        }
        // map elapsed time inside the stroke to arc length through the segment table
        let elapsed = t;
        let arc = 0;
        for (const seg of st.segs) {
          if (elapsed >= seg.dur) {
            elapsed -= seg.dur;
            arc += seg.len;
          } else {
            arc += seg.len * (elapsed / seg.dur);
            break;
          }
        }
        const segTotal = st.segs.reduce((a, b) => a + b.len, 0) || 1;
        out.push((arc / segTotal) * len);
        t = -1;
      }
      setDrawn(out);
      const finished = now - start >= timeline.totalDur * 1000;
      if (!finished) raf = requestAnimationFrame(tick);
      else if (!doneRef.current) {
        doneRef.current = true;
        setDrawn(lengths.map((l) => l));
        window.setTimeout(() => onDone?.(), 250);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [play, lengths, timeline, onDone]);

  return (
    <div className="rounded-2xl border-2 border-dashed border-line bg-sub overflow-hidden">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full block" style={{ aspectRatio: `${W} / ${H}` }} aria-label="저장된 서명" role="img">
        {/* faint preview of the saved signature */}
        {paths.map((d, i) => (
          <path key={`ghost-${i}`} d={d} fill="none" stroke="var(--text-3)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" style={{ opacity: play ? 0.18 : 0.32 }} />
        ))}
        {/* live ink */}
        {paths.map((d, i) => {
          const len = lengths[i] ?? 0;
          return (
            <path
              key={i}
              ref={(el) => {
                refs.current[i] = el;
              }}
              d={d}
              fill="none"
              stroke="var(--primary)"
              strokeWidth={3.2}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={lengths.length ? { strokeDasharray: len, strokeDashoffset: len - (drawn[i] ?? 0) } : { opacity: 0 }}
            />
          );
        })}
      </svg>
    </div>
  );
}
