import type { Page } from '@playwright/test';

/** canvas를 작은 크기로 줄여 RGB 배열로 읽는다(WebGL은 preserveDrawingBuffer=true) */
export async function canvasPixels(page: Page, selector: string, w = 64, h = 36): Promise<number[]> {
  return page.evaluate(
    ({ selector, w, h }) => {
      const src = document.querySelector(selector) as HTMLCanvasElement;
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(src, 0, 0, w, h);
      const d = ctx.getImageData(0, 0, w, h).data;
      const out: number[] = [];
      for (let i = 0; i < d.length; i += 4) out.push(d[i], d[i + 1], d[i + 2]);
      return out;
    },
    { selector, w, h },
  );
}

export function variance(px: number[]) {
  const mean = px.reduce((a, b) => a + b, 0) / px.length;
  return px.reduce((a, b) => a + (b - mean) ** 2, 0) / px.length;
}

/** 두 이미지의 평균 절대 차이(0~255) */
export function meanAbsDiff(a: number[], b: number[]) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]);
  return s / a.length;
}

export async function openApp(page: Page, query = '') {
  await page.goto('/' + query);
  await page.waitForFunction(() => (window as any).__ft?.ready === true, undefined, { timeout: 60_000 });
}
