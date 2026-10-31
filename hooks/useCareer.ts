"use client";
import { useCallback, useEffect, useState } from "react";
import type { Career, Signature } from "@/lib/game/types";
import { GameError } from "@/lib/game/types";
import { advanceTurn, resolveChoice, applyToAgency, retireCareer } from "@/lib/game/engine";
import { addRecord, clearCareer, exportJSON, importJSON, loadCareer, saveCareer } from "@/lib/storage";

export function useCareer() {
  const [career, setCareer] = useState<Career | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCareer(loadCareer());
    setReady(true);
  }, []);

  const commit = useCallback((next: Career) => {
    setCareer(next);
    saveCareer(next);
    if (next.stage === "retired") addRecord(next);
  }, []);

  const run = useCallback(
    (fn: (c: Career) => Career) => {
      setError(null);
      setCareer((current) => {
        if (!current) return current;
        try {
          const next = fn(current);
          saveCareer(next);
          if (next.stage === "retired") addRecord(next);
          return next;
        } catch (e) {
          setError(e instanceof GameError ? e.message : "문제가 생겼어요. 다시 시도해주세요.");
          return current;
        }
      });
    },
    [],
  );

  return {
    career,
    ready,
    error,
    clearError: () => setError(null),
    commit,
    advance: (focusId: string) => run((c) => advanceTurn(c, focusId)),
    choose: (choiceId: string, extra?: { groupName?: string; signature?: Signature }) =>
      run((c) => {
        const next = resolveChoice(c, choiceId, { groupName: extra?.groupName });
        if (extra?.signature && !next.signature) next.signature = extra.signature;
        return next;
      }),
    apply: (agencyId: string) => run((c) => applyToAgency(c, agencyId)),
    retire: () => run((c) => retireCareer(c)),
    dismissResult: () => run((c) => ({ ...c, result: null })),
    reset: () => {
      clearCareer();
      setCareer(null);
    },
    exportFile: () => {
      if (!career) return;
      const blob = new Blob([exportJSON(career)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `encore-${career.name}-${career.turn}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },
    importFile: (text: string) => {
      try {
        const c = importJSON(text);
        commit(c);
        return null;
      } catch (e) {
        const msg = e instanceof GameError ? e.message : "파일을 읽을 수 없어요.";
        setError(msg);
        return msg;
      }
    },
  };
}
