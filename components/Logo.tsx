"use client";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { logoMeta } from "@/lib/logos";

type Props = {
  /** file name under /public/logos without extension, e.g. "jyp" */
  id?: string | null;
  /** fallback text (initials) when no logo file exists */
  label: string;
  /** CI color for the tile tint and the initials fallback */
  color?: string;
  size?: number;
  className?: string;
  ext?: "png" | "svg";
  rounded?: "xl" | "full";
};

/**
 * Toss-style brand tile: a rounded square whose background is the company's CI color
 * muted into the current theme. Opaque app icons fill the tile with their own art.
 */
export function Logo({ id, label, color = "#6b7684", size = 40, className, ext, rounded = "xl" }: Props) {
  const [failed, setFailed] = useState(false);
  const meta = logoMeta(id);
  const tint = meta?.tint ?? color;
  const radius = rounded === "full" ? "rounded-full" : "rounded-[24%]";
  const tile = { width: size, height: size, background: `color-mix(in srgb, ${tint} 28%, var(--card))` };

  if (!id || failed) {
    return (
      <span className={cn("shrink-0 flex items-center justify-center font-extrabold", radius, className)} style={{ ...tile, color: `color-mix(in srgb, ${tint} 70%, var(--text))`, fontSize: Math.round(size * 0.3) }} aria-hidden>
        {label.slice(0, 2)}
      </span>
    );
  }
  const src = `/logos/${id}.${ext ?? meta?.ext ?? "png"}`;
  if (meta?.full) {
    return (
      <span className={cn("shrink-0 overflow-hidden", radius, className)} style={{ width: size, height: size, background: tint }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={label} width={size} height={size} className="block w-full h-full object-cover" onError={() => setFailed(true)} loading="lazy" />
      </span>
    );
  }
  return (
    <span className={cn("shrink-0 overflow-hidden flex items-center justify-center", radius, className)} style={tile}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={label} width={size} height={size} className="object-contain" style={{ width: size * 0.62, height: size * 0.62 }} onError={() => setFailed(true)} loading="lazy" />
    </span>
  );
}
