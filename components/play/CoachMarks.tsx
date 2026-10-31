"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

const STEPS = [
  { title: "이번 반기 집중을 골라요", text: "반기마다 계획 하나만 정하면 돼요. 선택지마다 무엇이 오르고 내리는지 적혀 있어요." },
  { title: "반기 진행을 눌러요", text: "6개월이 흐르고 결과가 아래에서 올라와요. 중요한 순간에는 선택이 하나 더 나와요." },
  { title: "지표는 여섯 개와 OVR", text: "능력 6개의 평균이 OVR이에요. 팬·인기도·평판·컨디션이 커리어의 나머지를 말해줘요." },
];

export function CoachMarks({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const s = STEPS[i];
  return (
    <div className="fixed inset-0 z-[70] bg-black/55 flex items-end justify-center" role="dialog" aria-label="첫 플레이 안내">
      <div className="w-full max-w-[480px] bg-white rounded-t-[24px] p-6 pb-[calc(env(safe-area-inset-bottom)+24px)] pop-in">
        <div className="flex gap-1.5 mb-4">
          {STEPS.map((_, k) => (
            <span key={k} className={`h-1.5 rounded-full transition-all duration-300 ${k === i ? "w-6 bg-primary" : "w-1.5 bg-[#e5e8eb]"}`} />
          ))}
        </div>
        <p className="t-cap text-primary">{i + 1} / {STEPS.length}</p>
        <h3 className="t-title mt-1">{s.title}</h3>
        <p className="t-body text-ink-2 mt-2">{s.text}</p>
        <div className="flex gap-2 mt-6">
          <Button variant="ghost" onClick={onDone} full={false} className="px-5 shrink-0 whitespace-nowrap">건너뛰기</Button>
          <Button onClick={() => (i < STEPS.length - 1 ? setI(i + 1) : onDone())}>{i < STEPS.length - 1 ? "다음" : "시작하기"}</Button>
        </div>
      </div>
    </div>
  );
}
