"use client";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";

type Props = {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  description?: string;
  tall?: boolean;
  dismissible?: boolean;
  /** 스크롤 영역 밖에 항상 보이는 하단 버튼 영역 */
  footer?: ReactNode;
  /**
   * page: 화면 전체를 덮는 장면 (이벤트·결과·마일스톤). 이어지는 장면은 같은 자리에서 내용만 바뀐다.
   * panel: 아래쪽에 붙는 패널 (상점·정산·기획사·메뉴).
   */
  variant?: "panel" | "page";
  /** @deprecated 모든 시트가 제자리에서 나타나므로 더는 쓰지 않는다 */
  chained?: boolean;
  children: ReactNode;
};

// 열린 시트 수만큼 뒤 화면 스크롤을 잠근다 (pointer-events는 건드리지 않는다)
let locks = 0;
function lockScroll() {
  if (locks++ === 0) document.documentElement.style.overflow = "hidden";
  return () => { if (--locks === 0) document.documentElement.style.overflow = ""; };
}

/**
 * 앱의 모든 오버레이. 드래그도 미끄러짐도 없는 고정 패널이다:
 * 버튼은 나타난 자리에서 움직이지 않고(움직이는 버튼은 iOS가 탭을 버린다), 닫히면 바로 사라진다.
 */
export function Sheet({ open, onOpenChange, title, description, tall, dismissible = true, footer, variant = "panel", children }: Props) {
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const close = () => { if (dismissible) onOpenChange?.(false); };
  const closeRef = useRef(close);
  useEffect(() => { closeRef.current = close; });

  useEffect(() => {
    if (!open) return;
    const unlock = lockScroll();
    const before = document.activeElement as HTMLElement | null;
    panel.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeRef.current(); };
    document.addEventListener("keydown", onKey);
    return () => {
      unlock();
      document.removeEventListener("keydown", onKey);
      before?.focus?.({ preventScroll: true });
    };
  }, [open]);

  if (!open) return null;
  const page = variant === "page";
  return (
    <div className="fixed inset-0 z-50" data-sheet={variant}>
      {!page && <div className="sheet-in absolute inset-0 bg-black/40" onClick={close} aria-hidden />}
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : "내용"}
        tabIndex={-1}
        className={cn(
          "absolute left-0 right-0 bottom-0 mx-auto max-w-[480px] outline-none flex flex-col",
          page ? "top-0 bg-bg" : cn("sheet-in rounded-t-[24px] bg-card", tall ? "max-h-[92dvh]" : "max-h-[88dvh]"),
        )}
      >
        {/* 장면은 화면 폭 전체를 배경색으로 덮는다 (넓은 화면에서 뒤 화면이 비치지 않게) */}
        {page && <div className="fixed inset-0 -z-10 bg-bg" aria-hidden />}
        {(title || (!page && dismissible)) && (
          <div className={cn("px-5 shrink-0 flex items-start gap-3", page ? "pt-[calc(env(safe-area-inset-top)+16px)]" : "pt-5")}>
            <div className="min-w-0 flex-1">
              {title && <h2 id={titleId} className="t-title">{title}</h2>}
              {description && <p className="t-cap mt-1">{description}</p>}
            </div>
            {dismissible && (
              <button onClick={close} aria-label="닫기" className="press shrink-0 -mr-1.5 -mt-1 w-10 h-10 rounded-xl bg-chip text-ink-2 flex items-center justify-center">
                <Icon name="close" size={18} />
              </button>
            )}
          </div>
        )}
        <div className={cn("sheet-content px-5 overflow-y-auto no-scrollbar grow", page && !title ? "pt-[calc(env(safe-area-inset-top)+12px)]" : "pt-3", footer ? "pb-4" : "pb-[calc(env(safe-area-inset-bottom)+20px)]")}>{children}</div>
        {footer && (
          // 주 버튼은 항상 같은 자리에 있다
          <div className={cn("shrink-0 px-5 pt-2 pb-[calc(env(safe-area-inset-bottom)+16px)] border-t border-line", page ? "bg-bg" : "bg-card")}>{footer}</div>
        )}
      </div>
    </div>
  );
}
