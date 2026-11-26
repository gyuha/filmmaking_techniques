// C6 — 기법끼리 서로 다름 (.forge/loop.md)
import { expect, test } from '@playwright/test';
import { canvasPixels, meanAbsDiff, openApp } from './util';

test('C6 결정적 시점의 카메라 화면 50개가 모두 서로 다름', async ({ page }) => {
  await openApp(page);
  const shots: number[][] = [];
  for (let id = 1; id <= 50; id++) {
    await page.evaluate((id) => {
      const ft = (window as any).__ft;
      ft.select(id);
      ft.pause();
      ft.seek(ft.getState().duration * 0.5);
    }, id);
    shots.push(await canvasPixels(page, '#camera-canvas', 48, 27));
  }
  const same: string[] = [];
  for (let i = 0; i < 50; i++) {
    for (let j = i + 1; j < 50; j++) {
      if (meanAbsDiff(shots[i], shots[j]) <= 3) same.push(`${i + 1}↔${j + 1}`);
    }
  }
  expect(same, `거의 같은 화면 ${same.length}쌍: ${same.slice(0, 20).join(', ')}`).toEqual([]);
});
