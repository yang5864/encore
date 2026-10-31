"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/", label: "홈", icon: "M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" },
  { href: "/play", label: "플레이", icon: "M8 5v14l11-7z" },
  { href: "/records", label: "기록", icon: "M6 3h12v4a6 6 0 0 1-12 0zM4 5h2v2a4 4 0 0 1-2-2zm16 0h-2v2a4 4 0 0 0 2-2zM9 20h6v1H9zm2-6h2v6h-2z" },
  { href: "/support", label: "후원", icon: "M12 21s-7-4.6-9.3-8.6C.6 8.9 2.6 5 6.3 5c2 0 3.4 1.1 4.2 2.4h3C14.3 6.1 15.7 5 17.7 5c3.7 0 5.7 3.9 3.6 7.4C19 16.4 12 21 12 21z" },
  { href: "/guide", label: "전체", icon: "M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" },
];

/** Toss-style bottom tab bar for non-play screens. */
export function TabBar() {
  const path = usePathname();
  return (
    <nav className="fixed left-0 right-0 bottom-0 z-40" aria-label="주요 메뉴">
      <div className="mx-auto max-w-[480px] px-4 pb-[calc(env(safe-area-inset-bottom)+10px)]">
        <div className="rounded-[28px] bg-card/95 backdrop-blur border border-line flex items-center justify-around h-[64px] px-1">
          {TABS.map((t) => {
            const active = t.href === "/" ? path === "/" : path.startsWith(t.href);
            return (
              <Link key={t.href} href={t.href} className={cn("press flex flex-col items-center justify-center gap-0.5 w-14 h-12 rounded-2xl", active ? "bg-chip text-ink" : "text-ink-3")} aria-current={active ? "page" : undefined}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d={t.icon} />
                </svg>
                <span className="text-[11px] font-bold">{t.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
