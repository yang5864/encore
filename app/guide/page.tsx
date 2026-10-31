import Link from "next/link";
import { Card } from "@/components/ui/Card";

const STEPS = [
  { title: "1. 캐릭터를 만들어요", text: "활동명, 성별, 캐릭터, 주 포지션을 정하고 능력치 240점을 나눠요. 마지막에 첫 지원 기획사를 골라 오디션을 봐요. 대형은 합격이 어렵고 중소는 쉬워요. 떨어져도 무소속으로 시작해 언제든 다시 지원할 수 있어요." },
  { title: "2. 반기마다 계획 하나", text: "이번 반기 집중 카드에서 계획 하나를 고르고 진행 버튼을 누르면 6개월이 흘러요. 결과는 아래에서 올라오는 시트로 보여주고, 중요한 순간에는 선택이 하나 더 나와요. 선택지마다 무엇이 오르고 내리는지 적혀 있어요." },
  { title: "3. 데뷔와 활동", text: "소속 뒤 1년마다 데뷔 평가가 있어요. 기준 OVR을 넘으면 데뷔조 제안이 와요. 데뷔 후에는 컴백·방송·팬미팅·해외 활동·휴식 중에서 고르고, 초동과 차트가 팬과 인기도를 정해요. 연말에는 시상식 결산이 있어요." },
  { title: "4. 정산과 재계약", text: "돈은 억 단위예요. 데뷔 제작비와 컴백 제작비를 회사가 먼저 투자하고, 매출로 회수한 뒤부터 순이익의 일부가 내 정산금이 돼요. 데뷔 7년 뒤 재계약·독립·솔로·해체를 정해요." },
  { title: "5. 저장과 기록", text: "게임은 이 브라우저에 자동 저장돼요. 메뉴에서 저장 파일을 내보내고 다른 기기에서 가져올 수 있어요. 은퇴하면 커리어가 내 기록에 점수순으로 남아요." },
];

const NOTES = [
  "연습생 계약은 표준계약서 기준 최대 3년, 전속계약은 최대 7년으로 반영했어요.",
  "복무 기간은 육군 18개월, 해군 20개월, 공군 21개월을 반기 단위로 단순화했어요.",
  "멜론 차트와 빌보드 Hot 100은 타이틀곡 성적, 초동은 음반 판매량으로 구분했어요.",
  "연말 시상식은 MAMA·MMA·골든디스크를 하나의 시즌으로 묶어 결산해요. 신인상은 한 번만 받아요.",
  "기획사 티어별 합격 확률, 성장 배율, 제작비, 정산 비율은 게임 설정이에요. 실제 회사의 비공개 계약을 재현하지 않아요.",
  "중소 기획사에는 아주 드물게 기적이 숨어 있어요.",
];

export default function GuidePage() {
  return (
    <main className="shell pt-3">
      <header className="flex items-center h-12 gap-3">
        <Link href="/" aria-label="홈" className="press w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[20px]">‹</Link>
        <h1 className="t-card">게임 가이드</h1>
      </header>
      <div className="flex flex-col gap-3 mt-4">
        {STEPS.map((s) => (
          <Card key={s.title}>
            <h2 className="t-card">{s.title}</h2>
            <p className="t-body text-ink-2 mt-2">{s.text}</p>
          </Card>
        ))}
        <Card>
          <h2 className="t-card">현실 고증 노트</h2>
          <ul className="mt-2 flex flex-col gap-2">
            {NOTES.map((n) => (
              <li key={n} className="text-[14px] text-ink-2 leading-relaxed">· {n}</li>
            ))}
          </ul>
        </Card>
        <p className="text-[12px] text-ink-3 leading-relaxed pb-6">
          ENCORE는 가상의 커리어 시뮬레이션이에요. 실제 기획사·학교·시상식 명칭은 배경으로만 쓰이며 수치와 확률은 게임 규칙이에요. 실제 인물이나 사건을 특정하지 않아요. DAWN·MONO·ORBIT은 가상 회사예요.
        </p>
      </div>
    </main>
  );
}
