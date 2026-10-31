"use client";
import { useState } from "react";
import { cn } from "@/lib/cn";

type Props = {
  /** file name under /public/logos without extension, e.g. "jyp" */
  id?: string | null;
  /** fallback text (initials) when no logo file exists */
  label: string;
  color?: string;
  size?: number;
  className?: string;
  /** svg logos (instagram/youtube/spotify) */
  ext?: "png" | "svg";
  rounded?: "xl" | "full";
};

/** Brand mark with graceful fallback to a colored initials tile. */
export function Logo({ id, label, color = "#33333b", size = 40, className, ext = "png", rounded = "xl" }: Props) {
  const [failed, setFailed] = useState(false);
  const radius = rounded === "full" ? "rounded-full" : "rounded-xl";
  if (!id || failed) {
    return (
      <span className={cn("shrink-0 flex items-center justify-center text-white font-extrabold", radius, className)} style={{ width: size, height: size, background: color, fontSize: Math.round(size * 0.3) }} aria-hidden>
        {label.slice(0, 2)}
      </span>
    );
  }
  return (
    <span className={cn("shrink-0 overflow-hidden bg-white flex items-center justify-center", radius, className)} style={{ width: size, height: size }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/logos/${id}.${ext}`} alt={label} width={size} height={size} className="object-contain" style={{ width: size * 0.78, height: size * 0.78 }} onError={() => setFailed(true)} loading="lazy" />
    </span>
  );
}
