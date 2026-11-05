"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { EventArt, PrefetchArt } from "@/components/EventArt";
import { eventArt } from "@/lib/art";
import { artGroupFor } from "@/lib/game/format";
import { brandTable } from "@/lib/game/brand-rank";
import { SHOW_FULL } from "@/lib/game/awards";
import type { ActiveEvent, Award, Career } from "@/lib/game/types";
import { cn } from "@/lib/cn";

/**
 * 시상식 장면 id. 아트 카탈로그에 같은 id의 장면이 있으면 그걸 쓰고, 없으면 기본 "awards" 장면으로 대신한다.
 * (카탈로그에 추가할 장면: awards-redcarpet, awards-stage, awards-seat, awards-announce, awards-win, awards-cry, awards-speech, awards-lose)
 */
function sceneIdFor(id: string, avatar: number, gender?: "female" | "male"): string {
  return eventArt(id, avatar, gender).scene === id ? id : "awards";
}
export const AWARD_SCENES = ["awards-redcarpet", "awards-stage", "awards-seat", "awards-announce", "awards-win", "awards-cry", "awards-speech", "awards-lose"];
const stepScene = (step: Step, reaction: Reaction | null) =>
  step.kind === "redcarpet" ? "awards-redcarpet" : step.kind === "stage" ? "awards-stage" : step.kind === "seat" ? "awards-seat" : step.kind === "announce" ? "awards-announce" : step.kind === "lose" ? "awards-lose" : step.kind === "win" ? (reaction === "cry" ? "awards-cry" : reaction === "calm" ? "awards-lose" : "awards-win") : "awards-speech";

type Step = { kind: "redcarpet" } | { kind: "stage"; name: string } | { kind: "seat"; award: Award | null } | { kind: "announce"; award: Award | null } | { kind: "win"; award: Award } | { kind: "lose" } | { kind: "speech"; award: Award };
type Reaction = "joy" | "cry" | "calm";

const rank = (a: Award) => (a.kind === "daesang" ? 3 : a.kind === "bonsang" ? 2 : 1);

/** 짧은 드럼롤 + 심벌. 에셋 없이 WebAudio로 만든다. */
function makeAudioContext(): AudioContext | null {
  const Ctx = typeof window !== "undefined" ? (window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext) : undefined;
  if (!Ctx) return null;
  try {
    const ctx = new Ctx();
    // iOS는 컨텍스트를 suspended로 시작시킨다: 사용자 제스처 안에서 resume해야 소리가 난다
    void ctx.resume?.();
    return ctx;
  } catch {
    return null;
  }
}

function drumroll(ctx: AudioContext, ms: number): () => void {
  void ctx.resume?.();
  const master = ctx.createGain();
  master.gain.value = 0.35;
  master.connect(ctx.destination);
  const start = ctx.currentTime;
  const hits = Math.floor(ms / 1000 * 14);
  for (let i = 0; i < hits; i++) {
    const t = start + (i / hits) * (ms / 1000) * (0.75 + 0.25 * (i / hits));
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let k = 0; k < data.length; k++) data[k] = (Math.random() * 2 - 1) * Math.pow(1 - k / data.length, 2);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.value = 0.25 + 0.75 * (i / hits);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 900;
    src.connect(lp).connect(g).connect(master);
    src.start(t);
  }
  // 심벌
  const end = start + ms / 1000;
  const cym = ctx.createBuffer(1, ctx.sampleRate * 0.8, ctx.sampleRate);
  const cd = cym.getChannelData(0);
  for (let k = 0; k < cd.length; k++) cd[k] = (Math.random() * 2 - 1) * Math.pow(1 - k / cd.length, 3);
  const cs = ctx.createBufferSource();
  cs.buffer = cym;
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 4000;
  const cg = ctx.createGain();
  cg.gain.value = 0.5;
  cs.connect(hp).connect(cg).connect(master);
  cs.start(end);
  return () => { try { master.disconnect(); } catch { /* ignore */ } };
}

export function AwardShow({ career, event, onChoose }: { career: Career; event: ActiveEvent; onChoose: (choiceId: string, extra?: { reaction?: string }) => void }) {
  const cm = career.ceremony!;
  const awards = useMemo(() => [...cm.awards].sort((a, b) => rank(a) - rank(b)), [cm.awards]); // 작은 상부터, 대상은 마지막
  const top = awards[awards.length - 1] ?? null;
  const rival = useMemo(() => brandTable(cm.year).filter((e) => e.name !== career.groupName)[0]?.name ?? "다른 팀", [cm.year, career.groupName]);
  const steps = useMemo<Step[]>(() => {
    const s: Step[] = [{ kind: "redcarpet" }];
    for (const name of cm.stages.slice(0, 1)) s.push({ kind: "stage", name });
    if (awards.length) {
      for (const a of awards) { s.push({ kind: "seat", award: a }); s.push({ kind: "announce", award: a }); s.push({ kind: "win", award: a }); }
      s.push({ kind: "speech", award: top! });
    } else {
      s.push({ kind: "seat", award: null }, { kind: "announce", award: null }, { kind: "lose" });
    }
    return s;
  }, [awards, cm.stages, top]);
  const [i, setI] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [reaction, setReaction] = useState<Reaction | null>(null);
  const [speech, setSpeech] = useState<string | null>(null);
  const stopRef = useRef<() => void>(() => {});
  const ctxRef = useRef<AudioContext | null>(null);
  useEffect(() => () => { try { void ctxRef.current?.close(); } catch { /* ignore */ } ctxRef.current = null; }, []);
  const step = steps[i];

  // 발표 장면: 두구두구 2.4초 뒤 호명
  useEffect(() => {
    if (step.kind !== "announce") return;
    setRevealed(false);
    if (!ctxRef.current) ctxRef.current = makeAudioContext();
    stopRef.current = ctxRef.current ? drumroll(ctxRef.current, 2400) : () => {};
    const t = window.setTimeout(() => setRevealed(true), 2500);
    return () => { window.clearTimeout(t); stopRef.current(); };
  }, [i, step.kind]);

  const next = () => {
    // 발표 장면으로 넘어가는 탭(사용자 제스처)에서 오디오 컨텍스트를 만들고 깨워 둔다
    if (!ctxRef.current) ctxRef.current = makeAudioContext();
    else void ctxRef.current.resume?.();
    setI((n) => Math.min(steps.length - 1, n + 1));
  };
  const sceneId = sceneIdFor(stepScene(step, reaction), career.avatar, career.gender);
  // 다음 장면(과 반응 분기)을 미리 받아 둔다
  const upcoming = [steps[i + 1], steps[i + 2]].filter(Boolean).flatMap((s) => (s.kind === "win" ? ["awards-win", "awards-cry", "awards-lose"] : [stepScene(s, reaction)]));
  const show = SHOW_FULL[cm.show] ?? cm.show;
  const name = career.groupName || career.name;

  const caption = (() => {
    switch (step.kind) {
      case "redcarpet": return { chip: `${cm.year} ${show}`, title: "레드카펫에 섰어요", text: `카메라 플래시가 쏟아져요. ${cm.stages.join(" · ")} 무대까지, 올해 가장 긴 밤이 시작돼요.` };
      case "stage": return { chip: step.name, title: "연말 무대", text: "올해의 타이틀곡을 특별 편곡으로 올렸어요. 객석의 응원봉이 한 색으로 물들었어요." };
      case "seat": return { chip: step.award ? step.award.name : "시상", title: step.award ? `${step.award.name} 발표를 앞두고` : "시상 부문 발표", text: "시상자가 봉투를 들고 무대에 올랐어요. 멤버들 손이 서로를 찾아요." };
      case "announce": return { chip: step.award ? step.award.name : "시상", title: revealed ? (step.award ? `${name}!` : `${rival}!`) : "두구두구두구…", text: revealed ? (step.award ? `"${cm.year} ${step.award.show} ${step.award.name}… ${name}!"` : `"${cm.year} ${show} 대상… ${rival}!" 객석에서 박수를 보냈어요.`) : `"올해 ${step.award ? step.award.name : "대상"}의 주인공은…"` };
      case "win": return { chip: step.award.name, title: "이름이 불렸어요", text: "멤버들이 서로를 끌어안았어요. 무대로 올라가는 길이 길게 느껴져요." };
      case "lose": return { chip: "수상 없음", title: "올해는 아니었어요", text: "박수를 보내며 자리에 앉았어요. 내년엔 저 자리에 서기로 했어요." };
      case "speech": return { chip: step.award.name, title: "수상소감", text: "마이크 앞에 섰어요. 첫 마디가 내년을 정해요." };
    }
  })();

  const canAdvance = step.kind !== "announce" || revealed;
  const isLast = i === steps.length - 1;
  const canSubmit = isLast && (step.kind === "lose" || (step.kind === "speech" && !!speech && !!reaction));

  return (
    <div className="fixed inset-0 z-[70] bg-[#111113] text-white flex flex-col" role="dialog" aria-label="연말 시상식">
      <div className="shell flex-1 flex flex-col pt-3 overflow-y-auto no-scrollbar">
        <div className="flex items-center justify-between h-12">
          <span className="text-[13px] text-white/50">{cm.year} {show}</span>
          <span className="text-[13px] text-white/40">{i + 1} / {steps.length}</span>
        </div>
        <div className="rounded-2xl overflow-hidden bg-black/40 aspect-[3/2] w-full shrink-0">
          <EventArt scene={sceneId} avatar={career.avatar} gender={career.gender} name={career.name} mood={step.kind === "lose" ? "sad" : step.kind === "win" || step.kind === "speech" ? "happy" : undefined} group={artGroupFor(career.lineup, "awards")} />
        </div>
        <PrefetchArt scenes={upcoming} avatar={career.avatar} gender={career.gender} />
        <div className="mt-6 text-center min-h-[220px]">
          <span key={`chip-${i}`} className="fade-up inline-block rounded-full bg-[#3a2b0f] text-[#f5b942] text-[13px] font-bold px-4 py-2">{caption.chip}</span>
          <h2 key={`t-${i}-${revealed}`} className="fade-up mt-4 font-extrabold tracking-[-0.02em] leading-[1.25] text-[22px]">{caption.title}</h2>
          <p key={`p-${i}-${revealed}`} className="fade-up mt-3 text-[16px] text-white/60 leading-relaxed">{caption.text}</p>
        </div>

        {step.kind === "win" && (
          <div className="mt-6 grid grid-cols-3 gap-2 fade-up">
            {([["joy", "환하게 웃는다"], ["cry", "눈물을 쏟는다"], ["calm", "담담하게 인사한다"]] as [Reaction, string][]).map(([id, label]) => (
              <button key={id} onClick={() => setReaction(id)} className={cn("press rounded-2xl p-3 text-[13px] font-bold", reaction === id ? "bg-white text-black" : "bg-white/10 text-white/80")}>{label}</button>
            ))}
          </div>
        )}
        {step.kind === "speech" && (
          <div className="mt-6 flex flex-col gap-2 fade-up">
            {event.choices.map((ch) => (
              <button key={ch.id} onClick={() => setSpeech(ch.id)} className={cn("press w-full text-left rounded-2xl border-2 p-4", speech === ch.id ? "border-[#f5b942] bg-[#f5b942]/10" : "border-transparent bg-white/[0.06]")}>
                <p className="text-[16px] font-bold">{ch.label}</p>
                <p className="text-[13px] text-white/60 mt-1">{ch.hint}</p>
              </button>
            ))}
          </div>
        )}

        <div className="mt-auto pt-6 pb-[calc(env(safe-area-inset-bottom)+16px)]">
          {isLast ? (
            <Button disabled={!canSubmit} onClick={() => onChoose(step.kind === "speech" ? speech! : event.choices[0].id, { reaction: reaction ?? undefined })}>
              {step.kind === "speech" ? (speech ? "소감을 말한다" : "소감을 골라주세요") : "시상식을 마친다"}
            </Button>
          ) : (
            <Button disabled={!canAdvance || (step.kind === "win" && !reaction)} onClick={next}>
              {step.kind === "announce" && !revealed ? "…" : step.kind === "win" && !reaction ? "반응을 골라주세요" : step.kind === "win" ? "무대로 올라간다" : "다음"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
