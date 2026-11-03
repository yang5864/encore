"use client";
import { cn } from "@/lib/cn";

type Props = {
  suggested: string;
  custom: boolean;
  name: string;
  onChange: (custom: boolean, name: string) => void;
};

/** 앨범명: 소속사 제안 / 직접 입력 두 가지 중 하나. */
export function AlbumNamePicker({ suggested, custom, name, onChange }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <button type="button" onClick={() => onChange(false, "")} className={cn("press w-full text-left rounded-xl p-3 border-2", !custom ? "border-primary bg-primary-soft/50" : "border-transparent bg-chip")}>
        <p className="text-[13px] text-ink-3">소속사가 정해준 이름</p>
        <p className="text-[16px] font-bold">{suggested}</p>
      </button>
      <button type="button" onClick={() => onChange(true, name)} className={cn("press w-full text-left rounded-xl p-3 border-2", custom ? "border-primary bg-primary-soft/50" : "border-transparent bg-chip")}>
        <p className="text-[13px] text-ink-3">직접 입력하기</p>
        {custom ? (
          <input
            autoFocus
            value={name}
            onChange={(e) => onChange(true, e.target.value)}
            onClick={(e) => e.stopPropagation()}
            maxLength={20}
            placeholder="앨범 이름 (1~20자)"
            className="mt-1 w-full h-11 rounded-lg bg-card px-3 text-[16px] font-bold outline-none focus:ring-2 focus:ring-primary"
            aria-label="앨범 이름"
          />
        ) : (
          <p className="text-[16px] font-bold text-ink-3">내가 지은 이름으로</p>
        )}
      </button>
    </div>
  );
}
