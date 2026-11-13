"use client";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

type Props = { value: number; color?: string; height?: number; className?: string; label?: string };

/** Animated bar; mounts at 0 and eases to value so first paint also animates. */
export function ProgressBar({ value, color = "var(--primary)", height = 8, className = "", label }: Props) {
  const target = Math.max(0, Math.min(100, value));
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setWidth(target));
    return () => cancelAnimationFrame(id);
  }, [target]);
  return (
    <div
      className={`bar-track ${className}`}
      style={{ height }}
      role="progressbar"
      aria-valuenow={Math.round(target)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className="bar-fill" style={{ "--fill": `${width}%`, background: color } as CSSProperties} />
    </div>
  );
}
