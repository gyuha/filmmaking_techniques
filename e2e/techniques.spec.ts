// C5 — 실제 화면 E2E (.forge/loop.md)
import { expect, test } from '@playwright/test';
import { TECHNIQUES } from '../src/data/techniques';
import { canvasPixels, meanAbsDiff, openApp, variance } from './util';

// 기법별로 반드시 켜져 있어야 하는 후처리 패스(효과 메커니즘이 실제 렌더러에 연결됐는지)
const EXPECTED_PASS: Record<number, string> = {
  17: 'dissolve', 18: 'wipe', 22: 'iris', 23: 'fade', 26: 'split', 28: 'sepia',
  38: 'flare', 40: 'motionBlur', 41: 'colorGrade', 42: 'letterbox', 43: 'bokeh', 44: 'tiltShift',
  45: 'fisheye', 46: 'godRays', 47: 'selectiveColor', 48: 'dayForNight', 49: 'grain', 37: 'dof',
  64: 'ripple', 65: 'flash', 67: 'double', 68: 'anamorphic', 71: 'glitch',
};

test('C5 모든 기법: 두 화면·텍스트·리그·콘솔 오류', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(String(e)));
  await openApp(page);

  for (const t of TECHNIQUES) {
    await page.click(`#technique-list button[data-technique-id="${t.id}"]`);
    await page.evaluate(() => (window as any).__ft.pause());
    const state = await page.evaluate(() => (window as any).__ft.getState());
    expect(state.id, `#${t.id} 선택됨`).toBe(t.id);
    const D = state.duration as number;

    // 두 화면이 비어 있지 않음
    await page.evaluate((x) => (window as any).__ft.seek(x), D * 0.25);
    const dir = await canvasPixels(page, '#director-canvas');
    const camA = await canvasPixels(page, '#camera-canvas');
    expect(variance(dir), `#${t.id} 감독 시점 비어있음`).toBeGreaterThan(50);
    expect(variance(camA), `#${t.id} 카메라 화면 비어있음`).toBeGreaterThan(20);

    // 시간이 지나면 카메라 화면이 달라짐
    await page.evaluate((x) => (window as any).__ft.seek(x), D * 0.75);
    const camB = await canvasPixels(page, '#camera-canvas');
    expect(meanAbsDiff(camA, camB), `#${t.id} 카메라 화면이 시간에 따라 변하지 않음`).toBeGreaterThan(1);

    // 감독 시점에 카메라 리그
    expect(await page.evaluate(() => (window as any).__ft.hasCameraRig()), `#${t.id} 카메라 리그`).toBe(true);

    // 효과 패스 연결
    if (EXPECTED_PASS[t.id]) {
      const pass = EXPECTED_PASS[t.id];
      const found = await page.evaluate(
        ({ D, pass }) => {
          const ft = (window as any).__ft;
          for (let i = 0; i <= 40; i++) {
            ft.seek((D * i) / 40);
            if (ft.getState().activePasses.includes(pass)) return true;
          }
          return false;
        },
        { D, pass },
      );
      expect(found, `#${t.id} ${pass} 패스`).toBe(true);
    }

    // 설명 텍스트
    await expect(page.locator('#tech-name')).toHaveText(t.name);
    await expect(page.locator('#description')).toHaveText(t.screenDescription);
    await expect(page.locator('#usage')).toHaveText(t.usage);
    await expect(page.locator('#description')).toBeVisible();
    await expect(page.locator('#usage')).toBeVisible();
  }

  // 재생하면 시간이 흐른다
  await page.evaluate(() => (window as any).__ft.play());
  const t0 = await page.evaluate(() => (window as any).__ft.getState().t);
  await page.waitForTimeout(600);
  const t1 = await page.evaluate(() => (window as any).__ft.getState().t);
  expect(t1).not.toBe(t0);

  expect(errors, errors.join('\n')).toEqual([]);
});
