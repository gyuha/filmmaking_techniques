import * as THREE from 'three';
import type { Vec3, WorldState } from '../techniques/types';
import { registerProps } from './props';
import { makeCharacter } from './character';

const TRACK_Z = -28;
const STATION_X = 30;

// 기법별 소품 모음. town.ts 가 import 해서 등록한다.

const m = (color: THREE.ColorRepresentation, extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.7, flatShading: true, ...extra });

const vec = (v: unknown, fallback: Vec3): Vec3 => (Array.isArray(v) && v.length === 3 ? (v as Vec3) : fallback);
const num = (v: unknown, fallback: number) => (typeof v === 'number' ? v : fallback);

registerProps({
  /** 그네: props.swingPos(놓을 위치), props.swingAngle(흔들림 각도, 라디안) */
  swing: {
    create() {
      const root = new THREE.Group();
      const frameMat = m('#d24b3e');
      const legGeo = new THREE.CylinderGeometry(0.07, 0.07, 3.6, 8);
      for (const sx of [-1.1, 1.1]) {
        for (const sz of [-0.9, 0.9]) {
          const leg = new THREE.Mesh(legGeo, frameMat);
          leg.position.set(sx, 1.65, sz / 2);
          leg.rotation.x = sz > 0 ? -0.26 : 0.26;
          leg.castShadow = true;
          root.add(leg);
        }
      }
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.5, 8), frameMat);
      bar.rotation.z = Math.PI / 2;
      bar.position.y = 3.2;
      root.add(bar);
      const pivot = new THREE.Group();
      pivot.position.y = 3.2;
      const ropeGeo = new THREE.CylinderGeometry(0.02, 0.02, 2.7, 6);
      for (const sx of [-0.38, 0.38]) {
        const rope = new THREE.Mesh(ropeGeo, m('#555b66'));
        rope.position.set(sx, -1.35, 0);
        pivot.add(rope);
      }
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.07, 0.35), m('#8a5a35'));
      seat.position.y = -2.72;
      seat.castShadow = true;
      pivot.add(seat);
      root.add(pivot);
      return {
        object: root,
        update(w: WorldState) {
          const p = vec(w.props.swingPos, [-2.4, 0, -0.6]);
          root.position.set(p[0], p[1], p[2]);
          pivot.rotation.x = -num(w.props.swingAngle, 0);
        },
      };
    },
  },
});

registerProps({
  /** 눈: props.snow(0~1) */
  snow: {
    create() {
      const N = 1500;
      const pos = new Float32Array(N * 3);
      const seed = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) {
        seed[i * 3] = (Math.sin(i * 12.9898) * 43758.5453) % 1;
        seed[i * 3 + 1] = (Math.sin(i * 78.233) * 12543.123) % 1;
        seed[i * 3 + 2] = (Math.sin(i * 39.425) * 24634.634) % 1;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: '#ffffff', size: 0.09, transparent: true, opacity: 0.95 }));
      pts.frustumCulled = false;
      return {
        object: pts,
        update(w: WorldState) {
          pts.visible = num(w.props.snow, 0) > 0;
          const t = w.sceneTime;
          for (let i = 0; i < N; i++) {
            const x = Math.abs(seed[i * 3]) * 30 - 15;
            const z = Math.abs(seed[i * 3 + 2]) * 22 - 12;
            const y = 8 - ((Math.abs(seed[i * 3 + 1]) * 8 + t * 0.9) % 8);
            pos[i * 3] = x + Math.sin(t + i) * 0.2;
            pos[i * 3 + 1] = y;
            pos[i * 3 + 2] = z;
          }
          geo.attributes.position.needsUpdate = true;
        },
      };
    },
  },

  /** 알람시계: props.ringing 이면 흔들림 */
  alarmClock: {
    create() {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.16, 24), m('#e63946'));
      body.rotation.x = Math.PI / 2;
      const face = new THREE.Mesh(new THREE.CircleGeometry(0.23, 24), m('#fffaf0'));
      face.position.z = 0.081;
      const bellGeo = new THREE.SphereGeometry(0.11, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
      const b1 = new THREE.Mesh(bellGeo, m('#ffd166'));
      b1.position.set(-0.16, 0.27, 0);
      b1.rotation.z = 0.5;
      const b2 = b1.clone();
      b2.position.x = 0.16;
      b2.rotation.z = -0.5;
      const hand = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.17, 0.01), m('#111'));
      hand.position.set(0, 0.07, 0.09);
      const table = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 0.6), m('#8a5a35'));
      table.position.set(0, -0.53, 0);
      g.add(body, face, b1, b2, hand, table);
      const clock = new THREE.Group();
      clock.add(g);
      clock.position.set(-1.0, 0.82, 0.3);
      return {
        object: clock,
        update(w: WorldState) {
          const ring = w.props.ringing === true;
          g.rotation.z = ring ? Math.sin(w.sceneTime * 60) * 0.18 : 0;
          g.position.y = ring ? Math.abs(Math.sin(w.sceneTime * 45)) * 0.05 : 0;
          table.rotation.z = -g.rotation.z;
        },
      };
    },
  },

  /** 스케이트보드: 캐릭터 발밑을 따라감. props.skateFall 이면 뒤집힘 */
  skateboard: {
    create() {
      const g = new THREE.Group();
      const deck = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.05, 0.3), m('#2a9d8f'));
      g.add(deck);
      for (const x of [-0.33, 0.33]) {
        for (const z of [-0.12, 0.12]) {
          const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.05, 12), m('#f1faee'));
          wheel.rotation.x = Math.PI / 2;
          wheel.position.set(x, -0.07, z);
          g.add(wheel);
        }
      }
      return {
        object: g,
        update(w: WorldState) {
          const s = w.subject.position;
          const fall = w.props.skateFall === true;
          g.position.set(fall ? s[0] + 0.9 : s[0], fall ? 0.05 : s[1] - 0.5, fall ? s[2] - 0.6 : s[2]);
          g.rotation.set(fall ? Math.PI : 0, fall ? 0.6 : w.subject.heading - Math.PI / 2, fall ? 0.3 : 0);
        },
      };
    },
  },

  /** 기차 + 선로 + 승강장: props.trainX */
  train: {
    create() {
      const root = new THREE.Group();
      const rail = m('#6b6b6b');
      for (const dz of [-0.6, 0.6]) {
        const r = new THREE.Mesh(new THREE.BoxGeometry(260, 0.08, 0.08), rail);
        r.position.set(0, 0.06, TRACK_Z + dz);
        root.add(r);
      }
      for (let x = -130; x <= 130; x += 1.2) {
        const tie = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 1.8), m('#5b3a29'));
        tie.position.set(x, 0.03, TRACK_Z);
        root.add(tie);
      }
      const platform = new THREE.Mesh(new THREE.BoxGeometry(18, 0.35, 3.2), m('#c9c2b2'));
      platform.position.set(STATION_X, 0.17, TRACK_Z + 2.9);
      platform.receiveShadow = true;
      const roof = new THREE.Mesh(new THREE.BoxGeometry(10, 0.15, 3.4), m('#2c5f8a'));
      roof.position.set(STATION_X, 3.2, TRACK_Z + 3.2);
      for (const x of [-4.5, 4.5]) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3, 8), m('#333'));
        post.position.set(STATION_X + x, 1.6, TRACK_Z + 4.4);
        root.add(post);
      }
      root.add(platform, roof);
      const train = new THREE.Group();
      const colors = ['#d62828', '#f4f1de', '#f4f1de'];
      colors.forEach((c, i) => {
        const car = new THREE.Mesh(new THREE.BoxGeometry(6.2, 2.2, 2.0), m(c));
        car.position.set(-i * 6.6, 1.35, 0);
        car.castShadow = true;
        train.add(car);
        for (let wnd = -2; wnd <= 2; wnd++) {
          const win = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.6), m('#9fc6e8', { emissive: '#223' }));
          win.position.set(-i * 6.6 + wnd * 1.15, 1.7, 1.01);
          train.add(win);
        }
      });
      const nose = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.8, 16), m('#d62828'));
      nose.rotation.z = Math.PI / 2;
      nose.position.set(3.4, 1.35, 0);
      const lamp = new THREE.Mesh(new THREE.CircleGeometry(0.25, 16), new THREE.MeshBasicMaterial({ color: '#fff3b0' }));
      lamp.position.set(3.81, 1.5, 0);
      lamp.rotation.y = Math.PI / 2;
      train.add(nose, lamp);
      train.position.z = TRACK_Z;
      root.add(train);
      return {
        object: root,
        update(w: WorldState) {
          train.position.x = num(w.props.trainX, -200);
        },
      };
    },
  },

  /** 친구(파란 캐릭터): props.friendPos, props.friendTalk */
  friend: {
    create() {
      const c = makeCharacter('#4f8fe6');
      return {
        object: c,
        update(w: WorldState) {
          const p = vec(w.props.friendPos, [-38, 0.5, 4]);
          const talk = num(w.props.friendTalk, 0);
          c.position.set(p[0], p[1], p[2]);
          c.rotation.y = num(w.props.friendFacing, 0.5);
          c.scale.set(1 + talk * 0.25, 1 - talk * 0.3, 1 + talk * 0.25);
        },
      };
    },
  },

  /** 시계탑 시계 바늘: props.clockMinutes(자정부터 분) */
  clockHands: {
    create() {
      const g = new THREE.Group();
      g.position.set(30, 7.2, -8.66);
      const hourHand = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 0.02), m('#111'));
      hourHand.geometry.translate(0, 0.2, 0);
      const minHand = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.72, 0.02), m('#111'));
      minHand.geometry.translate(0, 0.33, 0.01);
      for (let i = 0; i < 12; i++) {
        const tick = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12, 0.01), m('#333'));
        const a = (i / 12) * Math.PI * 2;
        tick.position.set(Math.sin(a) * 0.78, Math.cos(a) * 0.78, 0);
        tick.rotation.z = -a;
        g.add(tick);
      }
      g.add(hourHand, minHand);
      return {
        object: g,
        update(w: WorldState) {
          const mins = num(w.props.clockMinutes, 600);
          minHand.rotation.z = -((mins % 60) / 60) * Math.PI * 2;
          hourHand.rotation.z = -(((mins / 60) % 12) / 12) * Math.PI * 2;
        },
      };
    },
  },

  /** 큰 나무(플래시백): props.treeScale */
  bigTree: {
    create() {
      const g = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 3.2, 8), m('#6b4226'));
      trunk.position.y = 1.6;
      trunk.castShadow = true;
      g.add(trunk);
      const leaves = [[0, 4.2, 0, 1.9], [1.1, 3.7, 0.3, 1.3], [-1.0, 3.8, -0.2, 1.4], [0.2, 5.2, 0.1, 1.2]];
      for (const [x, y, z, r] of leaves) {
        const l = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), m('#4c9a3f'));
        l.position.set(x, y, z);
        l.castShadow = true;
        g.add(l);
      }
      const mound = new THREE.Mesh(new THREE.SphereGeometry(0.6, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), m('#7a5230'));
      g.add(mound);
      g.position.set(2.6, 0, -1.2);
      return {
        object: g,
        update(w: WorldState) {
          const s = num(w.props.treeScale, 1);
          g.scale.setScalar(s);
          mound.scale.setScalar(1 / s);
        },
      };
    },
  },
});

registerProps({
  /** 분수: props.fountainPos. 물방울은 sceneTime에 따라 포물선 */
  fountain: {
    create() {
      const g = new THREE.Group();
      const basin = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.5, 0.45, 24), m('#b8b2a7'));
      basin.position.y = 0.22;
      const water = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 0.05, 24), new THREE.MeshStandardMaterial({ color: '#5fa8d3', roughness: 0.1, metalness: 0.1 }));
      water.position.y = 0.42;
      const column = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 1.4, 12), m('#b8b2a7'));
      column.position.y = 0.9;
      const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.25, 0.2, 16), m('#b8b2a7'));
      bowl.position.y = 1.6;
      g.add(basin, water, column, bowl);
      const N = 90;
      const drops: THREE.Mesh[] = [];
      const dropGeo = new THREE.SphereGeometry(0.045, 8, 6);
      const dropMat = new THREE.MeshStandardMaterial({ color: '#cfeeff', roughness: 0.05, emissive: '#2a5a7a', emissiveIntensity: 0.3 });
      for (let i = 0; i < N; i++) {
        const d = new THREE.Mesh(dropGeo, dropMat);
        drops.push(d);
        g.add(d);
      }
      return {
        object: g,
        update(w: WorldState) {
          const p = vec(w.props.fountainPos, [-2.2, 0, -1.2]);
          g.position.set(p[0], p[1], p[2]);
          const st = w.sceneTime;
          drops.forEach((d, i) => {
            const life = 1.1;
            const phase = ((st + (i * 0.6180339) % 1 * life) % life + life) % life;
            const a = (i * 2.399) % (Math.PI * 2);
            const v = 0.9 + ((i * 0.37) % 0.5);
            const vy = 2.6 + ((i * 0.53) % 0.8);
            const x = Math.cos(a) * v * phase;
            const z = Math.sin(a) * v * phase;
            const y = 1.75 + vy * phase - 4.9 * phase * phase;
            d.position.set(x, Math.max(0.44, y), z);
            d.visible = y > 0.44;
          });
        },
      };
    },
  },

  /** 구름: props.cloudTime 만큼 흘러감 */
  clouds: {
    create() {
      const g = new THREE.Group();
      const mat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, transparent: true, opacity: 0.92 });
      const clouds: THREE.Group[] = [];
      for (let i = 0; i < 9; i++) {
        const c = new THREE.Group();
        for (let j = 0; j < 4; j++) {
          const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(2 + ((i + j) % 3), 1), mat);
          puff.position.set(j * 2.4 - 3.6, ((j * 7) % 3) * 0.6, ((i * j) % 3) - 1);
          c.add(puff);
        }
        c.position.set(-90 + i * 22, 28 + (i % 3) * 5, -60 + (i % 4) * 25);
        clouds.push(c);
        g.add(c);
      }
      return {
        object: g,
        update(w: WorldState) {
          const ct = num(w.props.cloudTime, 0);
          clouds.forEach((c, i) => {
            c.position.x = ((((-90 + i * 22 + ct * (6 + (i % 3) * 2)) % 200) + 200) % 200) - 100;
          });
        },
      };
    },
  },

  /** 화분 + 담장: props.potTime(0~1 담장 위, 1~1.58 낙하, 이후 깨짐) */
  flowerPot: {
    create() {
      const g = new THREE.Group();
      g.position.set(1.6, 0, -0.8);
      const wall = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, 0.7), m('#b5651d'));
      wall.position.y = 0.8;
      wall.castShadow = true;
      g.add(wall);
      const pot = new THREE.Group();
      const potBody = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.15, 0.36, 12), m('#c1440e'));
      const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.04, 12), m('#4a2c1a'));
      soil.position.y = 0.17;
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.35, 6), m('#2d6a4f'));
      stem.position.y = 0.36;
      const flower = new THREE.Mesh(new THREE.IcosahedronGeometry(0.12, 0), m('#ff5d8f'));
      flower.position.y = 0.56;
      pot.add(potBody, soil, stem, flower);
      g.add(pot);
      const shards: { mesh: THREE.Mesh; dir: THREE.Vector3 }[] = [];
      for (let i = 0; i < 8; i++) {
        const sh = new THREE.Mesh(new THREE.TetrahedronGeometry(0.1 + (i % 3) * 0.03, 0), m(i === 7 ? '#4a2c1a' : '#c1440e'));
        const a = (i / 8) * Math.PI * 2 + 0.3;
        shards.push({ mesh: sh, dir: new THREE.Vector3(Math.cos(a), 0, Math.sin(a)).multiplyScalar(0.5 + (i % 3) * 0.25) });
        g.add(sh);
      }
      const dirt = new THREE.Mesh(new THREE.CircleGeometry(0.4, 16), m('#4a2c1a'));
      dirt.rotation.x = -Math.PI / 2;
      g.add(dirt);
      const groundZ = 0.9;
      return {
        object: g,
        update(w: WorldState) {
          const pt = Math.max(0, num(w.props.potTime, 0));
          const fallStart = 1.0;
          const tHit = Math.sqrt((2 * 1.62) / 9.8);
          const df = pt - fallStart;
          const broken = df >= tHit;
          pot.visible = !broken;
          if (!broken) {
            const ff = Math.max(0, df);
            pot.position.set(0, 1.78 - 4.9 * ff * ff, Math.min(groundZ, ff * 1.55));
            pot.rotation.x = ff * 2.2;
          }
          const ds = df - tHit;
          dirt.visible = broken;
          dirt.position.set(0, 0.02, groundZ);
          dirt.scale.setScalar(broken ? Math.min(1, ds * 6) : 0.01);
          shards.forEach((s, i) => {
            s.mesh.visible = broken;
            if (!broken) return;
            const k = 1 - Math.exp(-ds * 5);
            const hop = Math.max(0, Math.sin(Math.min(1, ds * 3) * Math.PI)) * (0.25 + (i % 2) * 0.15);
            s.mesh.position.set(s.dir.x * k, 0.08 + hop, groundZ + s.dir.z * k);
            s.mesh.rotation.set(k * 4 + i, k * 3, i);
          });
        },
      };
    },
  },

  /** 장난감 블록 5개: props.stopT(한 장씩 끊긴 시간) — 하나씩 차례로 줄을 섬 */
  blocks: {
    create() {
      const g = new THREE.Group();
      const colors = ['#e63946', '#f4a261', '#2a9d8f', '#457b9d', '#9b5de5'];
      const blocks = colors.map((c) => {
        const b = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), m(c));
        b.castShadow = true;
        g.add(b);
        return b;
      });
      const starts: [number, number][] = [[-2.4, 1.4], [2.6, 1.6], [-1.6, -1.6], [2.2, -1.2], [0.4, 2.0]];
      return {
        object: g,
        update(w: WorldState) {
          const q = num(w.props.stopT, 0);
          blocks.forEach((b, i) => {
            const k = Math.min(1, Math.max(0, (q - i * 1.2) / 1.2));
            const e = k * k * (3 - 2 * k);
            const ex = -1.2 + i * 0.6;
            b.position.set(starts[i][0] + (ex - starts[i][0]) * e, 0.2 + Math.sin(e * Math.PI) * 0.35, starts[i][1] * (1 - e));
            b.rotation.y = (1 - e) * (i + 1) * 0.7;
          });
        },
      };
    },
  },
});

registerProps({
  /** 카메라 바로 앞의 꽃(랙 포커스): props.flower */
  flower: {
    create() {
      const g = new THREE.Group();
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.7, 6), m('#2d6a4f'));
      stem.position.y = -0.35;
      g.add(stem);
      const center = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8), m('#ffd166'));
      g.add(center);
      for (let i = 0; i < 8; i++) {
        const petal = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 6), m('#ff4d8d'));
        const a = (i / 8) * Math.PI * 2;
        petal.position.set(Math.cos(a) * 0.09, Math.sin(a) * 0.09, 0);
        petal.scale.set(1.3, 0.7, 0.4);
        petal.rotation.z = a;
        g.add(petal);
      }
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), m('#40916c'));
      leaf.position.set(0.07, -0.35, 0);
      leaf.scale.set(1.4, 0.4, 0.6);
      g.add(leaf);
      return {
        object: g,
        update(w: WorldState) {
          const p = vec(w.props.flower, [0.45, 0.7, 3.8]);
          g.position.set(p[0], p[1], p[2]);
          g.rotation.z = Math.sin(w.sceneTime * 1.3) * 0.05;
        },
      };
    },
  },

  /** 무거운 추(카메라 셰이크): props.weightY */
  weight: {
    create() {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.6, 0.8, 16), m('#3d405b', { metalness: 0.4 }));
      const knob = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.06, 8, 16), m('#3d405b'));
      knob.position.y = 0.5;
      const label = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.25), m('#f4f1de'));
      label.position.set(0, 0, 0.53);
      label.rotation.x = -0.18;
      g.add(body, knob, label);
      const dust = new THREE.Mesh(new THREE.RingGeometry(0.6, 1.6, 24), new THREE.MeshBasicMaterial({ color: '#d8c39a', transparent: true, opacity: 0.5, side: THREE.DoubleSide }));
      dust.rotation.x = -Math.PI / 2;
      dust.position.y = 0.03;
      const root = new THREE.Group();
      root.add(g, dust);
      root.position.set(0, 0, -0.5);
      return {
        object: root,
        update(w: WorldState) {
          const y = num(w.props.weightY, 0.5);
          g.position.y = y - 0.1;
          const landed = y <= 0.5;
          dust.visible = landed;
          dust.scale.setScalar(landed ? 1 + Math.min(1, (w.sceneTime - 1.6) * 2) : 0.01);
        },
      };
    },
  },

  /** 밤거리 줄 조명(보케용) */
  bokehLights: {
    create() {
      const g = new THREE.Group();
      const colors = ['#ffd27a', '#ff9a5a', '#fff2c0', '#ffb3c7', '#9ad7ff'];
      for (let i = 0; i < 60; i++) {
        const c = colors[i % colors.length];
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshBasicMaterial({ color: c }));
        const x = -7 + (i % 20) * 0.7;
        const row = Math.floor(i / 20);
        bulb.position.set(x, 2.0 + row * 0.7 + Math.sin(x * 0.9) * 0.25, -6.0 - row * 1.5);
        g.add(bulb);
      }
      const wire = new THREE.Mesh(new THREE.BoxGeometry(14, 0.01, 0.01), m('#222'));
      wire.position.set(0, 2.2, -6);
      g.add(wire);
      const warm = new THREE.PointLight('#ffc27a', 6, 8, 1.5);
      warm.position.set(0.9, 1.6, 1.6);
      g.add(warm);
      return { object: g };
    },
  },

  /** 안개 낀 숲(갓레이): 마을 동쪽(x≈66) */
  forest: {
    create() {
      const g = new THREE.Group();
      let s = 11;
      const r = () => {
        s = (s * 16807) % 2147483647;
        return s / 2147483647;
      };
      for (let i = 0; i < 70; i++) {
        const x = 66 + (r() - 0.5) * 34;
        const z = -2 - r() * 28;
        const h = 6 + r() * 5;
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, h, 6), m('#4a3526'));
        trunk.position.set(x, h / 2, z);
        trunk.castShadow = true;
        g.add(trunk);
        for (let j = 0; j < 3; j++) {
          const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(1.6 + r() * 1.2, 0), m('#2f5d34'));
          leaf.position.set(x + (r() - 0.5) * 2, h + (r() - 0.3) * 2, z + (r() - 0.5) * 2);
          leaf.castShadow = true;
          g.add(leaf);
        }
      }
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(50, 50), m('#3f6b3a'));
      floor.rotation.x = -Math.PI / 2;
      floor.position.set(66, 0.02, -8);
      g.add(floor);
      return { object: g };
    },
  },

  /** 알록달록한 시장(셀렉티브 컬러) */
  market: {
    create() {
      const g = new THREE.Group();
      const awnings = ['#d62828', '#2a9d8f', '#ffd60a', '#3a86ff', '#8338ec', '#06d6a0'];
      for (let i = 0; i < 6; i++) {
        const x = -7.5 + i * 3;
        const stall = new THREE.Group();
        const table = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.9, 1.0), m('#8d6e63'));
        table.position.y = 0.45;
        const awning = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.08, 1.6), m(awnings[i]));
        awning.position.set(0, 2.3, 0.2);
        awning.rotation.x = 0.2;
        for (const px of [-1.2, 1.2]) {
          const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.3, 6), m('#5d4037'));
          post.position.set(px, 1.15, 0.6);
          stall.add(post);
        }
        for (let k = 0; k < 5; k++) {
          const fruit = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), m(['#e63946', '#2a9d8f', '#ffd60a', '#7b2cbf', '#90be6d'][(i + k) % 5]));
          fruit.position.set(-0.8 + k * 0.4, 1.0, 0.1);
          stall.add(fruit);
        }
        stall.add(table, awning);
        stall.position.set(x, 0, -2.0);
        g.add(stall);
      }
      return { object: g };
    },
  },
});

registerProps({
  /** 180도 규칙의 축: 캐릭터와 상대를 잇는 바닥 선 */
  axisLine: {
    create() {
      const line = new THREE.Mesh(new THREE.BoxGeometry(1, 0.02, 0.08), new THREE.MeshBasicMaterial({ color: '#ffd166' }));
      const g = new THREE.Group();
      g.add(line);
      return {
        object: g,
        update(w: WorldState) {
          const a = w.subject.position;
          const b = vec(w.props.partner, [1.1, 0.5, 0]);
          const dx = b[0] - a[0];
          const dz = b[2] - a[2];
          const L = Math.hypot(dx, dz) * 3;
          line.scale.x = L;
          g.position.set((a[0] + b[0]) / 2, 0.03, (a[2] + b[2]) / 2);
          g.rotation.y = -Math.atan2(dz, dx);
        },
      };
    },
  },

  /** 문(컷 온 액션): props.actionProgress 0→1 로 열림 */
  door: {
    create() {
      const g = new THREE.Group();
      g.position.set(0, 0, -1.5);
      const wallMat = m('#e8d5b0');
      const left = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.6, 0.25), wallMat);
      left.position.set(-1.25, 1.3, 0);
      const right = left.clone();
      right.position.x = 1.25;
      const top = new THREE.Mesh(new THREE.BoxGeometry(3.9, 0.5, 0.25), wallMat);
      top.position.set(0, 2.35, 0);
      const hinge = new THREE.Group();
      hinge.position.set(-0.55, 0, 0.05);
      const panel = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.1, 0.08), m('#8a5a35'));
      panel.position.set(0.55, 1.05, 0);
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), m('#ffd166', { metalness: 0.6 }));
      knob.position.set(0.95, 1.05, 0.07);
      hinge.add(panel, knob);
      const inside = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 2.1), new THREE.MeshBasicMaterial({ color: '#ffe9a8' }));
      inside.position.set(0, 1.05, -0.1);
      g.add(left, right, top, hinge, inside);
      return {
        object: g,
        update(w: WorldState) {
          hinge.rotation.y = num(w.props.actionProgress, 0) * 1.9;
        },
      };
    },
  },

  /** 풍선(아이라인 매치): props.balloonPos */
  balloon: {
    create() {
      const g = new THREE.Group();
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 16), m('#e63946', { flatShading: false, roughness: 0.3 }));
      ball.scale.y = 1.2;
      const string = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 2.2, 4), m('#ddd'));
      string.position.y = -1.7;
      g.add(ball, string);
      return {
        object: g,
        update(w: WorldState) {
          const p = vec(w.props.balloonPos, [2.4, 6, -4]);
          g.position.set(p[0], p[1], p[2]);
          g.rotation.z = Math.sin(w.sceneTime * 1.5) * 0.1;
        },
      };
    },
  },

  /** 쿨레쇼프 효과의 앞 장면들(x≈20): props.context = food | flower | gift */
  kuleshov: {
    create() {
      const g = new THREE.Group();
      g.position.set(20, 0, 0);
      const table = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.35, 24), m('#8d6e63'));
      table.position.y = 0.17;
      g.add(table);
      const food = new THREE.Group();
      const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.22, 0.22, 20), m('#f4f1de'));
      bowl.position.y = 0.46;
      const soup = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.02, 20), m('#e76f51'));
      soup.position.y = 0.56;
      food.add(bowl, soup);
      const steam: THREE.Mesh[] = [];
      for (let i = 0; i < 3; i++) {
        const st = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.5 }));
        steam.push(st);
        food.add(st);
      }
      const flower = new THREE.Group();
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.13, 0.3, 12), m('#c1440e'));
      pot.position.y = 0.5;
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.5, 6), m('#6b705c'));
      stem.position.set(0.08, 0.8, 0);
      stem.rotation.z = -0.9;
      const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.09, 0), m('#6d4c41'));
      head.position.set(0.3, 0.68, 0);
      flower.add(pot, stem, head);
      const gift = new THREE.Group();
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.5), m('#3a86ff'));
      box.position.y = 0.55;
      const ribbon1 = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.42, 0.08), m('#ffd60a'));
      ribbon1.position.y = 0.55;
      const ribbon2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.42, 0.52), m('#ffd60a'));
      ribbon2.position.y = 0.55;
      const bow = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.03, 8, 16), m('#ffd60a'));
      bow.position.y = 0.82;
      gift.add(box, ribbon1, ribbon2, bow);
      g.add(food, flower, gift);
      return {
        object: g,
        update(w: WorldState) {
          const c = w.props.context;
          food.visible = c === 'food';
          flower.visible = c === 'flower';
          gift.visible = c === 'gift';
          steam.forEach((st, i) => {
            const ph = (w.sceneTime * 0.6 + i / 3) % 1;
            st.position.set(Math.sin(ph * 6 + i) * 0.08, 0.65 + ph * 0.6, 0);
            st.scale.setScalar(1 + ph);
          });
        },
      };
    },
  },

  /** 인비저블 컷용 검은 기둥: props.pillarPos */
  pillar: {
    create() {
      const p = new THREE.Mesh(new THREE.BoxGeometry(1.6, 6, 0.6), m('#1f2229'));
      p.position.y = 3;
      const g = new THREE.Group();
      g.add(p);
      return {
        object: g,
        update(w: WorldState) {
          const q = vec(w.props.pillarPos, [-1, 0, 3.5]);
          g.position.set(q[0], q[1], q[2]);
        },
      };
    },
  },
});
