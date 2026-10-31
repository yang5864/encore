"use client";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/Logo";
import { SignaturePad, SignatureReplay } from "./Signature";
import { contractTerms } from "@/lib/game/contracts";
import type { ActiveEvent, Career, ChoiceDef, Signature } from "@/lib/game/types";

type Props = {
  career: Career;
  event: ActiveEvent;
  choice: ChoiceDef;
  onSign: (signature: Signature, groupName?: string) => void;
  onDecline: () => void;
};

/** Toss/kickru-style contract: terms table, party card, signature, 거절/계약 buttons. */
export function ContractView({ career, event, choice, onSign, onDecline }: Props) {
  const terms = contractTerms(career, event, choice);
  const saved = career.signature ?? null;
  const [drawn, setDrawn] = useState<Signature | null>(null);
  const [groupName, setGroupName] = useState("");
  const [playing, setPlaying] = useState(false);
  const nameOk = !terms.needsGroupName || groupName.trim().length > 0;
  const canSign = nameOk && (saved ? !playing : !!drawn);

  const finish = useCallback(() => {
    if (saved) onSign(saved, terms.needsGroupName ? groupName : undefined);
  }, [saved, onSign, terms.needsGroupName, groupName]);

  const sign = () => {
    if (!canSign) return;
    if (saved) setPlaying(true);
    else if (drawn) onSign(drawn, terms.needsGroupName ? groupName : undefined);
  };

  return (
    <div className="fade-up">
      <h2 className="t-title">{terms.title}</h2>
      <p className="t-body text-ink-2 mt-2">{terms.text}</p>

      <div className="mt-5 flex flex-col">
        {terms.rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between py-3 border-b border-line last:border-0">
            <span className="text-[15px] text-ink-2">{r.label}</span>
            <span className={`text-[15px] font-bold text-right ${r.accent ? "text-primary" : ""}`}>{r.value}</span>
          </div>
        ))}
      </div>

      {terms.party && (
        <div className="mt-3 rounded-2xl bg-sub p-4">
          <div className="flex items-center gap-3">
            <Logo id={terms.party.logo} label={terms.party.name} color={terms.party.color} size={40} rounded="full" />
            <div className="min-w-0">
              <p className="t-body font-bold truncate">{terms.party.name}</p>
              <p className="text-[12px] text-ink-3 truncate">{terms.party.sub}</p>
            </div>
          </div>
          {terms.notes.length > 0 && (
            <ul className="mt-3 flex flex-col gap-1">
              {terms.notes.map((n) => (
                <li key={n} className="text-[13px] text-ink-2">· {n}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {terms.needsGroupName && (
        <div className="mt-4">
          <label className="t-cap block mb-1.5" htmlFor="contract-group-name">그룹 이름</label>
          <input
            id="contract-group-name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            maxLength={20}
            placeholder="예: LUMINA"
            className="w-full h-14 rounded-2xl bg-chip px-4 text-[17px] font-bold outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="text-[12px] text-ink-3 mt-1.5">1~20자 · 글자와 숫자</p>
        </div>
      )}

      <div className="mt-5">
        {saved ? (
          <>
            <p className="t-cap mb-2">{playing ? "저장된 서명을 넣고 있어요" : "계약하기를 누르면 저장된 서명이 자동으로 들어가요"}</p>
            <SignatureReplay signature={saved} play={playing} onDone={playing ? finish : undefined} />
          </>
        ) : (
          <>
            <p className="t-cap mb-2">아래 칸에 마우스나 손가락으로 직접 서명해 주세요. 이 커리어에서 한 번만 서명하면 돼요.</p>
            <SignaturePad onChange={setDrawn} />
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 mt-6">
        <Button variant="ghost" onClick={onDecline} disabled={playing}>
          거절하기
        </Button>
        <Button onClick={sign} disabled={!canSign}>
          {playing ? "서명 중…" : "계약하기"}
        </Button>
      </div>
    </div>
  );
}
