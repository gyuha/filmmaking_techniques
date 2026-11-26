import * as THREE from 'three';
import type { Composite, Effects } from '../techniques/types';

// 카메라 화면의 최종 합성 패스.
// 샷 렌더 결과(최대 4장)를 전환 방식(composite)으로 합치고, 렌즈·빛·색 효과(effects)를 입힌다.

export const COMPOSITE_KIND: Record<Composite['kind'], number> = { single: 0, dissolve: 1, wipe: 2, iris: 3, split: 4, ripple: 5, double: 6 };

/** 현재 프레임에서 실제로 켜진 후처리 패스 이름(디버그 API·E2E 검사용) */
export function activePasses(composite: Composite, fx: Effects): string[] {
  const out: string[] = [];
  if (composite.kind !== 'single') out.push(composite.kind);
  if (fx.brightness < 0.999) out.push('fade');
  if (fx.grayscale > 0) out.push(fx.selectiveHue !== null ? 'selectiveColor' : 'grayscale');
  if (fx.sepia > 0) out.push('sepia');
  if (fx.vignette > 0) out.push('vignette');
  if (fx.letterbox > 0) out.push('letterbox');
  if (fx.grain > 0) out.push('grain');
  if (fx.colorGrade > 0) out.push('colorGrade');
  if (fx.dayForNight > 0) out.push('dayForNight');
  if (fx.fisheye > 0) out.push('fisheye');
  if (fx.tiltShift > 0) out.push('tiltShift');
  if (fx.motionBlur > 0) out.push('motionBlur');
  if (fx.dof) out.push('dof');
  if (fx.bokeh > 0) out.push('bokeh');
  if (fx.flare > 0) out.push('flare');
  if (fx.godRays > 0) out.push('godRays');
  if (fx.flash > 0) out.push('flash');
  if (fx.anamorphic > 0) out.push('anamorphic');
  if (fx.glitch > 0) out.push('glitch');
  return out;
}

const fragmentShader = /* glsl */ `
precision highp float;
uniform sampler2D tA; uniform sampler2D tB; uniform sampler2D tC; uniform sampler2D tD;
uniform sampler2D dA;
uniform int kind; uniform float amount; uniform float angle; uniform int panes;
uniform vec2 irisCenter;
uniform vec2 resolution; uniform float time;
uniform float cameraNear; uniform float cameraFar;
uniform float brightness, grayscale, selectiveHue, useSelective, sepia, vignette, letterbox, grain;
uniform float colorGrade, dayForNight, fisheye, tiltShift, focusDistance, aperture, useDof, bokeh;
uniform float flare, godRays, flash, anamorphic, glitch;
uniform vec3 sunScreen; // xy = uv, z = 1이면 화면 앞쪽
varying vec2 vUv;

float aspect() { return resolution.x / resolution.y; }

vec3 shotTex(int i, vec2 uv) {
  if (i == 0) return texture2D(tA, uv).rgb;
  if (i == 1) return texture2D(tB, uv).rgb;
  if (i == 2) return texture2D(tC, uv).rgb;
  return texture2D(tD, uv).rgb;
}

vec3 sceneColorLinear(vec2 uv);
vec3 toSRGB(vec3 c) {
  c = max(c, vec3(0.0));
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c));
}

// 전환 합성(효과 적용 전 색, 화면 색공간)
vec3 sceneColor(vec2 uv) { return toSRGB(sceneColorLinear(uv)); }
vec3 sceneColorLinear(vec2 uv) {
  if (kind == 1) return mix(texture2D(tA, uv).rgb, texture2D(tB, uv).rgb, amount);
  if (kind == 5) {
    vec2 w = vec2(sin(uv.y * 38.0 + time * 9.0), cos(uv.x * 30.0 + time * 7.0)) * angle * 0.007;
    vec2 q = clamp(uv + w, 0.0, 1.0);
    return mix(texture2D(tA, q).rgb, texture2D(tB, q).rgb, amount);
  }
  if (kind == 6) {
    vec3 a = texture2D(tA, uv).rgb;
    vec3 b = texture2D(tB, uv).rgb;
    vec3 screen = 1.0 - (1.0 - a) * (1.0 - b);
    return mix(a, screen, amount);
  }
  if (kind == 2) {
    vec2 dir = vec2(cos(angle), sin(angle));
    vec2 p = (uv - 0.5) * vec2(aspect(), 1.0);
    float extent = 0.5 * (abs(dir.x) * aspect() + abs(dir.y));
    float d = dot(p, dir) / extent; // -1..1
    float edge = amount * 2.0 - 1.0;
    float line = 1.0 - smoothstep(0.0, 0.012, abs(d - edge));
    vec3 c = d < edge ? texture2D(tB, uv).rgb : texture2D(tA, uv).rgb;
    return mix(c, vec3(1.0), line * 0.85);
  }
  if (kind == 3) {
    vec2 p = (uv - irisCenter) * vec2(aspect(), 1.0);
    float maxR = length(vec2(aspect(), 1.0));
    float d = length(p) / maxR;
    float inside = 1.0 - smoothstep(amount - 0.004, amount + 0.004, d);
    return texture2D(tA, uv).rgb * inside;
  }
  if (kind == 4) {
    int n = panes;
    if (n <= 2) {
      int i = uv.x < 0.5 ? 0 : 1;
      vec2 l = vec2(fract(uv.x * 2.0), uv.y);
      float border = step(abs(uv.x - 0.5), 0.003);
      return mix(shotTex(i, l), vec3(0.05), border);
    }
    if (n == 3) {
      float fx = uv.x * 3.0;
      int i = int(floor(fx));
      vec2 l = vec2(fract(fx), uv.y);
      float border = step(abs(fract(fx + 0.5) - 0.5), 0.006);
      return mix(shotTex(i, l), vec3(0.05), border);
    }
    vec2 g = uv * 2.0;
    int i = int(floor(g.x)) + (1 - int(floor(g.y))) * 2;
    vec2 l = fract(g);
    float border = max(step(abs(uv.x - 0.5), 0.003), step(abs(uv.y - 0.5), 0.004));
    return mix(shotTex(i, l), vec3(0.05), border);
  }
  return texture2D(tA, uv).rgb;
}

float linearDepth(vec2 uv) {
  float z = texture2D(dA, uv).x;
  float ndc = z * 2.0 - 1.0;
  return (2.0 * cameraNear * cameraFar) / (cameraFar + cameraNear - ndc * (cameraFar - cameraNear));
}

float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

vec3 rgb2hsv(vec3 c) {
  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

// 원판 모양 표본으로 흐리게(보케·피사계 심도·틸트 시프트)
vec3 discBlur(vec2 uv, float radiusPx, float highlightBoost) {
  if (radiusPx < 0.5) return sceneColor(uv);
  vec3 acc = vec3(0.0); float wsum = 0.0;
  const int N = 48;
  for (int i = 0; i < N; i++) {
    float a = float(i) * 2.39996;
    float r = sqrt((float(i) + 0.5) / float(N));
    vec2 o = vec2(cos(a) * (anamorphic > 0.0 ? 0.5 : 1.0), sin(a)) * r * radiusPx / resolution;
    vec3 c = sceneColor(uv + o);
    float w = 1.0 + highlightBoost * pow(luma(c), 4.0) * 8.0;
    acc += c * w; wsum += w;
  }
  return acc / wsum;
}

void main() {
  vec2 uv = vUv;

  // 레터박스
  if (letterbox > 0.0) {
    float a = aspect();
    if (letterbox > a) {
      float band = (1.0 - a / letterbox) * 0.5;
      if (uv.y < band || uv.y > 1.0 - band) { gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }
    }
  }

  // 어안 왜곡
  if (fisheye > 0.0) {
    vec2 p = (uv - 0.5) * vec2(aspect(), 1.0);
    float r = length(p);
    float k = fisheye * 0.9;
    vec2 q = p * (1.0 + k * r * r * 1.6);
    uv = q / vec2(aspect(), 1.0) + 0.5;
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) { gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }
  }

  vec3 col;
  float blurPx = 0.0;
  if (useDof > 0.5) {
    float d = linearDepth(uv);
    float coc = abs(d - focusDistance) / max(d, 0.001);
    blurPx = clamp(coc * aperture * 40.0, 0.0, 18.0);
  }
  if (tiltShift > 0.0) {
    float band = abs(uv.y - 0.5);
    blurPx = max(blurPx, smoothstep(0.08, 0.42, band) * 14.0 * tiltShift);
  }
  if (glitch > 0.0) {
    float band = floor(uv.y * 36.0);
    float tick = floor(time * 12.0);
    float jump = step(0.82, hash(vec2(band, tick))) * (hash(vec2(tick, band)) - 0.5) * 0.12 * glitch;
    vec2 g = vec2(uv.x + jump, uv.y);
    vec2 ca = vec2(0.006 + 0.01 * abs(sin(time * 3.0)), 0.0) * glitch;
    col = vec3(sceneColor(g + ca).r, sceneColor(g).g, sceneColor(g - ca).b);
  } else {
    col = blurPx > 0.0 ? discBlur(uv, blurPx, bokeh) : sceneColor(uv);
  }

  // 갓레이: 해 위치에서 바깥으로 밝은 부분을 끌고 나온다
  if (godRays > 0.0 && sunScreen.z > 0.5) {
    vec2 delta = (uv - sunScreen.xy) / 48.0;
    vec2 p = uv;
    float illum = 1.0; vec3 rays = vec3(0.0);
    for (int i = 0; i < 48; i++) {
      p -= delta;
      vec3 s = sceneColor(clamp(p, 0.0, 1.0));
      float bright = smoothstep(0.62, 0.95, luma(s));
      rays += s * bright * illum;
      illum *= 0.965;
    }
    col += rays / 48.0 * godRays * 2.2;
  }

  // 렌즈 플레어: 해와 화면 중앙을 잇는 선 위의 빛망울
  if (flare > 0.0 && sunScreen.z > 0.5) {
    vec2 sp = sunScreen.xy;
    vec2 axis = vec2(0.5) - sp;
    vec2 pa = uv * vec2(aspect(), 1.0);
    float glow = exp(-length((uv - sp) * vec2(aspect(), 1.0)) * 6.0);
    vec3 f = vec3(1.0, 0.85, 0.6) * glow * 0.9;
    for (int i = 1; i <= 5; i++) {
      float k = float(i) * 0.42;
      vec2 c = (sp + axis * k) * vec2(aspect(), 1.0);
      float rr = 0.025 + 0.018 * float(i);
      float ring = smoothstep(rr, rr * 0.75, length(pa - c));
      vec3 tint = mix(vec3(0.6, 0.8, 1.0), vec3(1.0, 0.6, 0.4), fract(float(i) * 0.37));
      f += tint * ring * 0.22;
    }
    col += f * flare;
  }

  // 아나모픽: 밝은 점에서 가로로 길게 뻗는 푸른 빛줄기
  if (anamorphic > 0.0) {
    vec3 streak = vec3(0.0);
    for (int i = -20; i <= 20; i++) {
      vec2 q = uv + vec2(float(i) * 0.018, 0.0);
      vec3 s = sceneColor(clamp(q, 0.0, 1.0));
      float b = smoothstep(0.8, 1.0, luma(s));
      streak += b * exp(-abs(float(i)) * 0.12);
    }
    col += streak * vec3(0.35, 0.55, 1.0) * 0.16 * anamorphic;
  }

  // 색 처리
  if (colorGrade > 0.0) {
    float l = luma(col);
    vec3 teal = vec3(0.0, 0.42, 0.5);
    vec3 orange = vec3(1.0, 0.58, 0.25);
    vec3 graded = mix(teal * (l * 1.6), orange * (0.4 + l), smoothstep(0.15, 0.7, l));
    graded = mix(col, graded, 0.65);
    graded = (graded - 0.5) * 1.15 + 0.5;
    col = mix(col, graded, colorGrade);
  }
  if (dayForNight > 0.0) {
    float d = useDof > 0.5 ? 0.0 : texture2D(dA, uv).x;
    float sky = step(0.9999, d);
    vec3 night = col * 0.32;
    night = vec3(night.r * 0.55, night.g * 0.75, night.b * 1.25 + 0.02);
    night *= mix(1.0, 0.45, sky);
    col = mix(col, night, dayForNight);
  }
  if (grayscale > 0.0) {
    float l = luma(col);
    float keep = 0.0;
    if (useSelective > 0.5) {
      vec3 hsv = rgb2hsv(col);
      float dh = abs(hsv.x * 360.0 - selectiveHue);
      dh = min(dh, 360.0 - dh);
      keep = (1.0 - smoothstep(14.0, 30.0, dh)) * smoothstep(0.25, 0.45, hsv.y);
    }
    col = mix(col, vec3(l), grayscale * (1.0 - keep));
  }
  if (sepia > 0.0) {
    float l = luma(col);
    vec3 s = vec3(l * 1.07, l * 0.92, l * 0.68) + vec3(0.06, 0.04, 0.0);
    col = mix(col, s, sepia);
  }
  if (vignette > 0.0) {
    vec2 p = (uv - 0.5) * vec2(aspect(), 1.0);
    float v = smoothstep(0.35, 0.95, length(p));
    col = mix(col, col * 0.25 + vec3(0.08, 0.06, 0.03), v * vignette);
  }
  if (grain > 0.0) {
    float n = hash(floor(uv * resolution / 1.5) + fract(time * 24.0) * 97.0) - 0.5;
    col += n * 0.28 * grain;
  }
  if (glitch > 0.0) {
    float scan = 0.85 + 0.15 * sin(uv.y * resolution.y * 1.6);
    col = mix(col, col * scan, glitch);
    col = mix(col, vec3(luma(col)) * vec3(1.05, 1.0, 0.92), 0.25 * glitch);
    col += (hash(uv * resolution + time) - 0.5) * 0.08 * glitch;
  }
  col = mix(col, vec3(1.0), flash);
  col *= brightness;
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

export class CompositePass {
  readonly material: THREE.ShaderMaterial;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  constructor() {
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        tA: { value: null }, tB: { value: null }, tC: { value: null }, tD: { value: null }, dA: { value: null },
        kind: { value: 0 }, amount: { value: 0 }, angle: { value: 0 }, panes: { value: 2 },
        irisCenter: { value: new THREE.Vector2(0.5, 0.5) },
        resolution: { value: new THREE.Vector2(1, 1) }, time: { value: 0 },
        cameraNear: { value: 0.1 }, cameraFar: { value: 600 },
        brightness: { value: 1 }, grayscale: { value: 0 }, selectiveHue: { value: 0 }, useSelective: { value: 0 },
        sepia: { value: 0 }, vignette: { value: 0 }, letterbox: { value: 0 }, grain: { value: 0 },
        colorGrade: { value: 0 }, dayForNight: { value: 0 }, fisheye: { value: 0 }, tiltShift: { value: 0 },
        focusDistance: { value: 10 }, aperture: { value: 0 }, useDof: { value: 0 }, bokeh: { value: 0 },
        flare: { value: 0 }, godRays: { value: 0 }, flash: { value: 0 }, anamorphic: { value: 0 }, glitch: { value: 0 }, sunScreen: { value: new THREE.Vector3() },
      },
    });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material);
    quad.frustumCulled = false;
    this.scene.add(quad);
  }

  set(composite: Composite, fx: Effects) {
    const u = this.material.uniforms;
    u.kind.value = COMPOSITE_KIND[composite.kind];
    u.amount.value =
      composite.kind === 'dissolve' ? composite.alpha
        : composite.kind === 'wipe' ? composite.progress
          : composite.kind === 'iris' ? composite.radius
            : composite.kind === 'ripple' ? composite.alpha
              : composite.kind === 'double' ? composite.amount : 0;
    u.angle.value = composite.kind === 'wipe' ? composite.angle : composite.kind === 'ripple' ? composite.amp : 0;
    u.panes.value = composite.kind === 'split' ? composite.panes : 2;
    u.brightness.value = fx.brightness;
    u.grayscale.value = fx.grayscale;
    u.useSelective.value = fx.selectiveHue !== null ? 1 : 0;
    u.selectiveHue.value = fx.selectiveHue ?? 0;
    u.sepia.value = fx.sepia;
    u.vignette.value = fx.vignette;
    u.letterbox.value = fx.letterbox;
    u.grain.value = fx.grain;
    u.colorGrade.value = fx.colorGrade;
    u.dayForNight.value = fx.dayForNight;
    u.fisheye.value = fx.fisheye;
    u.tiltShift.value = fx.tiltShift;
    u.useDof.value = fx.dof ? 1 : 0;
    u.focusDistance.value = fx.dof?.focusDistance ?? 10;
    u.aperture.value = fx.dof?.aperture ?? 0;
    u.bokeh.value = fx.bokeh;
    u.flare.value = fx.flare;
    u.godRays.value = fx.godRays;
    u.flash.value = fx.flash;
    u.anamorphic.value = fx.anamorphic;
    u.glitch.value = fx.glitch;
  }
}
