// C2 — 데이터 검사 (.forge/loop.md)
import { describe, expect, it } from 'vitest';
import { TECHNIQUES } from '../src/data/techniques';
import { EXPECTED, EXPECTED_PARTS, TOTAL } from './fixtures/technique-names';

describe('C2 기법 데이터', () => {
  it('정확히 71개(정답 목록과 같은 수)', () => {
    expect(TOTAL).toBe(71);
    expect(EXPECTED).toHaveLength(TOTAL);
    expect(TECHNIQUES).toHaveLength(TOTAL);
  });

  it('id 1..71, 중복 없음, 순서대로', () => {
    expect(TECHNIQUES.map((t) => t.id)).toEqual(Array.from({ length: TOTAL }, (_, i) => i + 1));
  });

  it('이름과 부 분류가 정답 목록과 정확히 일치', () => {
    for (const [id, part, name] of EXPECTED) {
      const t = TECHNIQUES.find((x) => x.id === id)!;
      expect(t, `#${id}`).toBeDefined();
      expect(t.name, `#${id} name`).toBe(name);
      expect(t.part, `#${id} part`).toBe(part);
      expect(t.partName, `#${id} partName`).toBe(EXPECTED_PARTS[part]);
    }
  });

  it('화면 설명 ≥ 60자, 사용 상황 ≥ 40자, 서로 다름', () => {
    for (const t of TECHNIQUES) {
      expect(t.screenDescription.trim().length, `#${t.id} screenDescription`).toBeGreaterThanOrEqual(60);
      expect(t.usage.trim().length, `#${t.id} usage`).toBeGreaterThanOrEqual(40);
      expect(t.screenDescription.trim(), `#${t.id}`).not.toBe(t.usage.trim());
    }
  });

  it('화면 설명·사용 상황 중복 없음', () => {
    expect(new Set(TECHNIQUES.map((t) => t.screenDescription.trim())).size).toBe(TOTAL);
    expect(new Set(TECHNIQUES.map((t) => t.usage.trim())).size).toBe(TOTAL);
  });
});
