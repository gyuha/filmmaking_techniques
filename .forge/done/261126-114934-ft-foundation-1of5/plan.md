<!-- forge-slug: ft-foundation-1of5 -->
<!-- task: 1 -->
<!-- priority: high -->
<!-- part: 1/5 -->
<!-- tdd: off -->
# 기반: Vite+three.js 앱, 레이아웃 A, 마을 장면, 듀얼 뷰, 50개 데이터, 테스트 하네스

## Goal / Non-goals
- Goal: 레이아웃 A(사이드바 · [감독 시점 | 카메라 화면] · 설명 패널) 앱 골격, 장면 스타일 C 마을, 기법 레지스트리/순수 샘플링 API, 50개 기법 데이터(화면 설명 · 사용 상황), C1~C6 테스트 파일 전체를 만든다. 이번 작업 끝에 C1·C2 통과.
- Non-goals: 기법별 실제 연출 구현(2~5부 작업). 이번에는 각 기법에 자리표시자 구현만 둔다(C3~C6 실패는 정상).

## Source of truth
- Glossary terms: none
- Related ADRs: none
- 결정·정답 목록·검사 정의: `.forge/loop.md`
- 참고: /tmp/ft_ref/tx/audio.srt(받아쓰기), /tmp/ft_ref/frames, 원본 mp4
- Definition of Done: `pnpm build` 성공, `pnpm vitest run tests/data.test.ts` green, `pnpm dev`로 띄운 페이지에서 50개 선택 시 두 뷰 + 설명 표시(ego-browser 스크린샷으로 확인)

## Work slices
- [ ] S1. Vite + TS + three.js 프로젝트 스캐폴드(pnpm), vitest · @playwright/test(chromium) 설정, scripts: dev/build(tsc --noEmit && vite build)/test — 완료 기준: `pnpm build` exit 0
- [ ] S2. 데이터 `src/data/techniques.ts`: 50개 {id, part, partName, name, nameEn, screenDescription(감독 시점·카메라 화면에서 무엇이 보이는지), usage(주로 쓰이는 상황/장르/예시 작품)} — 영상 받아쓰기를 참고해 새로 작성. `tests/fixtures/technique-names.ts`에 loop.md 정답 목록 — 완료 기준: tests/data.test.ts(C2 단언 전부) green (depends: S1)
- [ ] S3. 장면 스타일 C 마을(`src/scene/town.ts`: 바닥·길·집·나무·가로등·하늘·조명, 주황 공 캐릭터) + 듀얼 뷰 렌더러(`src/view/`): 하나의 scene을 감독 카메라(OrbitControls, 카메라 리그 메쉬 + 프러스텀 헬퍼 + 이동 경로 라인)와 촬영 카메라로 두 canvas에 렌더. 카메라 화면 쪽 후처리 파이프라인(EffectComposer) 슬롯 — 완료 기준: dev 페이지에서 두 canvas가 모두 그려짐 (depends: S1)
- [ ] S4. 기법 레지스트리 계약 `src/techniques/types.ts`: 각 기법은 순수 `sample(t)` → {camera pose(position, lookAt, fov, roll), subject 상태, shots/cut 정보, timeScale, effects 파라미터}와 장면 소품 setup/teardown, duration. 50개 모두 자리표시자 등록. `window.__ft` 디버그 API(select(id), seek(t), getState(), hasCameraRig()) 및 `?technique=&t=` 쿼리 지원 — 완료 기준: 50개 id가 레지스트리에 존재, tsc 통과 (depends: S3)
- [ ] S5. UI 레이아웃 A: 7부 그룹 사이드바(번호+이름), 선택 시 두 뷰 갱신, 아래 설명 패널(화면 설명 · 사용 상황) + 재생/일시정지/속도/리셋, 모바일 세로 스택, 다크 테마 — 완료 기준: ego-browser로 3개 기법 선택 스크린샷에서 레이아웃 A와 텍스트 확인 (depends: S2, S4)
- [ ] S6. 테스트 파일 작성(검사 정의는 loop.md 그대로, 약화 금지): tests/camera-semantics.test.ts(C3), tests/effects.test.ts(C4), e2e/techniques.spec.ts(C5), e2e/distinct.spec.ts(C6), playwright webServer=vite preview — 완료 기준: 네 파일이 실행되어 결과를 내고(현재는 실패 허용) 단언 목록이 loop.md C3·C4 항목을 모두 포함 (depends: S4, S5)
