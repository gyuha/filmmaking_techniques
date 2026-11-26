<!-- forge-slug: ft-camera-angles-2of5 -->
<!-- task: 2 -->
<!-- part: 2/5 -->
<!-- tdd: off -->
# 1부 카메라 무빙(1~9) + 2부 앵글과 숏(10~16) 연출 구현

## Goal / Non-goals
- Goal: 기법 1~16의 sample(t)·소품·감독 시점 경로 표시를 실제 정의대로 구현해, C3의 해당 단언과 C4의 16번(점프 컷) 단언을 통과시킨다.
- Non-goals: 3~7부 기법. 테스트 기대값 변경.

## Source of truth
- Glossary terms: none
- Related ADRs: none
- 검사 정의: `.forge/loop.md` C3/C4, 참고 프레임 /tmp/ft_ref/frames (sheet 0)
- Definition of Done: tests/camera-semantics.test.ts 중 1~15 항목 green, tests/effects.test.ts 16 항목 green, 1~16 각각 ego-browser 스크린샷에서 감독 시점에 카메라 경로가 보이고 카메라 화면이 정의대로 움직임

## Work slices
- [ ] S1. 1~9 카메라 무빙: 달리 인 · 줌 인 · 팬·틸트 · 트래킹(캐릭터 걷기) · 크레인(마을 전경으로 상승) · 달리 줌(배경 왜곡) · 아크(캐릭터 중심 회전) · 크래시 줌 · 핸드헬드(노이즈 기반 흔들림) — 완료 기준: C3 1~9 green
- [ ] S2. 10~15 앵글과 숏: 하이 · 로우 · 버즈아이 · 더치 · 익스트림 클로즈업(눈 디테일) · POV(캐릭터 시선, 감독 시점에서 캐릭터 머리에 붙은 카메라 표시) — 완료 기준: C3 10~15 green
- [ ] S3. 16 점프 컷: 같은 구도에서 시간만 건너뛰는 컷(캐릭터 위치/시계 변화), 감독 시점에 컷 지점 표시 — 완료 기준: C4 16 green
- [ ] S4. 1~16 시각 확인: ego-browser로 기법별 두 뷰 스크린샷, 어색한 것 수정 — 완료 기준: 16장 스크린샷 검토 기록을 run.md에 남김 (depends: S1, S2, S3)
