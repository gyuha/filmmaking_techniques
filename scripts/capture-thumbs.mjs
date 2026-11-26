// 모든 기법의 대표 장면(카메라 화면)을 public/thumbs/NN.jpg 로 저장한다.
// 사용: pnpm thumbs   (빌드 후 vite preview 를 띄워 캡처)
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'public', 'thumbs');
const PORT = 4174;

const server = spawn('pnpm', ['exec', 'vite', 'preview', '--port', String(PORT), '--strictPort'], { cwd: root, stdio: 'ignore' });
const stop = () => server.kill();
process.on('exit', stop);

async function waitServer() {
  for (let i = 0; i < 100; i++) {
    try {
      const r = await fetch(`http://localhost:${PORT}/`);
      if (r.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('preview server did not start');
}

await waitServer();
await mkdir(outDir, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(`http://localhost:${PORT}/`);
await page.waitForFunction(() => window.__ft?.ready === true);
const { THUMB_AT } = await import(path.join(root, 'src/data/thumbs.ts')).catch(() => ({ THUMB_AT: null }));
const ids = await page.evaluate(() => [...document.querySelectorAll('#technique-list button')].map((b) => Number(b.dataset.techniqueId)));
for (const id of ids) {
  const k = THUMB_AT?.[id] ?? 0.5;
  const dataUrl = await page.evaluate(
    ([id, k]) => {
      const ft = window.__ft;
      ft.select(id);
      ft.pause();
      ft.seek(ft.getState().duration * k);
      const src = document.querySelector('#camera-canvas');
      const c = document.createElement('canvas');
      c.width = 384;
      c.height = 216;
      c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
      return c.toDataURL('image/jpeg', 0.82);
    },
    [id, k],
  );
  const file = path.join(outDir, `${String(id).padStart(2, '0')}.jpg`);
  await writeFile(file, Buffer.from(dataUrl.split(',')[1], 'base64'));
}
await browser.close();
stop();
console.log(`saved ${ids.length} thumbnails → ${path.relative(root, outDir)}`);
