<!-- forge-slug: ft-lens-look-5of5 -->
<!-- task: 5 -->
<!-- part: 5/5 -->
<!-- tdd: off -->
# 6부 렌즈·빛·색(37~42) + 7부 특수 렌즈와 룩(43~50) 구현 및 전체 E2E 통과

## Goal / Non-goals
- Goal: 후처리 패스(DOF/보케, 플레어, 셰이크, 모션 블러, 컬러 그레이딩 LUT·틸 앤 오렌지, 레터박스 2.39:1, 틸트 시프트, 어안 왜곡, 갓레이, 셀렉티브 컬러, 데이 포 나이트, 필름 그레인)와 50 원테이크(연속 롱테이크 경로)를 구현하고, 감독 시점에는 렌즈/효과 파라미터를 표시해 C3 50, C4 37~49를 통과시킨다. 마지막으로 C1~C6 전체를 녹색으로 만든다.
- Non-goals: 테스트 기대값 변경, 배포.

## Source of truth
- Glossary terms: none
- Related ADRs: none
- 검사 정의: `.forge/loop.md` C1~C6, 참고 프레임 /tmp/ft_ref/frames (sheet 2·3)
- Definition of Done: C1~C6 전부 green, 37~50 ego-browser 스크린샷 검토

## Work slices
- [ ] S1. 37~42: 랙 포커스(초점 전환 꽃↔캐릭터) · 렌즈 플레어 · 카메라 셰이크 · 모션 블러(기차) · 컬러 그레이딩(전/후 비교) · 레터박스 — 완료 기준: C4 37~42 green
- [ ] S2. 43~49: 보케(야간 조명) · 틸트 시프트(미니어처) · 어안 · 갓레이(숲 빛내림) · 셀렉티브 컬러 · 데이 포 나이트 · 필름 그레인 — 완료 기준: C4 43~49 green
- [ ] S3. 50 원테이크: 컷 없이 마을을 관통하는 연속 경로 — 완료 기준: C3 50 green
- [ ] S4. 전체 통과: C1~C6 실행, 실패 수정(검사 약화 금지) — 완료 기준: C1~C6 모두 green (depends: S1, S2, S3)
- [ ] S5. 37~50 시각 확인(ego-browser) 및 수정 — 완료 기준: 스크린샷 검토 기록 run.md (depends: S4)
