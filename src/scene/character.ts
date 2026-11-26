import * as THREE from 'three';

/** 주황색 공 캐릭터(눈 두 개). 원본 채널 마스코트를 복제하지 않는 일반형 */
export function makeCharacter(color: THREE.ColorRepresentation = '#ff8a1c') {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 24), new THREE.MeshStandardMaterial({ color, roughness: 0.55 }));
  body.castShadow = true;
  body.name = 'body';
  g.add(body);
  const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.25, 5), new THREE.MeshStandardMaterial({ color: '#3f8f3a', flatShading: true }));
  leaf.position.set(0.05, 0.55, 0);
  leaf.rotation.z = -0.4;
  g.add(leaf);
  const white = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.3 });
  const black = new THREE.MeshStandardMaterial({ color: '#111111', roughness: 0.2 });
  for (const sx of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.13, 20, 14), white);
    eye.position.set(sx * 0.17, 0.12, 0.42);
    eye.scale.z = 0.6;
    g.add(eye);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.065, 16, 12), black);
    pupil.position.set(sx * 0.17, 0.12, 0.5);
    pupil.name = 'pupil';
    g.add(pupil);
  }
  const tear = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), new THREE.MeshStandardMaterial({ color: '#9fd8ff', roughness: 0.05, transparent: true, opacity: 0.85 }));
  tear.position.set(0.2, -0.02, 0.47);
  tear.scale.y = 1.5;
  tear.name = 'tear';
  tear.visible = false;
  g.add(tear);
  return g;
}

