"use client";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { MilestoneBar } from "./MilestoneBar";
import { MILESTONES } from "@/lib/game/milestones";
import type { Career, MilestoneId } from "@/lib/game/types";

export function MilestoneSheet({ career, id, open, onClose }: { career: Career; id: MilestoneId | null; open: boolean; onClose: () => void }) {
  const m = MILESTONES.find((x) => x.id === id);
  if (!m) return null;
  return (
    <Sheet open={open} dismissible={false} tall>
      <div className="flex flex-col items-center text-center h-full justify-center pb-10">
        <p className="t-cap text-primary pop-in">MILESTONE</p>
        <h2 className="pop-in mt-3 text-[22px] font-extrabold tracking-[-0.03em] leading-tight" style={{ animationDelay: "80ms" }}>
          {m.title}
        </h2>
        <p className="t-body text-ink-2 mt-4 max-w-[300px] fade-up" style={{ animationDelay: "160ms" }}>
          {m.text}
        </p>
        <div className="w-full mt-10 fade-up" style={{ animationDelay: "260ms" }}>
          <MilestoneBar career={career} />
        </div>
        <div className="w-full mt-10">
          <Button onClick={onClose}>계속</Button>
        </div>
      </div>
    </Sheet>
  );
}
