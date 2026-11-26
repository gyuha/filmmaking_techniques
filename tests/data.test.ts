// C2 — 데이터 검사 (.forge/loop.md)
import { describe, expect, it } from 'vitest';
import { TECHNIQUES } from '../src/data/techniques';
import { EXPECTED, EXPECTED_PARTS } from './fixtures/technique-names';

describe('C2 기법 데이터', () => {
  it('정확히 50개', () => {
    expect(TECHNIQUES).toHaveLength(50);
  });

  it('id 1..50, 중복 없음, 순서대로', () => {
    expect(TECHNIQUES.map((t) => t.id)).toEqual(Array.from({ length: 50 }, (_, i) => i + 1));
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

  it('50개 화면 설명·사용 상황 중복 없음', () => {
    expect(new Set(TECHNIQUES.map((t) => t.screenDescription.trim())).size).toBe(50);
    expect(new Set(TECHNIQUES.map((t) => t.usage.trim())).size).toBe(50);
  });
});
