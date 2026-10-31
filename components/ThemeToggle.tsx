"use client";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

export type ThemePref = "system" | "light" | "dark";
export const THEME_KEY = "encore2:theme";

export function readTheme(): ThemePref {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

export function applyTheme(pref: ThemePref) {
  const root = document.documentElement;
  if (pref === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", pref);
  try {
    if (pref === "system") localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, pref);
  } catch {
    /* private mode */
  }
}

const OPTIONS: { id: ThemePref; label: string }[] = [
  { id: "system", label: "시스템" },
  { id: "light", label: "라이트" },
  { id: "dark", label: "다크" },
];

/** Segmented control: 시스템 / 라이트 / 다크. Default follows the OS. */
export function ThemeToggle({ className }: { className?: string }) {
  const [pref, setPref] = useState<ThemePref>("system");
  useEffect(() => setPref(readTheme()), []);
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div>
        <p className="t-body font-bold">화면 테마</p>
        <p className="text-[13px] text-ink-3">기본은 기기 설정을 따라요</p>
      </div>
      <div className="grid grid-cols-3 bg-chip rounded-xl p-1" role="radiogroup" aria-label="화면 테마">
        {OPTIONS.map((o) => (
          <button
            key={o.id}
            role="radio"
            aria-checked={pref === o.id}
            onClick={() => {
              setPref(o.id);
              applyTheme(o.id);
            }}
            className={cn("press h-9 rounded-lg text-[13px] font-bold whitespace-nowrap", pref === o.id ? "bg-card text-ink shadow-sm" : "text-ink-3")}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
