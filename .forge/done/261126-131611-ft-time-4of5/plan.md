<!-- forge-slug: ft-time-4of5 -->
<!-- task: 4 -->
<!-- part: 4/5 -->
<!-- tdd: off -->
# 5부 시간(29~36) 연출 구현

## Goal / Non-goals
- Goal: 장면 시간(timeScale)과 카메라 시간을 분리하는 시간 제어를 구현하고 슬로 모션 · 타임랩스(해·그림자·구름) · 스피드 램프 · 프리즈 프레임 · 리버스 · 하이퍼랩스 · 불릿 타임(공중 정지 + 카메라 회전) · 스톱모션(계단식 프레임)을 만들어 C3 35, C4 29~34·36 단언을 통과시킨다. 감독 시점에는 시간 곡선(속도 그래프)을 표시.
- Non-goals: 6~7부 기법. 테스트 기대값 변경.

## Source of truth
- Glossary terms: none
- Related ADRs: none
- 검사 정의: `.forge/loop.md` C3/C4, 참고 프레임 /tmp/ft_ref/frames (sheet 2)
- Definition of Done: 해당 vitest 항목 green, 29~36 ego-browser 스크린샷 검토

## Work slices
- [ ] S1. 장면 시간 / 카메라 시간 분리 + 캐릭터 애니메이션(점프·물 분수·풍선 등 움직이는 대상) + 감독 시점 속도 그래프 오버레이 — 완료 기준: timeScale 0/0.25/-1에서 장면이 정지/느림/역재생
- [ ] S2. 29~36 구현 — 완료 기준: C3 35, C4 29~34·36 green (depends: S1)
- [ ] S3. 29~36 시각 확인(ego-browser) 및 수정 — 완료 기준: 스크린샷 검토 기록 run.md (depends: S2)
