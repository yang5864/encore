"use client";
import { useEffect, useRef } from "react";

export type CelebrationKind = "win" | "daesang" | "award";

type Shape = "spark" | "ribbon" | "dust";
type Particle = {
  x: number; y: number; vx: number; vy: number;
  life: number; max: number; color: string; size: number; shape: Shape;
  spin: number; wobble: number; crackle?: boolean;
};

const FIREWORK_PALETTES: [string, string][] = [["#ffd166", "#fff3b0"], ["#ff5a66", "#ffb3b8"], ["#4593fc", "#bcd6ff"], ["#06d6a0", "#b3f0dd"], ["#c77dff", "#e5c8ff"]];
const CONFETTI_COLORS = ["#ff5a66", "#ffd166", "#4593fc", "#06d6a0", "#ff9f1c", "#c77dff", "#ff8fab", "#ffffff"];
const GOLD = ["#ffd700", "#ffe066", "#ffc300", "#fff3b0", "#e6b800", "#ffffff"];

/**
 * 축하 연출.
 * - win: 음악방송 1위. 꽃가루가 한 번 펑 터지며 천천히 흩날려 떨어진다.
 * - daesang: 대상·빌보드 1위·그래미·스타디움. 금빛 가루가 펑 터지며 반짝이며 떨어진다.
 * - award: 그 외 수상. 로켓 세 발이 차례로 올라가 큼직하게 피고, 불꽃이 반짝이며 느리게 진다.
 */
export function Fireworks({ kind = "award", duration, onDone }: { kind?: CelebrationKind; duration?: number; onDone?: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const total = duration ?? (kind === "award" ? 3800 : 3000);
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
    const rockets: { x: number; y: number; vy: number; vx: number; palette: [string, string]; explodeAt: number; trail: { x: number; y: number }[] }[] = [];

    const popConfetti = (x: number, y: number, n: number, colors: string[], shape: Shape) => {
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (R() - 0.5) * Math.PI * 1.3;
        const sp = shape === "dust" ? 2 + R() * 6 : 2.5 + R() * 6;
        parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, max: 170 + R() * 80, color: colors[Math.floor(R() * colors.length)], size: shape === "dust" ? 1.2 + R() * 2 : 4 + R() * 4, shape, spin: (R() - 0.5) * 0.15, wobble: R() * Math.PI * 2 });
      }
    };
    // 큼직하고 느린 꽃: 바깥 고리 + 안쪽 잔불. 꼬리는 그리지 않고 점만 반짝이게
    const bloom = (x: number, y: number, [main, light]: [string, string]) => {
      const n = 110;
      for (let i = 0; i < n; i++) {
        const a = (Math.PI * 2 * i) / n + (R() - 0.5) * 0.08;
        const ring = i % 3 !== 0;
        const sp = ring ? 3.4 + R() * 0.9 : 1 + R() * 2.4;
        parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, max: 95 + R() * 50, color: ring ? (R() < 0.3 ? light : main) : light, size: ring ? 1.8 + R() * 1.2 : 1.2 + R() * 0.8, shape: "spark", spin: 0, wobble: R() * Math.PI * 2, crackle: ring && R() < 0.15 });
      }
    };
    const launch = (x: number) => {
      rockets.push({ x, y: H() + 8, vx: (R() - 0.5) * 0.6, vy: -(10 + R() * 2), palette: FIREWORK_PALETTES[Math.floor(R() * FIREWORK_PALETTES.length)], explodeAt: H() * (0.2 + R() * 0.18), trail: [] });
    };

    const start = performance.now();
    let raf = 0;
    let shots = 0;
    let nextShot = 0;
    let popped = false;
    const SHOT_X = [0.5, 0.28, 0.72];
    if (reduce) {
      if (kind === "award") bloom(W() / 2, H() * 0.32, FIREWORK_PALETTES[0]);
      else popConfetti(W() / 2, H() * 0.3, 120, kind === "daesang" ? GOLD : CONFETTI_COLORS, kind === "daesang" ? "dust" : "ribbon");
    }

    const tick = (now: number) => {
      const t = now - start;
      if (!reduce) {
        if (kind === "award") {
          if (shots < 3 && t >= nextShot) { launch(W() * SHOT_X[shots]); shots += 1; nextShot = t + 650; }
        } else if (!popped) {
          popConfetti(W() * 0.5, H() * 0.2, kind === "daesang" ? 110 : 70, kind === "daesang" ? GOLD : CONFETTI_COLORS, kind === "daesang" ? "dust" : "ribbon");
          popped = true;
        }
      }
      ctx.clearRect(0, 0, W(), H());

      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.trail.push({ x: r.x, y: r.y });
        if (r.trail.length > 14) r.trail.shift();
        r.x += r.vx;
        r.y += r.vy;
        r.vy += 0.14;
        // 가늘게 사그라지는 꼬리
        for (let k = 0; k < r.trail.length; k++) {
          const p = r.trail[k];
          ctx.globalAlpha = (k / r.trail.length) * 0.5;
          ctx.fillStyle = "#fff1c2";
          ctx.beginPath(); ctx.arc(p.x, p.y, 1.2 + (k / r.trail.length) * 1.2, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath(); ctx.arc(r.x, r.y, 2.2, 0, Math.PI * 2); ctx.fill();
        if (r.y <= r.explodeAt || r.vy >= -1) { bloom(r.x, r.y, r.palette); rockets.splice(i, 1); }
      }

      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.life += 1;
        p.x += p.vx;
        p.y += p.vy;
        if (p.shape === "spark") {
          p.vy += 0.035; p.vx *= 0.982; p.vy *= 0.982; // 천천히 번지고 살짝 내려앉는다
          if (p.crackle && p.life === Math.floor(p.max * 0.6)) {
            for (let k = 0; k < 5; k++) parts.push({ x: p.x, y: p.y, vx: (R() - 0.5) * 1.6, vy: (R() - 0.5) * 1.6, life: 0, max: 22 + R() * 14, color: "#ffffff", size: 1, shape: "spark", spin: 0, wobble: R() * 6 });
          }
        } else if (p.shape === "ribbon") {
          p.vy = Math.min(p.vy + 0.1, 1.3 + R() * 0.4);
          p.vx = p.vx * 0.94 + Math.sin(p.life / 12 + p.wobble) * 0.3;
          p.spin += 0.012;
        } else {
          p.vy = Math.min(p.vy + 0.08, 1 + R() * 0.5);
          p.vx = p.vx * 0.95 + Math.sin(p.life / 10 + p.wobble) * 0.18;
        }
        const fade = p.shape === "spark" ? Math.pow(1 - p.life / p.max, 1.4) : p.life > p.max * 0.7 ? 1 - (p.life - p.max * 0.7) / (p.max * 0.3) : 1;
        ctx.globalAlpha = Math.max(0, fade);
        ctx.fillStyle = p.color;
        if (p.shape === "ribbon") {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.spin + p.wobble);
          const squash = Math.abs(Math.sin(p.life / 10 + p.wobble));
          ctx.fillRect(-p.size / 2, (-p.size / 4) * squash, p.size, (p.size / 2) * Math.max(0.15, squash));
          ctx.restore();
        } else if (p.shape === "dust") {
          const twinkle = 0.6 + 0.4 * Math.sin(p.life / 3 + p.wobble);
          ctx.globalAlpha = Math.max(0, fade) * twinkle;
          ctx.shadowColor = "#ffd700"; ctx.shadowBlur = 6;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
          ctx.shadowBlur = 0;
        } else {
          // 불꽃은 끝으로 갈수록 반짝이며 꺼진다
          const twinkle = p.life > p.max * 0.5 ? 0.55 + 0.45 * Math.sin(p.life / 2.2 + p.wobble) : 1;
          ctx.globalAlpha = Math.max(0, fade) * twinkle;
          ctx.shadowColor = p.color; ctx.shadowBlur = 4;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
          ctx.shadowBlur = 0;
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
