import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SupportTrigger } from "@/components/SupportSheet";

const STEPS = [
  { title: "1. 캐릭터를 만들어요", text: "활동명, 성별, 캐릭터를 정하고 랜덤 후보 셋 중 하나를 골라요. 가장 높은 능력이 포지션을 정해요. 마지막에 첫 지원 기획사를 골라 오디션을 봐요. 대형은 합격이 어렵고 중소는 쉬워요. 떨어져도 무소속으로 시작해 언제든 다시 지원할 수 있어요." },
  { title: "2. 시즌마다 계획 하나", text: "이번 시즌 계획 카드에서 계획 하나를 고르고 진행 버튼을 누르면 6개월이 흘러요. 결과는 아래에서 올라오는 시트로 보여주고, 중요한 순간에는 선택이 하나 더 나와요. 선택지마다 무엇이 오르고 내리는지 적혀 있어요." },
  { title: "3. 데뷔와 활동", text: "소속 뒤 1년마다 데뷔 평가가 있어요. 기준 OVR을 넘으면 데뷔조 제안이 와요. 데뷔 후에는 컴백·방송·팬미팅·해외 활동·휴식 중에서 고르고, 초동과 차트가 팬과 인기도를 정해요. 연말에는 시상식 결산이 있어요." },
  { title: "4. 정산과 재계약", text: "돈은 억 단위예요. 데뷔 제작비와 컴백 제작비를 회사가 먼저 투자하고, 매출로 회수한 뒤부터 순이익의 일부가 내 정산금이 돼요. 데뷔 7년 뒤 재계약·독립·솔로·해체를 정해요." },
  { title: "5. 저장과 기록", text: "게임은 이 브라우저에 자동 저장돼요. 메뉴에서 저장 파일을 내보내고 다른 기기에서 가져올 수 있어요. 은퇴하면 커리어가 내 기록에 점수순으로 남아요." },
];

const NOTES = [
  "연습생 계약은 표준계약서 기준 최대 3년, 전속계약은 최대 7년으로 반영했어요.",
  "복무 기간은 육군 18개월, 해군 20개월, 공군 21개월을 시즌(6개월) 단위로 단순화했어요.",
  "멜론 차트와 빌보드 Hot 100은 타이틀곡 성적, 초동은 음반 판매량으로 구분했어요.",
  "연말 시상식은 MAMA·MMA·골든디스크를 하나의 시즌으로 묶어 결산해요. 신인상은 한 번만 받아요.",
  "기획사 티어별 합격 확률, 성장 배율, 제작비, 정산 비율은 게임 설정이에요. 실제 회사의 비공개 계약을 재현하지 않아요.",
  "커리어는 업계의 흐름대로 프리 데뷔 → 신인기(초동·음방·신인상) → 도약기(유닛·월드투어) → 전성기(대상·개인 브랜딩) → 7년 재계약(재계약·이적 후 팀 유지·개인 활동 전향)으로 흘러요.",
  "음악방송 점수는 음원 비중이 음반보다 크게 반영돼요. 초동은 팬덤 화력, 멜론 순위는 대중성이에요.",
  "데뷔 3년 뒤부터 연기·솔로·예능·프로듀서 같은 개인 활동이 열리고, 성공은 해당 능력치가 정해요.",
  "초동·인스타 팔로워·유튜브 구독자·스포티파이 월간 리스너는 2024~2026년 실제 그룹 규모를 기준으로 맞췄어요. 대형 신인 초동 30만~100만, 중견 3만~15만, 중소 1천~1만. 전성기 톱 그룹은 초동 100만~450만, 멤버 인스타 1,000만 안팎, 스포티파이 월간 1,000만~4,000만이에요.",
  "지표는 시즌마다 목표치의 일부만 따라가요. 팔로워는 오를 땐 빠르고 내릴 땐 천천히 빠져요.",
  "중소 기획사에는 아주 드물게 기적이 숨어 있어요.",
];

export default function GuidePage() {
  return (
    <main className="shell pt-3">
      <header className="flex items-center h-12 gap-3">
        <Link href="/" aria-label="홈" className="press w-10 h-10 rounded-xl bg-card flex items-center justify-center text-[22px]">‹</Link>
        <h1 className="t-card">전체 · 게임 가이드</h1>
      </header>
      <div className="flex flex-col gap-3 mt-4">
        <Card><ThemeToggle /></Card>
        <Card className="!p-2">
          <Link href="/records" className="press flex items-center justify-between gap-3 px-3 py-3.5 rounded-2xl">
            <div><p className="t-body font-bold">명예의 전당</p><p className="text-[13px] text-ink-3">은퇴한 커리어 순위</p></div>
            <span className="text-ink-3">›</span>
          </Link>
          <SupportTrigger className="press w-full flex items-center justify-between gap-3 px-3 py-3.5 rounded-2xl text-left">
            <div><p className="t-body font-bold">후원하기</p><p className="text-[13px] text-ink-3">커피 한 잔이 다음 업데이트가 돼요</p></div>
            <span className="text-ink-3">›</span>
          </SupportTrigger>
        </Card>
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
              <li key={n} className="text-[13px] text-ink-2 leading-relaxed">· {n}</li>
            ))}
          </ul>
        </Card>
        <p className="text-[13px] text-ink-3 leading-relaxed pb-6">
          ENCORE는 가상의 커리어 시뮬레이션이에요. 실제 기획사·학교·시상식 명칭은 배경으로만 쓰이며 수치와 확률은 게임 규칙이에요. 실제 인물이나 사건을 특정하지 않아요.
        </p>
      </div>
    </main>
  );
}
