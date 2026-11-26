# RUN — 기반: Vite+three.js 앱, 레이아웃 A, 마을 장면, 듀얼 뷰, 50개 데이터, 테스트 하네스
slug: ft-foundation-1of5

## 작업 단위별 결과
- S1 스캐폴드(pnpm · Vite 8 · TS 7 · three 0.187 · vitest 5 · @playwright/test 1.65) — ✅ 계획대로
- S2 50개 데이터 + 정답 목록 fixture + tests/data.test.ts — ✅ 계획대로 (받아쓰기 /tmp/ft_ref/tx/audio.srt 참고, 문구는 새로 작성)
- S3 마을(장면 스타일 C) + 듀얼 뷰 — ⚠ EffectComposer 대신 자체 합성 셰이더(src/view/composite.ts)로 구현. 전환(디졸브·와이프·아이리스·분할)과 렌즈·색 효과 대부분, 셔터 누적 방식 모션 블러까지 기반 단계에서 미리 넣음(3~5부 작업량 감소)
- S4 기법 계약(types.ts: sample(t) → shots·composite·effects·timeScale) + 레지스트리 + 자리표시자 50개 + window.__ft + ?technique=&t= — ✅ 계획대로
- S5 레이아웃 A UI(7부 사이드바 · 두 화면 · 타임라인(샷 구간·속도/밝기 그래프) · 재생 컨트롤 · 설명 패널) — ✅ 계획대로, 타임라인은 계획보다 추가
- S6 C3·C4·C5·C6 테스트 파일 — ✅ loop.md 단언 전부 반영. C4에는 "50개 모두 자리표시자가 아님" 단언 추가, C5에는 기법별 후처리 패스 활성 검사 추가

## 진행 메모
- 소품 계약: C4가 읽는 world.props 키 — moon·moonRadius(19), loudness(21), line(25), blockLead(36), flower(37), cameraBase(39), trainX(40). 이후 작업은 이 이름으로 값을 내보내야 함.
- 첫 화면 확인(ego-browser): 합성 패스에 sRGB 변환이 빠져 카메라 화면이 어둡던 문제, 감독 시점 첫 위치가 지붕 안쪽이던 문제를 수정. 기본 해 방향을 정면광(+z)으로 변경.
- 감독 시점과 카메라 화면이 하나의 Scene을 공유하고, 카메라 리그·경로는 레이어 1(촬영 카메라에는 안 보임)에 둠.

## Rulings
- fg-loop 무인 진행: 작업 1을 Dynamic Workflow 대신 메인 세션에서 직접 실행(워크플로 스크립트 승인 게이트가 무인 진행을 멈추게 하므로, fg-run의 "작은 규모면 직접 처리" 규칙 적용)
- TDD: config 기본값(off) 적용
- 환경: Playwright 1.65 전용 chromium 다운로드가 30분 넘게 멈춰(lock만 남음) 중단 → playwright.config.ts에서 시스템 Google Chrome(channel: 'chrome') 사용으로 변경

## DoD baseline → after
- `pnpm build`: 실패(프로젝트 없음) → exit 0 (Measured)
- `pnpm vitest run tests/data.test.ts`: 파일 없음 → 5 passed (Measured)
- dev 페이지 두 화면 + 설명: 없음 → ego-browser 스크린샷 #1·#41에서 레이아웃 A, 두 canvas 렌더, 화면 설명·사용 상황 표시 확인 (Measured, /tmp/ft_ref/shot_t1b.png · shot_t41.png)
- (참고) C3·C4·C5·C6: 자리표시자 상태라 실패가 정상 — C5는 "#1 카메라 화면이 시간에 따라 변하지 않음", C6은 "거의 같은 화면" 목록으로 실패해 검사 묶음이 실제로 동작함을 확인 (Measured)
