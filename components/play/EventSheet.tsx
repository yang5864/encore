"use client";
import { useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { cn } from "@/lib/cn";
import { lineupRoles } from "@/lib/game/debut";
import { choiceLock } from "@/lib/game/engine";
import { EventArt } from "@/components/EventArt";
import type { Career, Signature } from "@/lib/game/types";
import { ContractView } from "./ContractView";
import { AlbumNamePicker } from "./AlbumNamePicker";
import { AwardShow } from "./AwardShow";
import { suggestAlbumName } from "@/lib/game/album";
import { artGroupFor, SAD_EVENTS } from "@/lib/game/format";

type Props = {
  career: Career;
  open: boolean;
  onChoose: (choiceId: string, extra?: { groupName?: string; signature?: Signature; albumName?: string; reaction?: string }) => void;
};

export function EventSheet({ career, open, onChoose }: Props) {
  const event = career.pending;
  const [selected, setSelected] = useState<string | null>(null);
  const [groupName, setGroupName] = useState("");
  const [contract, setContract] = useState(false);
  const [customAlbum, setCustomAlbum] = useState(false);
  const [albumName, setAlbumName] = useState("");
  if (!event) return null;
  // 시상식은 시트가 아니라 전체 화면 장면으로 진행한다
  if (event.id === "ceremony" && career.ceremony) return open ? <AwardShow career={career} event={event} onChoose={(id, extra) => onChoose(id, extra)} /> : null;
  const isAlbum = event.id === "debut-concept";
  const choice = event.choices.find((c) => c.id === selected) ?? null;
  const needsName = choice?.op === "debut" && !choice.sign;
  const canSubmit = !!choice && (!needsName || groupName.trim().length > 0) && (!isAlbum || !customAlbum || albumName.trim().length > 0);
  const declineChoice = event.choices.find((c) => c.op === "decline") ?? null;

  const submit = () => {
    if (!choice) return;
    if (choice.sign) {
      setContract(true);
      return;
    }
    onChoose(choice.id, { groupName: needsName ? groupName : undefined, albumName: isAlbum && customAlbum ? albumName : undefined });
    setSelected(null);
    setGroupName("");
    setAlbumName("");
    setCustomAlbum(false);
  };

  return (
    <Sheet open={open} dismissible={false} tall footer={contract && choice ? undefined : <Button disabled={!canSubmit} onClick={submit}>{choice ? (choice.sign ? "계약서 보기" : "이 선택으로 진행") : "선택지를 골라주세요"}</Button>}>
      {contract && choice ? (
        <ContractView
          career={career}
          event={event}
          choice={choice}
          onSign={(signature, name) => {
            onChoose(choice.id, { signature, groupName: name });
            setContract(false);
            setSelected(null);
          }}
          onDecline={() => {
            setContract(false);
            // 계약 제안 이벤트에는 거절 선택지가 있으므로 바로 거절로 처리한다
            if (declineChoice) {
              onChoose(declineChoice.id);
              setSelected(null);
            }
          }}
        />
      ) : (
        <>
          <div className="-mx-5 -mt-3">
            <EventArt scene={event.scene} avatar={career.avatar} gender={career.gender} name={career.name} mood={SAD_EVENTS.includes(event.id) ? "sad" : undefined} group={artGroupFor(career.lineup, event.scene)} />
          </div>
          <h2 className="t-title mt-4">{event.title}</h2>
          <p className="t-body text-ink-2 mt-2">{event.text}</p>

          <div className="flex flex-col gap-2 mt-5">
            {event.choices.map((ch, i) => {
              const locked = choiceLock(career, ch);
              const active = selected === ch.id;
              return (
                <button
                  key={ch.id}
                  disabled={!!locked}
                  onClick={() => setSelected(ch.id)}
                  className={cn("press fade-up w-full text-left rounded-2xl border-2 p-4", active ? "border-primary bg-primary-soft/50" : "border-transparent bg-sub", locked && "opacity-45")}
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="t-body font-bold">{ch.label}</span>
                    <div className="flex gap-1">
                      {ch.sign && <Chip tone="neutral">서명</Chip>}
                      <Chip tone={ch.risk === "bold" ? "warn" : "ok"}>{ch.risk === "bold" ? "도전" : "안정"}</Chip>
                    </div>
                  </div>
                  <p className="text-[13px] text-ink-2 mt-1">{locked ?? ch.hint}</p>
                  {ch.op === "debut" && career.lineup && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {[`${career.lineup.members}인조`, ...lineupRoles(career.lineup)].map((r) => (
                        <Chip key={r} tone="info">{r}</Chip>
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {isAlbum && (
            <div className="mt-4 fade-up">
              <p className="t-cap mb-2">앨범 이름</p>
              <AlbumNamePicker suggested={suggestAlbumName(career)} custom={customAlbum} name={albumName} onChange={(c, n) => { setCustomAlbum(c); setAlbumName(n); }} />
            </div>
          )}
          {needsName && (
            <div className="mt-4 fade-up">
              <label className="t-cap block mb-1.5" htmlFor="group-name">그룹 이름</label>
              <input id="group-name" value={groupName} onChange={(e) => setGroupName(e.target.value)} maxLength={20} placeholder="예: LUMINA" className="w-full h-14 rounded-2xl bg-chip px-4 text-[16px] font-bold outline-none focus:ring-2 focus:ring-primary" />
            </div>
          )}

        </>
      )}
    </Sheet>
  );
}
