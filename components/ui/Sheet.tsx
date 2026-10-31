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
  children: ReactNode;
};

/** Toss-style bottom sheet. All overlays in the app go through this. */
export function Sheet({ open, onOpenChange, title, description, tall, dismissible = true, children }: Props) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} dismissible={dismissible} repositionInputs={false}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Drawer.Content
          className={cn(
            "fixed left-0 right-0 bottom-0 z-50 mx-auto max-w-[480px] rounded-t-[24px] bg-card outline-none flex flex-col",
            tall ? "h-[92dvh]" : "max-h-[88dvh]",
          )}
        >
          <div className="pt-2.5 pb-1 flex justify-center shrink-0">
            <div aria-hidden className="h-1 w-10 rounded-full bg-line" />
          </div>
          <div className="px-5 pt-2 shrink-0">
            {title ? <Drawer.Title className="t-title">{title}</Drawer.Title> : <Drawer.Title className="sr-only">시트</Drawer.Title>}
            {description ? (
              <Drawer.Description className="t-cap mt-1">{description}</Drawer.Description>
            ) : (
              <Drawer.Description className="sr-only">{title ?? "내용"}</Drawer.Description>
            )}
          </div>
          <div className="px-5 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-3 overflow-y-auto no-scrollbar grow">{children}</div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
