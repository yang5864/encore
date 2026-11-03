import Link from "next/link";
import { BackButton } from "@/components/ui/BackButton";
import { Card } from "@/components/ui/Card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SupportTrigger } from "@/components/SupportSheet";

const STEPS = [
  { title: "1. 캐릭터 만들기", text: "활동명과 성별, 캐릭터를 정하고 랜덤 후보 셋 중 하나를 골라요. 가장 높은 능력이 포지션이 돼요. 무소속으로 시작해 시즌마다 기획사 3곳까지 지원할 수 있고, 대형은 어렵고 중소는 쉬워요. 19세 하반기까지 소속이 없으면 받아주는 회사와 계약해요." },
  { title: "2. 시즌마다 계획 하나", text: "계획 하나를 고르고 진행하면 6개월이 흘러요. 결과는 아래에서 올라오는 시트로 보고, 중요한 순간엔 선택이 하나 더 나와요. 컨디션이 위험이면 휴식만 고를 수 있어요." },
  { title: "3. 데뷔", text: "소속 뒤 1년마다 데뷔 평가가 있어요. 기준 OVR을 넘으면 데뷔조 제안이 오고, 그룹 구성과 내 역할이 함께 정해져요. 가끔 명단에서 빠지기도 하는데, 그땐 다음 데뷔 시점과 다른 회사의 오퍼를 보고 정해요." },
  { title: "4. 활동", text: "컴백·방송·팬미팅·해외 활동·휴식 중에서 고르고, 데뷔 3년 뒤엔 연기·솔로·예능·프로듀서 활동이 열려요. 음악방송 1위는 6개 방송을 따로 겨루고, 연말엔 시상식 결산이 있어요. 정산금으로 시즌마다 아이템 하나를 살 수 있어요." },
  { title: "5. 정산과 재계약", text: "돈은 억 단위예요. 회사가 먼저 쓴 제작비를 매출로 회수한 뒤부터 순이익의 일부가 내 정산금이 돼요. 7년 뒤엔 재계약, 해외 이적, 개인 소속사 설립, 그룹 탈퇴 중에서 고르는데 오퍼는 실력과 인기에 따라 와요." },
  { title: "6. 저장과 기록", text: "이 브라우저에 자동 저장돼요. 메뉴에서 저장 파일을 내보내 다른 기기에서 가져올 수 있어요. 은퇴하면 최종 순위와 수상, 순위 추이가 요약되고 명예의 전당에 남아요." },
];

const NOTES = [
  "연습생 계약은 최대 3년, 전속계약은 최대 7년이에요.",
  "복무 기간은 육군 18개월, 해군 20개월, 공군 21개월이에요.",
  "음악방송은 더쇼·쇼챔피언·엠카운트다운·뮤직뱅크·쇼! 음악중심·인기가요 6개예요. 음원 비중이 음반보다 커요.",
  "브랜드평판 순위는 2019년 이후 한국기업평판연구소의 실제 월간 자료를, 그 전은 게임 추정표를 써요.",
  "연말 시상식은 MAMA·MMA·골든디스크를 묶어 결산하고, 신인상은 한 번만 받아요.",
  "통신사 광고와 명품 앰버서더는 브랜드평판 10위 안에 든 적이 있거나, 급성장 중이거나, 레전드인 아이돌에게만 와요.",
  "초동·SNS·스트리밍 규모는 2024~2026년 실제 그룹을 기준으로 맞췄어요. 대형 신인 초동 30만~100만, 전성기 톱 그룹 100만~450만이에요.",
  "기획사별 합격 확률·성장·제작비·정산 비율은 게임 설정이에요. 실제 계약을 재현하지 않아요.",
  "중소 기획사에는 아주 드물게 기적이 숨어 있어요.",
];

export default function GuidePage() {
  return (
    <main className="shell pt-3">
      <header className="flex items-center h-12 gap-3">
        <BackButton href="/" label="홈" />
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
            <p className="text-[13px] text-ink-2 mt-1.5 leading-relaxed">{s.text}</p>
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
          ENCORE는 가상의 커리어 시뮬레이션이에요. 실제 기획사·시상식 이름은 배경으로만 쓰고, 수치와 확률은 게임 규칙이에요. 실제 인물이나 사건을 특정하지 않아요.
        </p>
      </div>
    </main>
  );
}
