"use client";
import { useEffect, useState } from "react";
import { Avatar } from "./Avatar";
import { Card } from "./ui/Card";
import { eventArt } from "@/lib/art";
import { SHOWCASE_STEPS, showcaseAt } from "@/lib/art/showcase";
import { cn } from "@/lib/cn";

export function HomeShowcase() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((s) => (s + 1) % (SHOWCASE_STEPS.length * 6)), 2600);
    return () => clearInterval(id);
  }, []);

  const stage = showcaseAt(tick);
  const frames = eventArt(stage.scene, stage.avatar).frames;
  const artwork = stage.pose === undefined ? frames : [frames[stage.pose]];
  return (
    <Card className="mt-3 fade-up !px-5 !py-7" style={{ animationDelay: "80ms" }}>
      <div className="flex flex-col items-center">
        <div className="float" data-showcase-avatar={stage.avatar} data-showcase-step={stage.step}>
          <Avatar index={stage.avatar} frames={artwork} size={88} name={`${stage.label} 쇼케이스`} />
        </div>
        <p className="t-subhead mt-3">{stage.copy}</p>
      </div>
      <div className="relative mt-6 px-2">
        {/* 점은 48px 칸 가운데(양끝 8px 여백 포함 32px)에 있으므로 선도 거기서 시작하고 끝난다 */}
        <div className="absolute left-8 right-8 top-[7px] h-[2px] bg-chip" />
        <div className="absolute left-8 right-8 top-[7px] h-[2px] bg-primary origin-left transition-transform duration-700" style={{ transform: `scaleX(${stage.step / 4})` }} />
        <div className="relative flex justify-between">
          {SHOWCASE_STEPS.map(({ label }, i) => (
            <div key={label} className="flex flex-col items-center w-12">
              <span className={cn("w-4 h-4 rounded-full border-[3px] transition-colors duration-500", i <= stage.step ? "bg-primary border-primary" : "bg-card border-chip", i === stage.step && "ring-[5px] ring-primary/25")} />
              <span aria-current={i === stage.step ? "step" : undefined} className={cn("text-[13px] mt-2 whitespace-nowrap", i === stage.step ? "font-bold text-ink" : "text-ink-3")}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
