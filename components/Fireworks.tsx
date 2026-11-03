"use client";
import { useEffect, useRef } from "react";

type Particle = { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; size: number };

const COLORS = ["#ffd166", "#ff5a66", "#4593fc", "#06d6a0", "#ff9f1c", "#c77dff", "#ffffff"];

/** Canvas fireworks + confetti overlay. Plays for `duration` ms then calls onDone. */
export function Fireworks({ duration = 2800, onDone }: { duration?: number; onDone?: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);
    const W = () => window.innerWidth;
    const H = () => window.innerHeight;
    const parts: Particle[] = [];
    const burst = (x: number, y: number) => {
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      const n = 70 + Math.floor(Math.random() * 40);
      for (let i = 0; i < n; i++) {
        const a = (Math.PI * 2 * i) / n + Math.random() * 0.2;
        const sp = 2.2 + Math.random() * 3.8;
        parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, max: 60 + Math.random() * 40, color: Math.random() < 0.3 ? "#ffffff" : color, size: 1.5 + Math.random() * 1.5 });
      }
    };
    const confetti = () => {
      for (let i = 0; i < 90; i++) {
        parts.push({ x: Math.random() * W(), y: -10 - Math.random() * 60, vx: (Math.random() - 0.5) * 1.5, vy: 1.5 + Math.random() * 2.5, life: 0, max: 160 + Math.random() * 60, color: COLORS[Math.floor(Math.random() * COLORS.length)], size: 3 + Math.random() * 3 });
      }
    };
    const start = performance.now();
    let raf = 0;
    let nextBurst = 0;
    if (reduce) {
      burst(W() / 2, H() * 0.35);
    } else {
      confetti();
    }
    const tick = (now: number) => {
      const t = now - start;
      if (!reduce && t >= nextBurst && t < duration - 900) {
        burst(W() * (0.2 + Math.random() * 0.6), H() * (0.18 + Math.random() * 0.3));
        nextBurst = t + 320 + Math.random() * 380;
      }
      ctx.clearRect(0, 0, W(), H());
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.life += 1;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.size > 2.9 ? 0.02 : 0.06; // confetti drifts, sparks fall
        p.vx *= 0.985;
        const alpha = Math.max(0, 1 - p.life / p.max);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        if (p.size > 2.9) {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.life / 10) * (p.vx > 0 ? 1 : -1));
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          ctx.restore();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        if (p.life >= p.max || p.y > H() + 20) parts.splice(i, 1);
      }
      ctx.globalAlpha = 1;
      if (t < duration || parts.length) raf = requestAnimationFrame(tick);
      else onDone?.();
    };
    raf = requestAnimationFrame(tick);
    const stop = window.setTimeout(() => {
      cancelAnimationFrame(raf);
      onDone?.();
    }, duration + 1500);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(stop);
      window.removeEventListener("resize", resize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <canvas ref={ref} className="fixed inset-0 z-[80] pointer-events-none" aria-hidden />;
}
