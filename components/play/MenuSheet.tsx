"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { Sheet } from "@/components/ui/Sheet";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { albumSummary } from "@/lib/game/album";
import { Logo } from "@/components/Logo";
import { periodLabel } from "@/lib/game/format";
import type { Career } from "@/lib/game/types";

type Props = {
  career: Career;
  open: boolean;
  onClose: () => void;
  onExport: () => void;
  onImport: (text: string) => string | null;
  onRetire: () => void;
  onReset: () => void;
};

export function MenuSheet({ career, open, onClose, onExport, onImport, onRetire, onReset }: Props) {
  const [view, setView] = useState<"menu" | "history" | "albums" | "confirmRetire" | "confirmReset">("menu");
  const fileRef = useRef<HTMLInputElement>(null);
  const close = () => {
    setView("menu");
    onClose();
  };
  return (
    <Sheet open={open} onOpenChange={(o) => !o && close()} title={view === "history" ? "커리어 기록" : view === "albums" ? "디스코그래피" : "메뉴"} tall={view !== "menu"}>
      {view === "menu" && (
        <div className="flex flex-col gap-2">
          <div className="rounded-2xl bg-sub p-4"><ThemeToggle /></div>
          <MenuItem label="커리어 기록" sub={`${career.history.length}개의 순간`} onClick={() => setView("history")} />
          <MenuItem label="디스코그래피" sub={career.albums.length ? `${career.albums.length}장의 앨범` : "아직 앨범이 없어요"} onClick={() => setView("albums")} />
          <MenuItem label="저장 파일 내보내기" sub="JSON으로 저장해 다른 기기에서 이어해요" onClick={onExport} />
          <MenuItem label="저장 파일 가져오기" sub="내보낸 파일로 현재 커리어를 교체해요" onClick={() => fileRef.current?.click()} />
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const err = onImport(await f.text());
              e.target.value = "";
              if (!err) close();
            }}
          />
          <Link href="/records" className="press block rounded-2xl bg-sub p-4">
            <p className="t-body font-bold">내 기록 · 명예의 전당</p>
            <p className="text-[13px] text-ink-3 mt-0.5">은퇴한 커리어 순위</p>
          </Link>
          <Link href="/guide" className="press block rounded-2xl bg-sub p-4">
            <p className="t-body font-bold">게임 가이드</p>
            <p className="text-[13px] text-ink-3 mt-0.5">진행 방법과 현실 고증 노트</p>
          </Link>
          {career.stage !== "retired" && <MenuItem label="은퇴하기" sub="마지막 앵콜 무대. 기록에 남아요" danger onClick={() => setView("confirmRetire")} />}
          <MenuItem label="새 커리어 시작" sub="현재 커리어를 지우고 처음부터" danger onClick={() => setView("confirmReset")} />
        </div>
      )}

      {view === "history" && (
        <div className="flex flex-col gap-2">
          {career.history.length === 0 && <p className="t-cap">아직 기록이 없어요.</p>}
          {career.history.map((h, i) => (
            <div key={i} className="rounded-2xl bg-sub p-4">
              <p className="text-[13px] text-ink-3">{periodLabel({ turn: h.turn })}</p>
              <p className="t-body font-bold mt-0.5">{h.title}</p>
              <p className="text-[13px] text-ink-2 mt-1">{h.text}</p>
            </div>
          ))}
          <Button variant="ghost" onClick={() => setView("menu")}>뒤로</Button>
        </div>
      )}

      {view === "albums" && (
        <div className="flex flex-col gap-2">
          {career.albums.length === 0 && <p className="t-cap">아직 앨범이 없어요.</p>}
          {[...career.albums].reverse().map((a) => (
            <div key={a.id} className="rounded-2xl bg-sub p-4 flex gap-3">
              <span className="w-12 h-12 rounded-xl shrink-0" style={{ background: `linear-gradient(135deg, #c4b2df, ${["#9bb5a5", "#d9a78d", "#9faed0", "#c9ba94"][a.quality % 4]})` }} />
              <div className="min-w-0">
                <p className="text-[13px] text-ink-3">{periodLabel({ turn: a.turn })}</p>
                <p className="t-body font-bold truncate">{a.name}</p>
                <p className="text-[13px] text-ink-2 mt-0.5">{albumSummary(a)}</p>
                <div className="flex gap-1.5 mt-1.5">
                  {a.melon !== null && <span className="flex items-center gap-1 text-[13px] font-bold text-ink-2"><Logo id="melon" label="멜론" size={16} rounded="full" /> {a.melon}위</span>}
                  {a.billboard !== null && <span className="flex items-center gap-1 text-[13px] font-bold text-ink-2"><Logo id="billboard" label="빌보드" size={16} rounded="full" /> Hot 100 {a.billboard}위</span>}
                </div>
              </div>
            </div>
          ))}
          <Button variant="ghost" onClick={() => setView("menu")}>뒤로</Button>
        </div>
      )}

      {view === "confirmRetire" && (
        <Confirm title="정말 은퇴할까요?" text="마지막 앵콜 무대를 마치고 커리어가 기록에 남아요. 되돌릴 수 없어요." label="은퇴하기" onYes={() => { onRetire(); close(); }} onNo={() => setView("menu")} />
      )}
      {view === "confirmReset" && (
        <Confirm title="새 커리어를 시작할까요?" text="진행 중인 인생가 지워져요. 먼저 저장 파일을 내보내 두면 나중에 가져올 수 있어요." label="지우고 새로 시작" onYes={() => { onReset(); close(); }} onNo={() => setView("menu")} />
      )}
    </Sheet>
  );
}

function MenuItem({ label, sub, onClick, danger }: { label: string; sub: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} className="press w-full text-left rounded-2xl bg-sub p-4">
      <p className={`t-body font-bold ${danger ? "text-down" : ""}`}>{label}</p>
      <p className="text-[13px] text-ink-3 mt-0.5">{sub}</p>
    </button>
  );
}

function Confirm({ title, text, label, onYes, onNo }: { title: string; text: string; label: string; onYes: () => void; onNo: () => void }) {
  return (
    <div className="fade-up">
      <h3 className="t-card">{title}</h3>
      <p className="t-body text-ink-2 mt-2">{text}</p>
      <div className="flex gap-2 mt-6">
        <Button variant="ghost" onClick={onNo}>취소</Button>
        <Button variant="danger" onClick={onYes}>{label}</Button>
      </div>
    </div>
  );
}
