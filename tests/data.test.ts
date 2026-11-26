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

describe('AI 프롬프트(한국어 · English)', () => {
  it('모든 기법에 한국어·영어 프롬프트가 있고 기법 이름이 들어 있음', async () => {
    const { PROMPTS } = await import('../src/data/prompts');
    const hangul = /[가-힣]/;
    for (const t of TECHNIQUES) {
      const p = PROMPTS[t.id];
      expect(p, `#${t.id} 프롬프트 없음`).toBeDefined();
      expect(p.ko.trim().length, `#${t.id} ko`).toBeGreaterThanOrEqual(30);
      expect(p.en.trim().length, `#${t.id} en`).toBeGreaterThanOrEqual(40);
      expect(hangul.test(p.ko), `#${t.id} ko는 한국어`).toBe(true);
      expect(hangul.test(p.en), `#${t.id} en에 한글 없음`).toBe(false);
      for (const part of t.name.split(/[·/]/).map((s) => s.trim()).filter(Boolean)) expect(p.ko, `#${t.id} ko에 '${part}'`).toContain(part);
      for (const part of t.nameEn.split(/[&/()]/).map((s) => s.trim()).filter(Boolean)) expect(p.en.toLowerCase(), `#${t.id} en에 '${part}'`).toContain(part.toLowerCase());
    }
    expect(Object.keys(PROMPTS)).toHaveLength(TOTAL);
  });
});
