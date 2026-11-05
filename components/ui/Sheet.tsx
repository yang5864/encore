"use client";
import { Drawer } from "vaul";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  description?: string;
  tall?: boolean;
  dismissible?: boolean;
  /** 스크롤 영역 밖에 항상 보이는 하단 버튼 영역 */
  footer?: ReactNode;
  children: ReactNode;
};

/** Toss-style bottom sheet. All overlays in the app go through this. */
export function Sheet({ open, onOpenChange, title, description, tall, dismissible = true, footer, children }: Props) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} dismissible={dismissible} repositionInputs={false} handleOnly>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Drawer.Content
          className={cn(
            // iOS 키보드가 올라오면 시트 아래로 뒤 화면이 비친다: 시트 배경을 아래로 길게 이어 틈을 덮는다
            "fixed left-0 right-0 bottom-0 z-50 mx-auto max-w-[480px] rounded-t-[24px] bg-card outline-none flex flex-col after:absolute after:top-full after:inset-x-0 after:h-[100dvh] after:bg-card after:content-['']",
            // 모든 시트는 내용 높이에 맞춘다. tall은 긴 목록을 위해 상한만 조금 더 준다
            tall ? "max-h-[92dvh]" : "max-h-[88dvh]",
          )}
        >
          <div className="pt-2.5 pb-1 flex justify-center shrink-0">
            <Drawer.Handle className="!h-1 !w-10 !rounded-full !bg-line !opacity-100" />
          </div>
          <div data-vaul-no-drag className="px-5 pt-2 shrink-0">
            {title ? <Drawer.Title className="t-title">{title}</Drawer.Title> : <Drawer.Title className="sr-only">시트</Drawer.Title>}
            {description ? (
              <Drawer.Description className="t-cap mt-1">{description}</Drawer.Description>
            ) : (
              <Drawer.Description className="sr-only">{title ?? "내용"}</Drawer.Description>
            )}
          </div>
          <div data-vaul-no-drag className={cn("px-5 pt-3 overflow-y-auto no-scrollbar grow", footer ? "pb-4" : "pb-[calc(env(safe-area-inset-bottom)+20px)]")}>{children}</div>
          {footer && (
            // 시트가 길어도 주 버튼은 항상 보인다
            <div data-vaul-no-drag className="shrink-0 px-5 pt-2 pb-[calc(env(safe-area-inset-bottom)+16px)] bg-card border-t border-line">{footer}</div>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
