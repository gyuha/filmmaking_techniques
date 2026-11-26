import { PARTS, TECHNIQUES } from '../data/techniques';
import { thumbUrl } from '../data/thumbs';
import type { Frame } from '../techniques/types';
import type { Stage } from '../view/stage';
import { primaryShot } from '../view/cameraView';

const $ = <T extends HTMLElement = HTMLElement>(sel: string) => document.querySelector(sel) as T;

const SEG_COLORS = ['#ff8a1c', '#4fb3bf', '#ffd166', '#a78bfa', '#7bd389', '#f472b6', '#60a5fa', '#fb7185'];

export function buildSidebar(onSelect: (id: number) => void) {
  const nav = $('#technique-list');
  nav.innerHTML = '';
  for (const p of PARTS) {
    const sec = document.createElement('section');
    sec.className = 'part';
    const h = document.createElement('h2');
    h.textContent = `${p.part}부 · ${p.partName}`;
    sec.appendChild(h);
    const ol = document.createElement('ol');
    for (const t of TECHNIQUES.filter((x) => x.part === p.part)) {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.techniqueId = String(t.id);
      b.innerHTML = `<img class="thumb" alt="" loading="lazy" decoding="async"><span class="label"><span class="num">${String(t.id).padStart(2, '0')}</span><span class="name"></span></span>`;
      const img = b.querySelector('img') as HTMLImageElement;
      img.src = thumbUrl(t.id);
      img.alt = `${t.name} 대표 장면`;
      (b.querySelector('.name') as HTMLElement).textContent = t.name;
      b.addEventListener('click', () => onSelect(t.id));
      li.appendChild(b);
      ol.appendChild(li);
    }
    sec.appendChild(ol);
    nav.appendChild(sec);
  }
}

export function showInfo(id: number) {
  const t = TECHNIQUES.find((x) => x.id === id)!;
  $('#tech-number').textContent = String(t.id).padStart(2, '0');
  $('#tech-name').textContent = t.name;
  $('#tech-meta').textContent = `${t.nameEn} · ${t.part}부 ${t.partName}`;
  $('#description').textContent = t.screenDescription;
  $('#usage').textContent = t.usage;
  document.querySelectorAll<HTMLButtonElement>('#technique-list button').forEach((b) => {
    b.setAttribute('aria-current', b.dataset.techniqueId === String(id) ? 'true' : 'false');
  });
  document.querySelector<HTMLButtonElement>(`#technique-list button[data-technique-id="${id}"]`)?.scrollIntoView({ block: 'nearest' });
  document.title = `${t.name} — 영상 기법 50`;
}

/** 샷 구간(컷)과 속도·밝기 그래프를 타임라인에 그린다 */
export function buildTimeline(stage: Stage) {
  const impl = stage.impl;
  const N = 300;
  const samples: Frame[] = [];
  for (let i = 0; i <= N; i++) samples.push(impl.sample((impl.duration * i) / N));
  const segs: { id: string; from: number; to: number }[] = [];
  for (let i = 0; i < samples.length; i++) {
    const id = primaryShot(samples[i]).id;
    const last = segs[segs.length - 1];
    if (last && last.id === id) last.to = i;
    else segs.push({ id, from: i, to: i });
  }
  const ids = [...new Set(segs.map((s) => s.id))];
  const box = $('#timeline-segments');
  box.innerHTML = '';
  for (const s of segs) {
    const d = document.createElement('div');
    d.className = 'seg';
    d.style.width = `${((s.to - s.from + 1) / samples.length) * 100}%`;
    d.style.background = ids.length > 1 ? SEG_COLORS[ids.indexOf(s.id) % SEG_COLORS.length] : '#3a3f52';
    d.textContent = ids.length > 1 ? s.id : '';
    box.appendChild(d);
  }

  const svg = $('#timeline-graph') as unknown as SVGSVGElement;
  svg.innerHTML = '';
  svg.setAttribute('viewBox', `0 0 ${N} 100`);
  const legend: string[] = [];
  if (ids.length > 1) legend.push(`컷 ${segs.length - 1}번 · 샷 ${ids.length}개`);
  const line = (vals: number[], color: string) => {
    const pl = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    pl.setAttribute('points', vals.map((v, i) => `${i},${v}`).join(' '));
    pl.setAttribute('fill', 'none');
    pl.setAttribute('stroke', color);
    pl.setAttribute('stroke-width', '2');
    pl.setAttribute('vector-effect', 'non-scaling-stroke');
    svg.appendChild(pl);
  };
  const ts = samples.map((f) => f.timeScale);
  if (Math.max(...ts) - Math.min(...ts) > 1e-6 || Math.abs(ts[0] - 1) > 1e-6) {
    const lo = Math.min(-1, ...ts);
    const hi = Math.max(2, ...ts);
    line(ts.map((v) => 92 - ((v - lo) / (hi - lo)) * 84), '#ffffff');
    legend.push('흰 선: 속도(장면 시간 배율)');
  }
  const br = samples.map((f) => f.effects.brightness);
  if (Math.min(...br) < 0.999) {
    line(br.map((v) => 92 - v * 84), '#ffd166');
    legend.push('노란 선: 밝기');
  }
  $('#timeline-legend').textContent = legend.join('  ·  ');
}

export function updateLive(stage: Stage) {
  const f = stage.lastFrame;
  $('#playhead').style.left = `calc(${(stage.t / stage.impl.duration) * 100}% - 1px)`;
  const ts = f.timeScale;
  $('#readout').textContent = `${stage.t.toFixed(2)}s / ${stage.impl.duration.toFixed(1)}s · 장면 속도 ${ts.toFixed(2)}× · 샷 ${primaryShot(f).id}`;
  const cap = primaryShot(f).world.props.caption;
  const overlay = $('#overlay');
  const text = typeof cap === 'string' ? cap : '';
  if (overlay.dataset.text !== text) {
    overlay.dataset.text = text;
    overlay.innerHTML = text ? `<span class="caption"></span>` : '';
    if (text) (overlay.querySelector('.caption') as HTMLElement).textContent = text;
  }
}

export function bindControls(stage: Stage) {
  const play = $('#play');
  const sync = () => (play.textContent = stage.playing ? '❚❚' : '▶');
  play.addEventListener('click', () => {
    stage.playing = !stage.playing;
    sync();
  });
  $('#restart').addEventListener('click', () => {
    stage.seek(0);
    stage.playing = true;
    sync();
  });
  $<HTMLSelectElement>('#speed').addEventListener('change', (e) => {
    stage.speed = Number((e.target as HTMLSelectElement).value);
  });
  $('#timeline-track').addEventListener('click', (e) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    stage.seek(((e.clientX - r.left) / r.width) * stage.impl.duration);
  });
  return sync;
}
