<!-- auto-retro: fg-loop -->
# 2026-11-26 — 1부 카메라 무빙 + 2부 앵글과 숏(1~16)

## Plan vs actual
- What went as planned: 16개 정의 테스트가 첫 구현에서 모두 통과
- Divergences: 테스트는 통과했지만 14번 화면이 눈동자만 꽉 찬 검은 화면이었음 — 수학 단언(피사체 화면 비율 ≥ 0.9)만으로는 "보기 좋은 화면"을 보장하지 못함. 감독 시점 프레이밍도 스크린샷으로만 문제를 발견

## Learnings
- Do differently next time: 기법 구현 직후 반드시 스크린샷 시트(크롭+타일)로 두 화면을 눈으로 확인 — 테스트 green은 필요조건일 뿐. 클로즈업은 대상 크기 ÷ tan(fov/2)로 거리를 계산할 것

## Doc updates
- 검토 전 (자동 회고)
