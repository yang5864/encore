# ENCORE 2.0 — 시스템 지도

`/design-system` 1단계 산출물. 기존 코드에서 거꾸로 정리했다(`/map-systems` 대신, 2026-11-13). 원래 설계 의도는 상위 폴더의 `docs/superpowers/specs/2026-10-31-encore-v2-design.md`에 있다. 이 폴더의 GDD는 그 기획서와 코드가 다를 때 **코드가 맞다**고 보고 쓴다.

| 우선 | 시스템 | Category | 코드 | GDD | 상태 |
|---|---|---|---|---|---|
| 1 | 커리어 성장 (능력치·OVR·오디션·데뷔) | Progression | `stats.ts` `engine.ts`(grow) `agencies.ts` `schedule.ts`(debutEval) `debut.ts` | [career-progression.md](career-progression.md) | Designed |
| 2 | 컴백·차트 지표 (음원·음반·음방·멜론·빌보드·화제성·브랜드평판) | Gameplay | `album.ts` `metrics-model.ts` `brand-rank.ts` | [comeback-metrics.md](comeback-metrics.md) | Designed |
| 3 | 정산 경제 (투자·매출·정산·상점·예산·파산) | Economy | `economy.ts` `shop.ts` `team.ts`(budget) `renewal.ts` | [economy.md](economy.md) | Designed |
| 4 | 팬덤·팀 운영 (결속·케미·KPI·콘셉트 피로·라이벌) | Gameplay | `engine.ts` `kpi.ts` `team.ts` `album.ts` | [fandom-team.md](fandom-team.md) | Designed |
| 5 | 이벤트 흐름 (스케줄러·돌발 사건·이야기·연말 시상식) | Core | `schedule.ts` `events/*` `awards.ts` `engine.ts` | [event-flow.md](event-flow.md) | Designed |
| 6 | 계약·재계약·이적 | Meta | `renewal.ts` `debut.ts` | — | Not Started |
| 7 | 엔딩·명예의 전당 | Meta | `endings.ts` `storage.ts` | — | Not Started |
| 8 | 화면·연출 (토스 UI, 시상식, 축하) | UI | `app/` `components/` | — | Not Started |
| 9 | 아트 카탈로그·장면 배치 | UI | `lib/art/` `EventArt` | — | Not Started |
| 10 | 저장 | Persistence | `lib/storage.ts` | — | Not Started |

## 공통 규칙

- 1시즌 = 반기(6개월). `turn` 0 = 만 14세 상반기. 화면 나이는 한국 나이(만 나이 + 2).
- 모든 난수는 커리어 시드 기반 결정론(`rng(c)`). 같은 시드와 같은 선택이면 같은 결과.
- 시뮬레이션 검증: `scripts/check-balance.ts`(14개 기획사 × 6시드, 22·26세 분포), `scripts/compare-strategies.ts`(전략 5종 × 24시드 중앙값).
- 교차 시스템 수치와 밸런스 목표는 `design/registry/entities.yaml`에 있다.
