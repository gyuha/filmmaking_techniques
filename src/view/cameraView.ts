import * as THREE from 'three';
import type { CameraPose, Frame, ShotFrame } from '../techniques/types';
import type { Town } from '../scene/town';
import { CompositePass } from './composite';

export const NEAR = 0.1;
export const FAR = 600;

/** 기법의 카메라 상태를 three.js 카메라에 그대로 옮긴다 */
export function applyPose(cam: THREE.PerspectiveCamera, p: CameraPose, aspect: number) {
  cam.position.set(p.position[0], p.position[1], p.position[2]);
  cam.up.set(0, 1, 0);
  cam.lookAt(p.target[0], p.target[1], p.target[2]);
  if (p.roll) cam.rotateZ(THREE.MathUtils.degToRad(p.roll));
  cam.fov = p.fov;
  cam.aspect = aspect;
  cam.near = NEAR;
  cam.far = FAR;
  cam.updateProjectionMatrix();
  cam.updateMatrixWorld(true);
}

const MOTION_BLUR_SUBFRAMES = 8;

/** 오른쪽 "카메라 화면": 샷마다 렌더 타깃에 그린 뒤 합성 패스로 최종 화면을 만든다 */
export class CameraView {
  readonly renderer: THREE.WebGLRenderer;
  private targets: THREE.WebGLRenderTarget[] = [];
  private cams = [0, 1, 2, 3].map(() => new THREE.PerspectiveCamera());
  private pass = new CompositePass();
  private accumTarget: THREE.WebGLRenderTarget;
  private subTarget: THREE.WebGLRenderTarget;
  private accumScene = new THREE.Scene();
  private accumMat: THREE.MeshBasicMaterial;
  private width = 1;
  private height = 1;

  constructor(readonly canvas: HTMLCanvasElement, private town: Town, private scene: THREE.Scene) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    for (let i = 0; i < 4; i++) this.targets.push(this.makeTarget(i === 0));
    this.accumTarget = this.makeTarget(false);
    this.subTarget = this.makeTarget(false);
    this.accumMat = new THREE.MeshBasicMaterial({ transparent: true, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.accumMat);
    quad.frustumCulled = false;
    this.accumScene.add(quad);
  }

  private makeTarget(withDepth: boolean) {
    const t = new THREE.WebGLRenderTarget(1, 1, { samples: 0, type: THREE.HalfFloatType });
    t.texture.colorSpace = THREE.LinearSRGBColorSpace;
    if (withDepth) t.depthTexture = new THREE.DepthTexture(1, 1);
    return t;
  }

  resize(w: number, h: number) {
    this.width = Math.max(1, Math.floor(w));
    this.height = Math.max(1, Math.floor(h));
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(this.width, this.height, false);
    for (const t of [...this.targets, this.accumTarget, this.subTarget]) t.setSize(this.width, this.height);
    this.pass.material.uniforms.resolution.value.set(this.width, this.height);
  }

  get aspect() {
    return this.width / this.height;
  }

  private shotAspect(frame: Frame) {
    const c = frame.composite;
    if (c.kind !== 'split') return this.aspect;
    if (c.panes <= 2) return this.aspect / 2;
    if (c.panes === 3) return this.aspect / 3;
    return this.aspect;
  }

  private renderShot(shot: ShotFrame, cam: THREE.PerspectiveCamera, target: THREE.WebGLRenderTarget, aspect: number) {
    this.town.applyWorld(shot.world);
    applyPose(cam, shot.camera, aspect);
    this.renderer.setRenderTarget(target);
    this.renderer.clear();
    this.renderer.render(this.scene, cam);
  }

  /**
   * @param sampleAt 모션 블러용: 셔터가 열린 동안의 이전 순간들을 다시 샘플링
   */
  render(frame: Frame, time: number, sampleAt: (t: number) => Frame) {
    const aspect = this.shotAspect(frame);
    const shots = frame.shots.slice(0, 4);
    shots.forEach((s, i) => this.renderShot(s, this.cams[i], this.targets[i], aspect));

    let colorA: THREE.Texture = this.targets[0].texture;
    if (frame.effects.motionBlur > 0) {
      // 셔터 개방 시간 동안 여러 순간을 겹쳐 그린다 → 움직인 만큼 번진다
      const shutter = (1 / 24) * Math.min(4, 1 + frame.effects.motionBlur * 3);
      this.renderer.setRenderTarget(this.accumTarget);
      this.renderer.setClearColor(0x000000, 1);
      this.renderer.clear();
      for (let k = 0; k < MOTION_BLUR_SUBFRAMES; k++) {
        const sub = sampleAt(frame.t - (shutter * k) / (MOTION_BLUR_SUBFRAMES - 1));
        this.renderShot(sub.shots[0], this.cams[0], this.subTarget, aspect);
        this.accumMat.map = this.subTarget.texture;
        this.accumMat.opacity = 1 / MOTION_BLUR_SUBFRAMES;
        this.accumMat.needsUpdate = true;
        this.renderer.setRenderTarget(this.accumTarget);
        this.renderer.autoClear = false;
        this.renderer.render(this.accumScene, this.pass.camera);
        this.renderer.autoClear = true;
      }
      colorA = this.accumTarget.texture;
      // 깊이·해 위치 계산은 현재 순간 기준으로 되돌린다
      this.renderShot(shots[0], this.cams[0], this.targets[0], aspect);
    }

    const u = this.pass.material.uniforms;
    u.tA.value = colorA;
    u.tB.value = this.targets[Math.min(1, shots.length - 1)].texture;
    u.tC.value = this.targets[Math.min(2, shots.length - 1)].texture;
    u.tD.value = this.targets[Math.min(3, shots.length - 1)].texture;
    u.dA.value = this.targets[0].depthTexture;
    u.cameraNear.value = NEAR;
    u.cameraFar.value = FAR;
    u.time.value = time;

    // 해·피사체의 화면 위치(현재 첫 샷 기준)
    const cam0 = this.cams[0];
    this.town.applyWorld(shots[0].world);
    const sun = this.town.sunPosition.clone();
    const toSun = sun.clone().sub(cam0.position).normalize();
    const fwd = new THREE.Vector3();
    cam0.getWorldDirection(fwd);
    const ndc = sun.clone().project(cam0);
    u.sunScreen.value.set((ndc.x + 1) / 2, (ndc.y + 1) / 2, toSun.dot(fwd) > 0.2 && this.town.sunDisc.visible ? 1 : 0);
    const sp = shots[0].world.subject.position;
    const subj = new THREE.Vector3(sp[0], sp[1], sp[2]).project(cam0);
    u.irisCenter.value.set((subj.x + 1) / 2, (subj.y + 1) / 2);

    this.pass.set(frame.composite, frame.effects);
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.pass.scene, this.pass.camera);

    // 감독 시점에서 쓸 수 있도록 장면 상태를 "주 샷"으로 되돌린다
    this.town.applyWorld(primaryShot(frame).world);
  }
}

/** 감독 시점에 보여줄 대표 샷 */
export function primaryShot(frame: Frame): ShotFrame {
  const c = frame.composite;
  if (frame.shots.length > 1) {
    if (c.kind === 'dissolve' && c.alpha > 0.5) return frame.shots[1];
    if (c.kind === 'wipe' && c.progress > 0.5) return frame.shots[1];
    if (c.kind === 'ripple' && c.alpha > 0.5) return frame.shots[1];
  }
  return frame.shots[0];
}
