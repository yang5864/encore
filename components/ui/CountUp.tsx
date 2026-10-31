"use client";
import { useEffect, useRef, useState } from "react";

type Props = { value: number; format?: (n: number) => string; duration?: number; className?: string };

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/** Counts from the previously rendered value to the new value. */
export function CountUp({ value, format = (n) => Math.round(n).toLocaleString("ko-KR"), duration = 600, className }: Props) {
  const [shown, setShown] = useState(value);
  const fromRef = useRef(value);
  useEffect(() => {
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const from = fromRef.current;
    if (reduce || from === value) {
      fromRef.current = value;
      setShown(value);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setShown(from + (value - from) * easeOut(t));
      if (t < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <span className={className}>{format(shown)}</span>;
}
