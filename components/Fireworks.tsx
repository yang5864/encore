"use client";
import { useEffect, useRef } from "react";

export type CelebrationKind = "win" | "daesang" | "award";

type Shape = "spark" | "ribbon" | "dust";
type Particle = {
  x: number; y: number; vx: number; vy: number;
  life: number; max: number; color: string; size: number; shape: Shape;
  spin: number; wobble: number; trail?: boolean; crackle?: boolean;
};

const FIREWORK_COLORS = ["#ffd166", "#ff5a66", "#4593fc", "#06d6a0", "#ff9f1c", "#c77dff", "#ff8fab"];
const CONFETTI_COLORS = ["#ff5a66", "#ffd166", "#4593fc", "#06d6a0", "#ff9f1c", "#c77dff", "#ff8fab", "#ffffff"];
const GOLD = ["#ffd700", "#ffe066", "#ffc300", "#fff3b0", "#e6b800", "#ffffff"];

/**
 * 축하 연출.
 * - win: 음악방송 1위. 꽃가루가 위에서 펑 터지며 흩날려 떨어진다.
 * - daesang: 대상. 금빛 가루가 펑 터지며 반짝이며 떨어진다.
 * - award: 그 외 수상. 꼬리가 있는 폭죽이 올라가 터지고 잔불이 한 번 더 튄다.
 */
export function Fireworks({ kind = "award", duration, onDone }: { kind?: CelebrationKind; duration?: number; onDone?: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const total = duration ?? (kind === "award" ? 3200 : 3600);
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
    const R = Math.random;
    const parts: Particle[] = [];
    const rockets: { x: number; y: number; vy: number; color: string; explodeAt: number }[] = [];

    // ── 꽃가루 펑: 한 점에서 사방으로 터진 뒤 팔랑이며 떨어진다
    const popConfetti = (x: number, y: number, n: number, colors: string[], shape: Shape) => {
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (R() - 0.5) * Math.PI * 1.3;
        const sp = shape === "dust" ? 3 + R() * 9 : 4 + R() * 10;
        parts.push({
          x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
          life: 0, max: 150 + R() * 90, color: colors[Math.floor(R() * colors.length)],
          size: shape === "dust" ? 1.2 + R() * 2.2 : 5 + R() * 5, shape,
          spin: (R() - 0.5) * 0.3, wobble: R() * Math.PI * 2,
        });
      }
    };
    // ── 폭죽: 꼬리를 끌며 올라가 터지고, 일부 불꽃은 다시 한 번 잘게 튄다
    const explode = (x: number, y: number, color: string) => {
      const n = 90 + Math.floor(R() * 50);
      const ring = R() < 0.4;
      for (let i = 0; i < n; i++) {
        const a = (Math.PI * 2 * i) / n + R() * 0.15;
        const sp = ring ? 4.5 + R() * 0.8 : 1.5 + R() * 5;
        parts.push({
          x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, max: 55 + R() * 45,
          color: R() < 0.25 ? "#ffffff" : color, size: 1.4 + R() * 1.6, shape: "spark",
          spin: 0, wobble: 0, trail: true, crackle: R() < 0.12,
        });
      }
      for (let i = 0; i < 18; i++) parts.push({ x, y, vx: (R() - 0.5) * 2, vy: (R() - 0.5) * 2, life: 0, max: 18, color: "#ffffff", size: 2 + R() * 2, shape: "spark", spin: 0, wobble: 0 });
    };
    const launch = () => {
      const x = W() * (0.2 + R() * 0.6);
      rockets.push({ x, y: H() + 10, vy: -(9 + R() * 4), color: FIREWORK_COLORS[Math.floor(R() * FIREWORK_COLORS.length)], explodeAt: H() * (0.18 + R() * 0.3) });
    };

    const start = performance.now();
    let raf = 0;
    let nextShot = 0;
    let pops = 0;
    if (reduce) {
      if (kind === "award") explode(W() / 2, H() * 0.35, FIREWORK_COLORS[0]);
      else popConfetti(W() / 2, H() * 0.3, 120, kind === "daesang" ? GOLD : CONFETTI_COLORS, kind === "daesang" ? "dust" : "ribbon");
    }

    const tick = (now: number) => {
      const t = now - start;
      if (!reduce) {
        if (kind === "award") {
          if (t >= nextShot && t < total - 1100) { launch(); if (R() < 0.5) launch(); nextShot = t + 420 + R() * 380; }
        } else if (t >= nextShot && pops < 3) {
          const cx = W() * (pops === 0 ? 0.5 : pops === 1 ? 0.25 : 0.75);
          popConfetti(cx, H() * (pops === 0 ? 0.22 : 0.3), pops === 0 ? 220 : 120, kind === "daesang" ? GOLD : CONFETTI_COLORS, kind === "daesang" ? "dust" : "ribbon");
          pops += 1;
          nextShot = t + 450;
        }
      }
      ctx.clearRect(0, 0, W(), H());

      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.y += r.vy;
        r.vy += 0.12;
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = "#fff6d5";
        ctx.beginPath(); ctx.arc(r.x, r.y, 2, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 0.35;
        ctx.strokeStyle = r.color; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(r.x, r.y); ctx.lineTo(r.x + (R() - 0.5) * 2, r.y + 18); ctx.stroke();
        if (r.y <= r.explodeAt || r.vy >= 0) { explode(r.x, r.y, r.color); rockets.splice(i, 1); }
      }

      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.life += 1;
        p.x += p.vx;
        p.y += p.vy;
        if (p.shape === "spark") {
          p.vy += 0.07; p.vx *= 0.975; p.vy *= 0.985;
          if (p.crackle && p.life === Math.floor(p.max * 0.55)) {
            for (let k = 0; k < 6; k++) parts.push({ x: p.x, y: p.y, vx: (R() - 0.5) * 3, vy: (R() - 0.5) * 3, life: 0, max: 20 + R() * 15, color: "#ffffff", size: 1, shape: "spark", spin: 0, wobble: 0 });
          }
        } else if (p.shape === "ribbon") {
          p.vy = Math.min(p.vy + 0.14, 2.2 + R() * 0.6); // 공기 저항으로 금방 느려져 팔랑인다
          p.vx = p.vx * 0.93 + Math.sin(p.life / 9 + p.wobble) * 0.5;
          p.spin += 0.02;
        } else {
          p.vy = Math.min(p.vy + 0.1, 1.4 + R() * 0.8);
          p.vx = p.vx * 0.94 + Math.sin(p.life / 7 + p.wobble) * 0.25;
        }
        const fade = p.shape === "spark" ? 1 - p.life / p.max : p.life > p.max * 0.7 ? 1 - (p.life - p.max * 0.7) / (p.max * 0.3) : 1;
        ctx.globalAlpha = Math.max(0, fade);
        ctx.fillStyle = p.color;
        if (p.shape === "ribbon") {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.spin + p.wobble);
          const squash = Math.abs(Math.sin(p.life / 6 + p.wobble)); // 종이가 뒤집히며 얇아 보인다
          ctx.fillRect(-p.size / 2, (-p.size / 4) * squash, p.size, (p.size / 2) * Math.max(0.15, squash));
          ctx.restore();
        } else if (p.shape === "dust") {
          const twinkle = 0.6 + 0.4 * Math.sin(p.life / 3 + p.wobble);
          ctx.globalAlpha = Math.max(0, fade) * twinkle;
          ctx.shadowColor = "#ffd700"; ctx.shadowBlur = 6;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
          ctx.shadowBlur = 0;
        } else {
          if (p.trail) {
            ctx.globalAlpha = Math.max(0, fade) * 0.35;
            ctx.strokeStyle = p.color; ctx.lineWidth = p.size;
            ctx.beginPath(); ctx.moveTo(p.x - p.vx * 3, p.y - p.vy * 3); ctx.lineTo(p.x, p.y); ctx.stroke();
            ctx.globalAlpha = Math.max(0, fade);
          }
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
        }
        if (p.life >= p.max || p.y > H() + 20) parts.splice(i, 1);
      }
      ctx.globalAlpha = 1;
      if (t < total || parts.length || rockets.length) raf = requestAnimationFrame(tick);
      else onDone?.();
    };
    raf = requestAnimationFrame(tick);
    const stop = window.setTimeout(() => { cancelAnimationFrame(raf); onDone?.(); }, total + 2500);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(stop);
      window.removeEventListener("resize", resize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <canvas ref={ref} className="fixed inset-0 z-[80] pointer-events-none" aria-hidden />;
}
