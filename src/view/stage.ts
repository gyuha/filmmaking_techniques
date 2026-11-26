import * as THREE from 'three';
import { Town } from '../scene/town';
import { getImpl } from '../techniques';
import type { Frame, TechniqueImpl } from '../techniques/types';
import { CameraView } from './cameraView';
import { activePasses } from './composite';
import { DirectorView } from './directorView';

/** 두 화면(감독 시점·카메라 화면)과 재생 시간을 함께 관리 */
export class Stage {
  readonly scene = new THREE.Scene();
  readonly town = new Town();
  readonly camera: CameraView;
  readonly director: DirectorView;
  impl: TechniqueImpl;
  t = 0;
  playing = true;
  speed = 1;
  lastFrame: Frame;
  private last = performance.now();
  private listeners: ((s: Stage) => void)[] = [];

  constructor(directorCanvas: HTMLCanvasElement, cameraCanvas: HTMLCanvasElement, initialId: number) {
    this.scene.add(this.town.root);
    this.camera = new CameraView(cameraCanvas, this.town, this.scene);
    this.director = new DirectorView(directorCanvas, this.scene);
    this.impl = getImpl(initialId);
    this.lastFrame = this.impl.sample(0);
    this.select(initialId);
  }

  onTick(fn: (s: Stage) => void) {
    this.listeners.push(fn);
  }

  select(id: number) {
    this.impl = getImpl(id);
    this.town.setActiveProps(this.impl.props ?? []);
    this.director.setTechnique(this.impl);
    this.t = 0;
    this.renderNow();
  }

  seek(t: number) {
    this.t = Math.max(0, Math.min(this.impl.duration, t));
    this.renderNow();
  }

  resize() {
    for (const [view, canvas] of [[this.director, this.director.canvas], [this.camera, this.camera.canvas]] as const) {
      const r = canvas.parentElement!.getBoundingClientRect();
      view.resize(r.width, r.height);
    }
    this.renderNow();
  }

  renderNow() {
    const frame = this.impl.sample(this.t);
    this.lastFrame = frame;
    this.camera.render(frame, this.t, (tt) => this.impl.sample(Math.max(0, tt)));
    this.director.render(frame, this.camera.aspect);
    for (const fn of this.listeners) fn(this);
  }

  tick = () => {
    const now = performance.now();
    const dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    if (this.playing) {
      this.t += dt * this.speed;
      if (this.t > this.impl.duration) this.t = 0;
    }
    this.renderNow();
    requestAnimationFrame(this.tick);
  };

  start() {
    this.last = performance.now();
    requestAnimationFrame(this.tick);
  }

  debugState() {
    const f = this.lastFrame;
    return {
      id: this.impl.id,
      t: this.t,
      duration: this.impl.duration,
      placeholder: this.impl.placeholder === true,
      frame: f,
      activePasses: activePasses(f.composite, f.effects),
      rigCount: this.director.visibleRigCount(),
    };
  }
}
