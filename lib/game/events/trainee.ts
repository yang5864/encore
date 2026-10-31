import type { GameEventDef } from "../types.ts";
import { agencyById } from "../agencies.ts";
import { ageOf } from "../format.ts";
import { overall } from "../stats.ts";

/** 무소속 지망생 · 연습생 이벤트. 힌트에는 숫자를 쓰지 않는다. */
export const TRAINEE_EVENTS: GameEventDef[] = [
  // ───────── 무소속 ─────────
  {
    id: "academy-showcase",
    stage: "free",
    kind: "story",
    title: "학원 정기 쇼케이스",
    text: "다니는 실용음악 학원에서 정기 쇼케이스를 열어요. 기획사 관계자가 가끔 보러 온다는 소문이 있어요.",
    scene: "festival",
    choices: [
      { id: "solo", label: "솔로 무대에 지원한다", hint: "주 포지션 실력이 오르고 눈에 띌 기회가 생겨요. 떨리면 컨디션이 떨어져요", risk: "bold", chance: 0.6, success: { visual: 2, vocal: 2, dance: 2, fans: 300, mental: 4 }, fail: { mental: -10, vocal: 1, dance: 1 }, successText: "무대가 끝나자 박수가 길게 이어졌어요. 명함을 건넨 관계자가 있었어요.", failText: "가사를 한 번 놓쳤어요. 무대는 끝났지만 배운 게 많아요." },
      { id: "team", label: "팀 무대에 참여한다", hint: "댄스와 팀워크가 조금씩 올라요. 안정적인 선택이에요", risk: "safe", effects: { dance: 2, variety: 1, fans: 80 } },
    ],
  },
  {
    id: "street-cast",
    stage: "free",
    kind: "story",
    title: "길거리 캐스팅",
    text: "홍대 거리에서 명함을 받았어요. 중소 기획사 캐스팅 매니저예요. 내일 바로 오디션을 보자고 해요.",
    scene: "audition",
    when: (c) => c.turn >= 1,
    choices: [
      { id: "go", label: "내일 오디션에 간다", hint: "중소 기획사 연습생이 될 가능성이 높아요", risk: "bold", op: "freecast", sign: true },
      { id: "wait", label: "원하는 회사에 직접 지원하겠다고 거절한다", hint: "마음이 단단해지고 연습에 집중해요", risk: "safe", effects: { mental: 6, vocal: 1, dance: 1 } },
    ],
  },
  {
    id: "cover-video",
    stage: "free",
    kind: "story",
    title: "커버 영상을 올려볼까?",
    text: "친구가 찍어준 커버 영상이 꽤 잘 나왔어요. 요즘 기획사 캐스팅팀은 유튜브와 틱톡을 먼저 본대요.",
    scene: "youtube",
    public: true,
    choices: [
      { id: "post", label: "그대로 올린다", hint: "작은 팬이 생기고 캐스팅 눈에 띌 수 있어요. 악플이 달리면 멘탈이 조금 흔들려요", risk: "bold", chance: 0.7, success: { fans: 500, visual: 1, mental: 3 }, fail: { fans: 80, mental: -8 }, successText: "영상이 조용히 퍼졌어요. 댓글에 '어느 회사 연습생이에요?'가 달려요.", failText: "조회수는 적었고 악플이 하나 달렸어요. 그래도 처음이 제일 어려워요." },
      { id: "edit", label: "며칠 더 다듬어서 올린다", hint: "프로듀싱 감각이 생기고 반응이 안정적이에요", risk: "safe", effects: { producing: 2, fans: 200 } },
    ],
  },

  // ───────── 연습생 · 예약 ─────────
  {
    id: "debut-offer",
    stage: "trainee",
    kind: "scheduled",
    title: "월말평가 1위 — 데뷔조 합류 제안",
    text: "이번 월말평가에서 최상위 평가를 받았어요. 회사가 데뷔조 합류를 제안해요. 수락하면 바로 데뷔 준비에 들어가요.",
    scene: "debut",
    choices: [
      { id: "accept", label: "데뷔조에 합류한다", hint: "그룹 이름을 정하고 전속계약을 맺어요", risk: "bold", op: "debut", sign: true },
      { id: "wait", label: "한 번 더 준비한다", hint: "실력을 더 다듬고 다음 평가에서 다시 제안받아요", risk: "safe", effects: { mental: 4, trust: 3 }, op: "debut:wait" },
    ],
  },
  {
    id: "debut-miss",
    stage: "trainee",
    kind: "state",
    title: "데뷔조 발표 — 내 이름이 없었다",
    text: "데뷔조 명단이 붙었어요. 같이 연습하던 멤버가 뽑혔고 내 이름은 없었어요. 회사는 다음 팀을 준비하라고 해요.",
    scene: "dorm",
    choices: [
      { id: "congrats", label: "먼저 축하해주고 연습실로 간다", hint: "회사의 신뢰가 오르고 마음은 단단해져요", risk: "safe", effects: { trust: 8, mental: -4, vocal: 1, dance: 1 } },
      { id: "ask", label: "평가 담당자에게 이유를 묻는다", hint: "약점을 알게 되어 성장이 빨라져요. 태도에 따라 신뢰가 흔들릴 수 있어요", risk: "bold", chance: 0.65, success: { trust: 4, vocal: 2, dance: 2, rap: 1 }, fail: { trust: -8, mental: -6 }, successText: "담당자가 솔직한 피드백을 줬어요. 무엇을 고쳐야 하는지 알게 됐어요.", failText: "질문이 항의처럼 들렸나 봐요. 분위기가 어색해졌어요." },
    ],
  },
  {
    id: "school",
    stage: "any",
    kind: "scheduled",
    title: "고등학교 진학 — 어디로 갈까?",
    text: "중학교 졸업이 다가와요. 예술고는 실기와 무대 경험이 쌓이고, 일반고는 생활이 안정적이에요. 검정고시는 연습 시간이 가장 많아요.",
    scene: "school",
    choices: [
      { id: "arts", label: "예술고등학교", hint: "댄스와 비주얼 성장이 빨라요. 실기 전형이 있어요", risk: "bold", op: "school:arts", requires: { stat: "dance", value: 40 } },
      { id: "general", label: "일반고등학교", hint: "컨디션이 안정적이고 친구들과 평범한 학교생활을 해요", risk: "safe", op: "school:general" },
      { id: "ged", label: "검정고시 · 홈스쿨링", hint: "연습 시간이 많아 모든 능력이 빨리 올라요. 멘탈 회복은 느려요", risk: "bold", op: "school:ged" },
    ],
  },
  {
    id: "trainee-contract",
    stage: "trainee",
    kind: "scheduled",
    title: "연습생 계약 만료 — 3년이 지났다",
    text: "표준계약서 기준 최대 연습생 기간이 끝났어요. 회사와 평가 자료를 함께 봤어요. 다음을 정해야 해요.",
    scene: "contract",
    choices: [
      { id: "renew", label: "새 연습생 계약에 합의한다", hint: "다음 몇 년 안에 데뷔를 목표로 다시 준비해요", risk: "safe", op: "trainee:renew", sign: true },
      { id: "leave", label: "계약을 마치고 다른 회사를 찾는다", hint: "무소속이 되고 훈련비를 개인이 갚지는 않아요. 홈에서 다른 회사에 지원할 수 있어요", risk: "bold", op: "trainee:leave" },
    ],
  },
  {
    id: "trainee-dismiss",
    stage: "trainee",
    kind: "scheduled",
    title: "연습생 계약 해지 통보",
    text: "월말평가 경고가 두 번 쌓였어요. 회사가 계약 해지를 통보했어요. 숙소를 정리할 시간은 한 달이에요.",
    scene: "contract",
    choices: [
      { id: "again", label: "다른 회사 오디션을 준비한다", hint: "무소속으로 돌아가요. 홈에서 바로 지원할 수 있어요", risk: "bold", op: "trainee:leave" },
      { id: "quit", label: "여기서 꿈을 정리한다", hint: "커리어가 끝나고 기록에 남아요", risk: "bold", op: "retire" },
    ],
  },
  {
    id: "warning",
    stage: "trainee",
    kind: "state",
    title: "월말평가 하위권 — 경고",
    text: "이번 평가에서 하위권이에요. 트레이너가 경고를 줬어요. 경고가 두 번 쌓이면 계약이 해지될 수 있어요.",
    scene: "dance",
    repeatable: true,
    choices: [
      { id: "grind", label: "새벽 연습을 추가한다", hint: "주 포지션이 꽤 오르지만 컨디션이 많이 떨어져요", risk: "bold", effects: { health: -18, mental: -6 }, op: "grind" },
      { id: "plan", label: "트레이너와 보완 계획을 짠다", hint: "약점이 고르게 오르고 신뢰가 회복돼요", risk: "safe", effects: { trust: 6, mental: 2 }, op: "weakfix" },
    ],
  },

  // ───────── 연습생 · 이야기 ─────────
  {
    id: "survival",
    stage: "trainee",
    kind: "story",
    title: "서바이벌 프로그램 출연 제안",
    text: "방송사 데뷔 서바이벌에서 회사로 섭외가 왔어요. 매주 순위가 공개되고, 최종 데뷔조에 들면 바로 데뷔예요. 떨어지면 소속사로 돌아와요.",
    scene: "survival",
    public: true,
    when: (c) => ageOf(c) >= 16,
    choices: [
      { id: "join", label: "출연한다", hint: "전국에 얼굴이 알려져요. 데뷔조에 들면 팬이 크게 늘고, 떨어져도 경험이 남아요", risk: "bold", chance: 0.4, success: { fans: 40000, popularity: 12, visual: 2, variety: 3, mental: -10, reputation: 6 }, fail: { fans: 9000, popularity: 4, variety: 2, mental: -14, reputation: 2 }, successText: "최종회에서 이름이 불렸어요. 데뷔조 합류가 확정됐어요.", failText: "최종 데뷔조 바로 밑에서 탈락했어요. 팬들은 '다음에 꼭 보자'고 해요." },
      { id: "pass", label: "회사 데뷔에 집중한다", hint: "노출 기회는 없지만 실력과 신뢰가 쌓여요", risk: "safe", effects: { trust: 6, vocal: 1, dance: 1, mental: 3 } },
    ],
  },
  {
    id: "roommate",
    stage: "trainee",
    kind: "story",
    title: "숙소 룸메이트와의 갈등",
    text: "숙소에서 같은 방을 쓰는 연습생과 자꾸 부딪혀요. 연습 시간, 청소, 밤늦은 통화까지. 평가도 같은 조예요.",
    scene: "dorm",
    choices: [
      { id: "talk", label: "먼저 솔직하게 이야기한다", hint: "마음이 편해지고 팀워크가 좋아져요", risk: "safe", effects: { mental: 10, trust: 4 } },
      { id: "focus", label: "신경 끄고 내 연습만 한다", hint: "실력은 오르지만 마음이 지쳐요", risk: "bold", effects: { vocal: 1, dance: 2, mental: -8 } },
    ],
  },
  {
    id: "parents",
    stage: "trainee",
    kind: "story",
    title: "부모님의 반대",
    text: "성적이 떨어졌다는 연락을 받은 부모님이 연습을 그만두라고 하세요. 주말에 집에서 긴 대화가 기다리고 있어요.",
    scene: "family",
    when: (c) => ageOf(c) <= 17,
    choices: [
      { id: "show", label: "평가 영상을 보여드린다", hint: "응원을 얻어 마음이 든든해져요", risk: "safe", chance: 0.75, success: { mental: 14, trust: 2 }, fail: { mental: -6 }, successText: "영상을 끝까지 보신 뒤 한참 말이 없으시다가 '밥은 잘 먹고 다니냐'고 하셨어요.", failText: "아직은 설득이 되지 않았어요. 시간이 더 필요해요." },
      { id: "promise", label: "성적도 챙기겠다고 약속한다", hint: "연습 시간이 줄어 성장이 조금 느려지지만 가족 관계는 안정돼요", risk: "safe", effects: { mental: 8, vocal: -1, dance: -1 } },
    ],
  },
  {
    id: "sns-predebut",
    stage: "trainee",
    kind: "story",
    title: "데뷔 전 SNS 사전 공개",
    text: "회사가 데뷔 전 연습생 틱톡 계정을 열어주기로 했어요. 춤 커버와 일상 영상을 올릴 수 있어요. 회사 가이드라인은 꽤 엄격해요.",
    scene: "challenge",
    public: true,
    choices: [
      { id: "dance", label: "유행하는 챌린지를 올린다", hint: "예비 팬이 생기고 비주얼이 알려져요. 터지면 꽤 커요", risk: "bold", chance: 0.3, success: { fans: 15000, popularity: 6, visual: 2, reputation: 3 }, fail: { fans: 1500, visual: 1, reputation: 1 }, successText: "영상이 알고리즘을 탔어요. '이 연습생 누구야' 댓글이 쏟아져요.", failText: "조회수는 평범했지만 첫 팬이 생겼어요." },
      { id: "vlog", label: "연습실 브이로그를 올린다", hint: "꾸준히 팬이 생기고 예능 감각이 자라요", risk: "safe", effects: { fans: 3000, variety: 2, reputation: 2 } },
    ],
  },
  {
    id: "diet",
    stage: "trainee",
    kind: "story",
    title: "체중 관리 압박",
    text: "월말평가 전 트레이너가 체중 이야기를 꺼냈어요. 다른 연습생은 하루 한 끼로 버틴대요. 건강이 걱정돼요.",
    scene: "clinic",
    choices: [
      { id: "healthy", label: "트레이너와 식단을 짜고 운동으로 관리한다", hint: "비주얼이 오르면서 건강은 지켜요", risk: "safe", effects: { visual: 2, health: -4, dance: 1 } },
      { id: "extreme", label: "극단적으로 줄인다", hint: "비주얼 평가는 바로 오르지만 몸이 상해요", risk: "bold", effects: { visual: 4, health: -22, mental: -8 } },
    ],
  },
  {
    id: "dancebattle",
    stage: "trainee",
    kind: "story",
    title: "합동 평가 — 센터 자리",
    text: "연습생 전체 합동 평가에서 센터 자리를 두고 경쟁해요. 안무 트레이너가 지켜보고 있고, 데뷔조 평가에 반영돼요.",
    scene: "dance",
    choices: [
      { id: "center", label: "센터에 도전한다", hint: "성공하면 댄스와 비주얼이 크게 오르고 신뢰도 올라요", risk: "bold", chance: 0.5, success: { dance: 4, visual: 2, trust: 6, mental: 4 }, fail: { dance: 1, mental: -8 }, successText: "센터로 뽑혔어요. 트레이너가 '무대 장악력이 있다'고 했어요.", failText: "아쉽게 다른 연습생이 센터로 뽑혔어요. 동선은 다 외웠어요." },
      { id: "support", label: "팀 안무를 완벽하게 맞춘다", hint: "댄스가 안정적으로 오르고 팀워크 점수를 받아요", risk: "safe", effects: { dance: 2, trust: 4 } },
    ],
  },
  {
    id: "mentor",
    stage: "trainee",
    kind: "story",
    title: "선배 아티스트의 깜짝 방문",
    text: "회사 선배 그룹이 연습실에 들렀어요. 한 선배가 월말평가 영상을 보고 조언을 해주겠대요.",
    scene: "dorm",
    choices: [
      { id: "vocal", label: "보컬 조언을 듣는다", hint: "보컬이 오르고 마음이 든든해져요", risk: "safe", effects: { vocal: 3, mental: 6 } },
      { id: "stage", label: "무대 매너와 예능 팁을 듣는다", hint: "예능과 비주얼 표현이 올라요", risk: "safe", effects: { variety: 3, visual: 1, mental: 4 } },
    ],
  },
  {
    id: "exam",
    stage: "trainee",
    kind: "story",
    title: "기말고사와 월말평가가 겹쳤다",
    text: "학교 시험 기간과 월말평가가 같은 주예요. 둘 다 잘하고 싶지만 시간은 하나예요.",
    scene: "school",
    when: (c) => ageOf(c) <= 18 && c.schoolId !== "ged",
    choices: [
      { id: "practice", label: "평가에 올인한다", hint: "주 포지션이 오르지만 학교에서 호출을 받아요", risk: "bold", effects: { mental: -6, trust: 4 }, op: "grind" },
      { id: "both", label: "시간을 쪼개 둘 다 한다", hint: "성장은 보통이고 컨디션이 떨어져요", risk: "safe", effects: { health: -10, mental: -2, vocal: 1, dance: 1 } },
    ],
  },
  {
    id: "injury",
    stage: "trainee",
    kind: "state",
    title: "발목 부상",
    text: "안무 연습 중 발목을 접질렸어요. 병원에서는 몇 주 쉬라고 해요. 평가가 얼마 안 남았어요.",
    scene: "clinic",
    repeatable: true,
    when: (c) => c.health < 30,
    choices: [
      { id: "rest", label: "제대로 쉰다", hint: "컨디션이 회복되고 평가는 다음으로 미뤄요", risk: "safe", effects: { health: 30, mental: 6, dance: -1 } },
      { id: "push", label: "테이핑하고 평가에 나간다", hint: "실력은 지키지만 부상이 오래 갈 수 있어요", risk: "bold", chance: 0.5, success: { trust: 6, dance: 1, health: -5 }, fail: { health: -20, dance: -2, mental: -8 }, successText: "무사히 평가를 마쳤어요. 트레이너가 근성을 칭찬했어요.", failText: "평가 중 발목이 다시 꺾였어요. 회복이 길어져요." },
    ],
  },
  {
    id: "awaken",
    stage: "trainee",
    kind: "hidden",
    title: "연습실에서 뭔가 터졌다",
    text: "작은 회사의 낡은 연습실. 어느 날 거울 앞에서 지난 몇 달이 한꺼번에 몸에 붙는 느낌이 들었어요. 트레이너가 영상을 멈추고 말이 없어요.",
    scene: "dance",
    when: (c) => agencyById(c.agencyId)?.tier === "indie" && !c.flags.miracle,
    choices: [
      { id: "ride", label: "이 감각을 믿고 밀어붙인다", hint: "모든 능력이 한꺼번에 크게 올라요", risk: "bold", op: "awaken" },
    ],
  },
  {
    id: "predebut-single",
    stage: "trainee",
    kind: "story",
    title: "프리 데뷔 싱글 제안",
    text: "회사가 정식 데뷔 전에 프리 데뷔 싱글과 자체 콘텐츠로 팬덤을 먼저 만들자고 해요. 요즘 기획사들이 많이 쓰는 방식이에요. 노출이 늘지만 평가도 빨라져요.",
    scene: "album",
    public: true,
    when: (c) => {
      const a = agencyById(c.agencyId);
      return !!a && overall(c.stats, c.position) >= a.threshold - 6;
    },
    choices: [
      { id: "release", label: "프리 데뷔 싱글을 낸다", hint: "데뷔 전 팬덤과 인지도가 생겨요. 반응이 약하면 데뷔조 평가에 부담이 돼요", risk: "bold", chance: 0.6, success: { fans: 12000, popularity: 8, reputation: 4, trust: 6, vocal: 1, dance: 1 }, fail: { fans: 2500, popularity: 2, mental: -8, trust: -3 }, successText: "티저부터 반응이 왔어요. 데뷔 전인데 팬카페가 생겼어요.", failText: "조회수가 기대보다 낮았어요. 회사가 콘셉트를 다시 잡기로 했어요." },
      { id: "content", label: "자체 콘텐츠만 먼저 연다", hint: "부담 없이 예비 팬을 모아요", risk: "safe", effects: { fans: 4000, variety: 2, reputation: 2 } },
    ],
  },
  {
    id: "busking",
    stage: "trainee",
    kind: "story",
    title: "홍대 버스킹 제안",
    text: "연습생 동기들이 주말에 홍대에서 버스킹을 하자고 해요. 회사 허락은 받았지만 공개 무대는 처음이에요.",
    scene: "festival",
    public: true,
    when: (c) => overall(c.stats, c.position) >= 50,
    choices: [
      { id: "sing", label: "마이크를 잡는다", hint: "보컬과 무대 경험이 쌓이고 작은 팬이 생겨요", risk: "bold", chance: 0.65, success: { vocal: 2, visual: 1, fans: 2000, mental: 5, reputation: 2 }, fail: { vocal: 1, mental: -6, fans: 300 }, successText: "지나가던 사람들이 멈춰 섰어요. 직캠이 하나 올라왔어요.", failText: "스피커가 말썽이었어요. 그래도 끝까지 불렀어요." },
      { id: "film", label: "촬영과 편집을 맡는다", hint: "프로듀싱 감각이 오르고 안정적이에요", risk: "safe", effects: { producing: 2, variety: 1, fans: 400 } },
    ],
  },
];
