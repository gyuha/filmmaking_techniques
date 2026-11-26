import * as THREE from 'three';
import type { WorldState } from '../techniques/types';
import { PROP_DEFS, type PropInstance } from './props';
import './allProps';
import { makeCharacter } from './character';

// 장면 스타일 C: 단순한 로우폴리 마을 + 기법별 소품.
// 모든 모델은 three.js 기본 도형으로 만든다(외부 파일 없음).

export const SUN_DISTANCE = 150;

function rand(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const mat = (color: THREE.ColorRepresentation, extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, flatShading: true, ...extra });

function makeHouse(r: () => number, wall: THREE.ColorRepresentation, roof: THREE.ColorRepresentation, windowMats: THREE.Material[]) {
  const g = new THREE.Group();
  const w = 3 + r() * 1.5;
  const h = 2.6 + r() * 1.8;
  const d = 3 + r() * 1.0;
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(wall));
  body.position.y = h / 2;
  body.castShadow = body.receiveShadow = true;
  g.add(body);
  const roofGeo = new THREE.ConeGeometry(Math.max(w, d) * 0.78, 1.6 + r() * 0.6, 4);
  roofGeo.rotateY(Math.PI / 4);
  const roofMesh = new THREE.Mesh(roofGeo, mat(roof));
  roofMesh.position.y = h + 0.75;
  roofMesh.scale.set(w / Math.max(w, d), 1, d / Math.max(w, d));
  roofMesh.castShadow = true;
  g.add(roofMesh);
  const winMat = windowMats[Math.floor(r() * windowMats.length)];
  const cols = Math.max(1, Math.floor(w / 1.2));
  const rows = Math.max(1, Math.floor(h / 1.3));
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const win = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.65), winMat);
      win.position.set(-w / 2 + (i + 0.5) * (w / cols), 0.9 + j * 1.2, d / 2 + 0.01);
      g.add(win);
    }
  }
  const door = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 1.2), mat('#5b3a29'));
  door.position.set(w * 0.25, 0.6, d / 2 + 0.02);
  g.add(door);
  return g;
}

function makeTree(r: () => number) {
  const g = new THREE.Group();
  const h = 1.2 + r() * 1.2;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, h, 6), mat('#7a5230'));
  trunk.position.y = h / 2;
  trunk.castShadow = true;
  g.add(trunk);
  const leafColor = new THREE.Color().setHSL(0.27 + r() * 0.08, 0.5, 0.32 + r() * 0.1);
  const n = 2 + Math.floor(r() * 2);
  for (let i = 0; i < n; i++) {
    const s = 0.9 + r() * 0.6;
    const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 0), mat(leafColor));
    leaf.position.set((r() - 0.5) * 0.8, h + s * 0.6 + i * 0.5, (r() - 0.5) * 0.8);
    leaf.castShadow = true;
    g.add(leaf);
  }
  return g;
}

export class Town {
  readonly root = new THREE.Group();
  readonly character: THREE.Group;
  readonly sun: THREE.DirectionalLight;
  readonly sunDisc: THREE.Mesh;
  readonly moon: THREE.Mesh;
  private hemi: THREE.HemisphereLight;
  private skyMat: THREE.ShaderMaterial;
  private windowLit: THREE.MeshStandardMaterial;
  private lampBulbs: THREE.MeshStandardMaterial;
  private props = new Map<string, PropInstance>();
  private activeProps = new Set<string>();
  /** 현재 적용된 해의 월드 위치(렌즈 플레어·갓레이 계산용) */
  readonly sunPosition = new THREE.Vector3();

  constructor() {
    const r = rand(7);

    // 하늘
    this.skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: { top: { value: new THREE.Color() }, bottom: { value: new THREE.Color() } },
      vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);} `,
      fragmentShader: `uniform vec3 top; uniform vec3 bottom; varying vec3 vP; void main(){ float k = smoothstep(-0.05, 0.6, vP.y); gl_FragColor = vec4(mix(bottom, top, k), 1.0);} `,
    });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), this.skyMat);
    sky.name = 'sky';
    this.root.add(sky);

    // 빛
    this.hemi = new THREE.HemisphereLight('#cfe8ff', '#4a6b3a', 0.9);
    this.root.add(this.hemi);
    this.sun = new THREE.DirectionalLight('#fff4e0', 2.2);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    const sc = this.sun.shadow.camera;
    sc.left = -40; sc.right = 40; sc.top = 40; sc.bottom = -40; sc.near = 1; sc.far = 400;
    this.sun.shadow.bias = -0.0005;
    this.root.add(this.sun, this.sun.target);
    this.sunDisc = new THREE.Mesh(new THREE.SphereGeometry(6, 24, 16), new THREE.MeshBasicMaterial({ color: '#fff3c4', fog: false }));
    this.sunDisc.name = 'sunDisc';
    this.root.add(this.sunDisc);
    this.moon = new THREE.Mesh(new THREE.SphereGeometry(5, 24, 16), new THREE.MeshBasicMaterial({ color: '#f4f1de' }));
    this.moon.position.set(-60, 70, -150);
    this.root.add(this.moon);

    // 땅·길·광장
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), mat('#6aa84f'));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.name = 'ground';
    this.root.add(ground);
    const road = new THREE.Mesh(new THREE.PlaneGeometry(140, 3.2), mat('#d8c39a'));
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.01, 0);
    road.receiveShadow = true;
    this.root.add(road);
    const plaza = new THREE.Mesh(new THREE.CircleGeometry(9, 32), mat('#cdb994'));
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.set(30, 0.015, -4);
    plaza.receiveShadow = true;
    this.root.add(plaza);

    // 창문 재질(밤에 켜짐)
    this.windowLit = new THREE.MeshStandardMaterial({ color: '#9fc6e8', emissive: '#ffcf6b', emissiveIntensity: 0, roughness: 0.2 });
    const windowDark = new THREE.MeshStandardMaterial({ color: '#7aa6cc', roughness: 0.2 });

    // 집
    const walls = ['#f2e2c4', '#e8c9a0', '#f5efe0', '#d9b48f', '#efd9d0', '#cfe0e8'];
    const roofs = ['#c0392b', '#2c5f8a', '#7a3e2a', '#8e5b3a', '#3d6b4a', '#a0442c'];
    const rowsDef = [
      { z: -8, x0: -42, x1: 42, step: 6.2, rot: 0 },
      { z: -17, x0: -46, x1: 46, step: 7, rot: 0 },
      { z: 11, x0: -42, x1: 42, step: 6.5, rot: Math.PI },
    ];
    for (const row of rowsDef) {
      for (let x = row.x0; x <= row.x1; x += row.step) {
        if (row.z === -8 && x > 22 && x < 38) continue; // 광장 자리
        const house = makeHouse(r, walls[Math.floor(r() * walls.length)], roofs[Math.floor(r() * roofs.length)], [this.windowLit, windowDark]);
        house.position.set(x + (r() - 0.5) * 1.2, 0, row.z + (r() - 0.5) * 1.5);
        house.rotation.y = row.rot;
        this.root.add(house);
      }
    }

    // 나무
    for (let i = 0; i < 46; i++) {
      const tree = makeTree(r);
      const side = r() < 0.5 ? -1 : 1;
      const z = side < 0 ? -11.5 - r() * 3 : 6 + r() * 2.5;
      tree.position.set(-48 + r() * 96, 0, z);
      this.root.add(tree);
    }
    // 먼 언덕
    for (let i = 0; i < 9; i++) {
      const hill = new THREE.Mesh(new THREE.SphereGeometry(30 + r() * 25, 16, 10), mat(new THREE.Color().setHSL(0.3, 0.35, 0.3 + r() * 0.08)));
      const a = (i / 9) * Math.PI * 2;
      hill.position.set(Math.cos(a) * 130, -18, Math.sin(a) * 130);
      hill.scale.y = 0.6;
      this.root.add(hill);
    }

    // 울타리
    const fenceMat = mat('#f7f4ec');
    for (let x = -26; x <= 26; x += 0.6) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.7, 0.08), fenceMat);
      p.position.set(x, 0.35, -3.2);
      this.root.add(p);
    }
    const rail = new THREE.Mesh(new THREE.BoxGeometry(52.2, 0.08, 0.06), fenceMat);
    rail.position.set(0, 0.5, -3.2);
    this.root.add(rail);

    // 가로등
    this.lampBulbs = new THREE.MeshStandardMaterial({ color: '#fff2c0', emissive: '#ffd27a', emissiveIntensity: 0.2 });
    for (let x = -36; x <= 36; x += 9) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 3, 6), mat('#2d2d33'));
      post.position.set(x + 4.5, 1.5, 2.2);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8), this.lampBulbs);
      bulb.position.set(x + 4.5, 3.1, 2.2);
      this.root.add(post, bulb);
    }

    // 시계탑(광장)
    const tower = new THREE.Mesh(new THREE.BoxGeometry(2.6, 9, 2.6), mat('#d9c7a5'));
    tower.position.set(30, 4.5, -10);
    tower.castShadow = true;
    const towerRoof = new THREE.Mesh(new THREE.ConeGeometry(2.3, 2.4, 4), mat('#7a3e2a'));
    towerRoof.rotation.y = Math.PI / 4;
    towerRoof.position.set(30, 10.2, -10);
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.9, 24), mat('#fbf7ec'));
    face.position.set(30, 7.2, -8.68);
    this.root.add(tower, towerRoof, face);

    // 캐릭터
    this.character = makeCharacter();
    this.character.name = 'character';
    this.root.add(this.character);
  }

  /** 기법이 쓰는 소품만 켠다 */
  setActiveProps(names: string[]) {
    this.activeProps = new Set(names);
    for (const name of names) {
      if (!this.props.has(name)) {
        const def = PROP_DEFS[name];
        if (!def) continue;
        const inst = def.create();
        this.props.set(name, inst);
        this.root.add(inst.object);
      }
    }
    for (const [name, inst] of this.props) inst.object.visible = this.activeProps.has(name);
  }

  /** 한 샷의 장면 상태를 실제 3D 오브젝트에 적용 */
  applyWorld(world: WorldState) {
    const s = world.subject;
    this.character.visible = world.props.hideSubject !== true;
    this.character.position.set(s.position[0], s.position[1], s.position[2]);
    this.character.rotation.set(0, s.heading, 0);
    const sq = s.squash ?? 0;
    this.character.scale.set(1 + sq * 0.25, 1 - sq * 0.3, 1 + sq * 0.25);
    // 동작·표정(시각 효과만 — 기법 상태값은 바꾸지 않는다)
    const st = world.sceneTime;
    if (s.pose === 'walk' || s.pose === 'run') {
      const f = s.pose === 'run' ? 11 : 7;
      this.character.rotation.z = Math.sin(st * f) * 0.08;
    } else this.character.rotation.z = 0;
    const pupilScale = s.pose === 'surprised' ? 0.55 : s.pose === 'happy' ? 1.15 : 1;
    const pupilDrop = s.pose === 'sad' || s.pose === 'cry' ? -0.05 : 0;
    this.character.children.forEach((c) => {
      if (c.name === 'pupil') {
        c.scale.setScalar(pupilScale);
        c.position.y = 0.12 + pupilDrop;
      }
      if (c.name === 'tear') c.visible = s.pose === 'cry';
    });

    // 시간대: 0 한낮 → 0.5 노을 → 1 밤
    const tod = THREE.MathUtils.clamp(world.timeOfDay, 0, 1);
    const noon = { top: new THREE.Color('#5aa9e6'), bottom: new THREE.Color('#d6eeff') };
    const dusk = { top: new THREE.Color('#3b2a6b'), bottom: new THREE.Color('#f6a35b') };
    const night = { top: new THREE.Color('#070a1f'), bottom: new THREE.Color('#1c2448') };
    const top = new THREE.Color();
    const bottom = new THREE.Color();
    if (tod < 0.5) {
      const k = tod / 0.5;
      top.lerpColors(noon.top, dusk.top, k);
      bottom.lerpColors(noon.bottom, dusk.bottom, k);
    } else {
      const k = (tod - 0.5) / 0.5;
      top.lerpColors(dusk.top, night.top, k);
      bottom.lerpColors(dusk.bottom, night.bottom, k);
    }
    this.skyMat.uniforms.top.value.copy(top);
    this.skyMat.uniforms.bottom.value.copy(bottom);

    // 해: 한낮엔 높게, 노을엔 지평선(-z 방향 앞쪽), 밤엔 지평선 아래
    const sunElev = THREE.MathUtils.lerp(1.15, -0.25, Math.min(1, tod / 0.75));
    const sunAz = typeof world.props.sunAzimuth === 'number' ? world.props.sunAzimuth : 2.6;
    this.sunPosition.set(
      Math.sin(sunAz) * Math.cos(sunElev) * SUN_DISTANCE,
      Math.sin(sunElev) * SUN_DISTANCE,
      -Math.cos(sunAz) * Math.cos(sunElev) * SUN_DISTANCE,
    );
    this.sunDisc.position.copy(this.sunPosition);
    this.sunDisc.visible = sunElev > -0.05;
    (this.sunDisc.material as THREE.MeshBasicMaterial).color.set(tod > 0.35 ? '#ffb46b' : '#fff3c4');
    this.sun.position.copy(this.sunPosition).multiplyScalar(0.4);
    this.sun.target.position.set(0, 0, 0);
    const dayLight = THREE.MathUtils.clamp(Math.sin(sunElev) * 2.2 + 0.25, 0, 1);
    this.sun.intensity = 2.4 * dayLight;
    this.sun.color.set(tod > 0.3 ? '#ffb070' : '#fff4e0');
    this.hemi.intensity = THREE.MathUtils.lerp(0.25, 1.0, dayLight);
    this.hemi.color.set(tod > 0.7 ? '#4a5a9a' : '#cfe8ff');
    this.moon.visible = tod > 0.6;
    const mp = world.props.moon;
    if (Array.isArray(mp) && mp.length === 3) {
      this.moon.position.set(mp[0], mp[1], mp[2]);
      this.moon.scale.setScalar((typeof world.props.moonRadius === 'number' ? world.props.moonRadius : 5) / 5);
    } else {
      this.moon.position.set(-60, 70, -150);
      this.moon.scale.setScalar(1);
    }
    // 조명 스타일(하이키·로우키·실루엣)
    const lighting = world.props.lighting;
    if (lighting === 'high') {
      this.hemi.intensity = 1.9;
      this.hemi.color.set('#ffffff');
      this.sun.intensity = 1.0;
    } else if (lighting === 'low') {
      this.hemi.intensity = 0.04;
      this.sun.intensity = 4.0;
      this.sun.color.set('#ffd9a0');
      this.sun.position.set(-40, 18, 6);
    } else if (lighting === 'silhouette') {
      this.hemi.intensity = 0.02;
      this.sun.intensity = 0.0;
    }
    const lit = THREE.MathUtils.clamp((tod - 0.45) / 0.3, 0, 1);
    this.windowLit.emissiveIntensity = lit * 1.4;
    this.lampBulbs.emissiveIntensity = 0.2 + lit * 2.5;

    const scene = this.root.parent as THREE.Scene | null;
    if (scene) {
      const fog = typeof world.props.fog === 'number' ? world.props.fog : 0;
      if (fog > 0) {
        if (!(scene.fog instanceof THREE.FogExp2)) scene.fog = new THREE.FogExp2('#c9d6c2', fog);
        (scene.fog as THREE.FogExp2).density = fog;
        (scene.fog as THREE.FogExp2).color.copy(bottom).lerp(new THREE.Color('#e8f0d8'), 0.5);
      } else scene.fog = null;
    }
    for (const name of this.activeProps) this.props.get(name)?.update?.(world);
  }
}
