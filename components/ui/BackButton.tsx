"use client";
import Link from "next/link";
import { cn } from "@/lib/cn";

const CHEVRON = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M15 5.5 8.5 12 15 18.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** 상단 뒤로가기. 링크면 href, 아니면 onClick. */
export function BackButton({ href, onClick, label = "뒤로", className }: { href?: string; onClick?: () => void; label?: string; className?: string }) {
  const cls = cn("press w-10 h-10 rounded-full bg-card text-ink flex items-center justify-center shrink-0", className);
  return href ? (
    <Link href={href} aria-label={label} className={cls}>{CHEVRON}</Link>
  ) : (
    <button type="button" onClick={onClick} aria-label={label} className={cls}>{CHEVRON}</button>
  );
}
