"use client";
import { useState, type ReactNode } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/Logo";

const BANK = "토스뱅크";
const ACCOUNT = "1002-7412-8069";

/** Minimal donation sheet: account, copy, close. */
export function SupportSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${BANK} ${ACCOUNT}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()} title="후원하기" description="커피 한 잔이 다음 업데이트가 돼요">
      <div className="rounded-2xl bg-sub p-4 flex items-center gap-3">
        <Logo id="tossbank" label="토스뱅크" size={44} />
        <div className="min-w-0 flex-1">
          <p className="t-cap">{BANK}</p>
          <p className="text-[22px] font-extrabold tracking-[-0.02em] tabular-nums whitespace-nowrap">{ACCOUNT}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-4">
        <Button variant="ghost" onClick={onClose}>닫기</Button>
        <Button onClick={copy}>{copied ? "복사됐어요" : "계좌 복사"}</Button>
      </div>
    </Sheet>
  );
}

/** Wraps any trigger element; renders the sheet next to it. */
export function SupportTrigger({ children, className, "aria-label": ariaLabel }: { children: ReactNode; className?: string; "aria-label"?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className} aria-label={ariaLabel}>
        {children}
      </button>
      <SupportSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}
