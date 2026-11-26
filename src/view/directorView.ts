import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { CameraPose, Frame, TechniqueImpl, Vec3 } from '../techniques/types';
import { primaryShot } from './cameraView';

/** 카메라 리그·경로가 올라가는 레이어(촬영 카메라에는 안 보임) */
export const RIG_LAYER = 1;

function onRigLayer(o: THREE.Object3D) {
  o.traverse((c) => c.layers.set(RIG_LAYER));
}

/** 감독 시점에 보이는 영화 카메라 모형 + 시야 원뿔 */
class CameraRig {
  readonly group = new THREE.Group();
  private bodyMat = new THREE.MeshStandardMaterial({ color: '#2b2f3a', roughness: 0.5 });
  private accentMat = new THREE.MeshStandardMaterial({ color: '#ff8a1c', roughness: 0.4, emissive: '#ff8a1c', emissiveIntensity: 0.2 });
  private frustum: THREE.LineSegments;
  private frustumGeo = new THREE.BufferGeometry();
  private frustumMat = new THREE.LineBasicMaterial({ color: '#ffd166', transparent: true, opacity: 0.9 });

  constructor() {
    const s = 0.6;
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.5 * s * 2, 0.6 * s * 2, 0.9 * s * 2), this.bodyMat);
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.75, 16), this.accentMat);
    lens.rotation.x = Math.PI / 2;
    lens.position.z = 0.85;
    const reelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.12, 20);
    const reel1 = new THREE.Mesh(reelGeo, this.bodyMat);
    reel1.rotation.z = Math.PI / 2;
    reel1.position.set(0, 0.74, -0.05);
    const reel2 = reel1.clone();
    reel2.position.set(0, 0.74, -0.7);
    this.frustumGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(16 * 3), 3));
    this.frustum = new THREE.LineSegments(this.frustumGeo, this.frustumMat);
    this.group.add(body, lens, reel1, reel2, this.frustum);
    onRigLayer(this.group);
  }

  set(p: CameraPose, aspect: number, active: boolean) {
    this.group.visible = true;
    this.group.position.set(p.position[0], p.position[1], p.position[2]);
    this.group.up.set(0, 1, 0);
    this.group.lookAt(p.target[0], p.target[1], p.target[2]);
    if (p.roll) this.group.rotateZ(THREE.MathUtils.degToRad(-p.roll));
    // 시야 원뿔: 화각이 넓으면 넓게, 좁으면 길고 좁게
    const L = THREE.MathUtils.clamp(2.2 * (45 / p.fov), 1.2, 7);
    const hy = Math.tan(THREE.MathUtils.degToRad(p.fov / 2)) * L;
    const hx = hy * aspect;
    const c = [
      [hx, hy, L], [-hx, hy, L], [-hx, -hy, L], [hx, -hy, L],
    ];
    const pos = this.frustumGeo.getAttribute('position') as THREE.BufferAttribute;
    let i = 0;
    const put = (v: number[]) => pos.setXYZ(i++, v[0], v[1], v[2]);
    for (let k = 0; k < 4; k++) {
      put([0, 0, 0.6]);
      put(c[k]);
    }
    for (let k = 0; k < 4; k++) {
      put(c[k]);
      put(c[(k + 1) % 4]);
    }
    pos.needsUpdate = true;
    this.frustumGeo.computeBoundingSphere();
    this.accentMat.color.set(active ? '#ff8a1c' : '#8a8f9c');
    this.accentMat.emissive.set(active ? '#ff8a1c' : '#000000');
    this.frustumMat.color.set(active ? '#ffd166' : '#9aa3b5');
    this.frustumMat.opacity = active ? 0.95 : 0.45;
  }

  hide() {
    this.group.visible = false;
  }
}

/** 왼쪽 "감독 시점": 마을 전체를 자유롭게 돌려 보며 촬영 카메라의 위치·방향·경로를 본다 */
export class DirectorView {
  readonly renderer: THREE.WebGLRenderer;
  readonly camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
  readonly controls: OrbitControls;
  private rigs = [0, 1, 2, 3].map(() => new CameraRig());
  private path: THREE.LineSegments;
  private pathGeo = new THREE.BufferGeometry();
  private targetMarker: THREE.Mesh;
  private width = 1;
  private height = 1;

  constructor(readonly canvas: HTMLCanvasElement, private scene: THREE.Scene) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.camera.layers.enable(RIG_LAYER);
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    for (const r of this.rigs) scene.add(r.group);
    this.path = new THREE.LineSegments(this.pathGeo, new THREE.LineBasicMaterial({ color: '#ffd166', transparent: true, opacity: 0.85 }));
    this.path.frustumCulled = false;
    onRigLayer(this.path);
    scene.add(this.path);
    this.targetMarker = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.7, 32), new THREE.MeshBasicMaterial({ color: '#ffd166', side: THREE.DoubleSide, transparent: true, opacity: 0.7 }));
    this.targetMarker.rotation.x = -Math.PI / 2;
    onRigLayer(this.targetMarker);
    scene.add(this.targetMarker);
  }

  resize(w: number, h: number) {
    this.width = Math.max(1, Math.floor(w));
    this.height = Math.max(1, Math.floor(h));
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(this.width, this.height, false);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  }

  /** 기법이 바뀌면 경로를 다시 그리고 전체가 보이도록 감독 카메라를 배치 */
  setTechnique(impl: TechniqueImpl) {
    const N = 240;
    const pts: number[] = [];
    const box = new THREE.Box3();
    let prev: { id: string; p: Vec3 } | null = null;
    for (let i = 0; i <= N; i++) {
      const f = impl.sample((impl.duration * i) / N);
      for (const s of f.shots) box.expandByPoint(new THREE.Vector3(...s.camera.position));
      box.expandByPoint(new THREE.Vector3(...f.shots[0].world.subject.position));
      const cur = { id: f.shots[0].id, p: f.shots[0].camera.position };
      if (prev && prev.id === cur.id) {
        const jump = Math.hypot(cur.p[0] - prev.p[0], cur.p[1] - prev.p[1], cur.p[2] - prev.p[2]);
        if (jump < 4) pts.push(...prev.p, ...cur.p);
      }
      prev = cur;
    }
    this.pathGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    this.pathGeo.computeBoundingSphere();

    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const radius = Math.max(3, size.length() * 0.55);
    const dir = new THREE.Vector3(0.9, 1.7, 1.3).normalize();
    this.camera.position.copy(center).addScaledVector(dir, radius * 1.7 + 6);
    this.controls.target.copy(center);
    this.controls.update();
  }

  render(frame: Frame, cameraAspect: number) {
    const primary = primaryShot(frame);
    frame.shots.slice(0, 4).forEach((s, i) => this.rigs[i].set(s.camera, cameraAspect, s === primary));
    for (let i = frame.shots.length; i < 4; i++) this.rigs[i].hide();
    const sp = primary.world.subject.position;
    this.targetMarker.position.set(sp[0], 0.03, sp[2]);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  visibleRigCount() {
    return this.rigs.filter((r) => r.group.visible).length;
  }
}
