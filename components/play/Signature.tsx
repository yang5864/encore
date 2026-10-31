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

/** Replays a stored signature with a drawing animation. Calls onDone when finished. */
export function SignatureReplay({ signature, play, onDone }: { signature: Signature; play: boolean; onDone?: () => void }) {
  const paths = useMemo(() => signature.strokes.map(toPath), [signature]);
  const refs = useRef<(SVGPathElement | null)[]>([]);
  const [lengths, setLengths] = useState<number[]>([]);

  useEffect(() => {
    setLengths(refs.current.map((p) => (p ? p.getTotalLength() : 0)));
  }, [paths]);

  const total = lengths.reduce((a, b) => a + b, 0);
  const duration = Math.min(1.8, Math.max(0.8, total / 400));
  useEffect(() => {
    if (!play || !onDone) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const id = window.setTimeout(onDone, reduce ? 50 : duration * 1000 + 250);
    return () => window.clearTimeout(id);
  }, [play, duration, onDone]);

  let offset = 0;
  return (
    <div className="rounded-2xl border-2 border-dashed border-line bg-sub overflow-hidden">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full block" style={{ aspectRatio: `${W} / ${H}` }} aria-label="저장된 서명" role="img">
        {paths.map((d, i) => {
          const len = lengths[i] ?? 0;
          const delay = total ? (offset / total) * duration : 0;
          const dur = total ? (len / total) * duration : 0;
          offset += len;
          return (
            <path
              key={i}
              ref={(el) => {
                refs.current[i] = el;
              }}
              d={d}
              fill="none"
              stroke="var(--primary)"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={
                lengths.length
                  ? {
                      strokeDasharray: len,
                      strokeDashoffset: play ? 0 : len,
                      transition: play ? `stroke-dashoffset ${dur}s linear ${delay}s` : "none",
                    }
                  : { opacity: 0 }
              }
            />
          );
        })}
      </svg>
    </div>
  );
}
