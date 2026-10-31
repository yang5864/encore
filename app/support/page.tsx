"use client";
import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/Logo";

const BANK = "토스뱅크";
const ACCOUNT = "1002-7412-8069";
const ACCOUNT_DIGITS = ACCOUNT.replace(/-/g, "");
const PRESETS = [1000, 3000, 5000, 10000];

export default function SupportPage() {
  const [copied, setCopied] = useState(false);
  const [amount, setAmount] = useState<number>(3000);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${BANK} ${ACCOUNT}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  // 토스 송금 딥링크 (토스 QR 송금과 같은 형식). 토스 앱이 없으면 아무 일도 일어나지 않으므로 계좌 복사가 기본 동선이다.
  const tossLink = `supertoss://send?amount=${amount}&bank=${encodeURIComponent(BANK)}&accountNo=${ACCOUNT_DIGITS}&origin=qr`;

  return (
    <main className="shell pt-3">
      <header className="flex items-center h-12 gap-3">
        <Link href="/" aria-label="홈" className="press w-10 h-10 rounded-xl bg-card flex items-center justify-center text-[22px]">‹</Link>
        <h1 className="t-card">후원하기</h1>
      </header>

      <section className="mt-6 fade-up">
        <p className="t-cap text-primary font-bold">후원</p>
        <h1 className="text-[22px] font-extrabold tracking-[-0.03em] leading-[1.25] mt-2">
          커피 한 잔이<br />다음 업데이트가 돼요
        </h1>
        <p className="t-body text-ink-2 mt-3">ENCORE는 광고 없이 혼자 만들고 있어요. 후원금은 서버 비용과 새 이벤트·일러스트 제작에 써요.</p>
      </section>

      <Card className="mt-6 fade-up" style={{ animationDelay: "80ms" }}>
        <div className="flex items-center gap-3">
          <Logo id="tossbank" label="토스" size={44} rounded="full" />
          <div className="min-w-0 flex-1">
            <p className="t-cap">{BANK}</p>
            <p className="text-[22px] font-extrabold tracking-[-0.02em] tabular-nums whitespace-nowrap">{ACCOUNT}</p>
            <p className="text-[13px] text-ink-3">예금주 양*현</p>
          </div>
          <button onClick={copy} className="press shrink-0 h-10 px-3.5 rounded-xl bg-chip text-ink text-[13px] font-bold">
            {copied ? "복사됨" : "복사"}
          </button>
        </div>
      </Card>

      <Card className="mt-3 fade-up" style={{ animationDelay: "140ms" }}>
        <p className="t-card">얼마를 보낼까요?</p>
        <div className="grid grid-cols-4 gap-2 mt-3">
          {PRESETS.map((v) => (
            <button key={v} onClick={() => setAmount(v)} className={`press h-11 rounded-xl text-[13px] font-bold ${amount === v ? "bg-ink text-bg" : "bg-chip text-ink-2"}`}>
              {v.toLocaleString("ko-KR")}원
            </button>
          ))}
        </div>
        <a href={tossLink} className="block mt-4">
          <Button>토스로 {amount.toLocaleString("ko-KR")}원 보내기</Button>
        </a>
        <p className="text-[13px] text-ink-3 mt-2 text-center">토스 앱이 설치된 휴대폰에서 열려요. 안 열리면 위 계좌를 복사해서 보내주세요.</p>
      </Card>

      <Card className="mt-3 fade-up" style={{ animationDelay: "200ms" }}>
        <p className="t-card">후원금은 이렇게 써요</p>
        <ul className="mt-3 flex flex-col gap-2.5">
          {[
            ["서버·도메인", "매달 나가는 호스팅 비용"],
            ["새 이벤트·일러스트", "현실 고증 이벤트와 씬 이미지 제작"],
            ["랭킹 서버", "은퇴 커리어 일일 랭킹 준비 중"],
          ].map(([t, s]) => (
            <li key={t} className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[13px] font-bold">{t}</p>
                <p className="text-[13px] text-ink-3">{s}</p>
              </div>
              <span className="text-ink-3">›</span>
            </li>
          ))}
        </ul>
      </Card>

      <p className="mt-6 text-[13px] text-ink-3 leading-relaxed">후원은 자발적인 선물이며 게임 내 혜택과 교환되지 않아요. 환불은 어려우니 금액을 한 번 더 확인해주세요.</p>
    </main>
  );
}
