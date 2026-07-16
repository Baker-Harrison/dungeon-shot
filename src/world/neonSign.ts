import * as THREE from 'three';

/** 5×7 block glyphs for neon SHOP lettering. */
const GLYPHS: Record<string, string[]> = {
  S: [
    '.###.',
    '#....',
    '#....',
    '.###.',
    '....#',
    '....#',
    '.###.',
  ],
  H: [
    '#...#',
    '#...#',
    '#...#',
    '#####',
    '#...#',
    '#...#',
    '#...#',
  ],
  O: [
    '.###.',
    '#...#',
    '#...#',
    '#...#',
    '#...#',
    '#...#',
    '.###.',
  ],
  P: [
    '####.',
    '#...#',
    '#...#',
    '####.',
    '#....',
    '#....',
    '#....',
  ],
};

/**
 * Place blocky neon "SHOP" in world space.
 * `faceDir` points from the wall into the room (toward the reader).
 * Letters read left→right from that reader's view — no yaw mirroring.
 */
export function placeNeonShopSign(
  parent: THREE.Group,
  materials: THREE.MeshStandardMaterial[],
  origin: THREE.Vector3,
  faceDir: THREE.Vector3,
  letterHeight = 0.48,
  color = 0xff4fd8,
): void {
  const forward = faceDir.clone().normalize();
  const up = new THREE.Vector3(0, 1, 0);
  // When looking at the sign (toward -forward), viewer's right is:
  const viewerRight = new THREE.Vector3()
    .crossVectors(forward.clone().negate(), up)
    .normalize();
  if (viewerRight.lengthSq() < 1e-6) {
    viewerRight.set(1, 0, 0);
  }

  const cell = letterHeight / 7;
  const depth = cell * 0.55;
  const gap = cell * 0.35;
  const letterWidth = cell * 5;
  const text = 'SHOP';
  const totalW = text.length * letterWidth + (text.length - 1) * gap;

  // Backing plate (toward the wall = -forward)
  const plateMat = new THREE.MeshStandardMaterial({
    color: 0x120818,
    emissive: color,
    emissiveIntensity: 0.12,
    roughness: 0.95,
    metalness: 0,
  });
  plateMat.userData.neonBase = 0.12;
  materials.push(plateMat);
  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    plateMat,
  );
  plate.scale.set(totalW + cell, letterHeight + cell * 0.6, cell * 0.15);
  plate.position.copy(origin).addScaledVector(forward, -depth * 0.4);
  plate.position.y += letterHeight / 2;
  // Orient plate: local Z along forward
  plate.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), forward);
  parent.add(plate);

  let along = -totalW / 2;
  for (const ch of text) {
    const rows = GLYPHS[ch];
    if (!rows) continue;
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r]!;
      for (let c = 0; c < row.length; c++) {
        if (row[c] !== '#') continue;
        const mat = new THREE.MeshStandardMaterial({
          color,
          emissive: color,
          emissiveIntensity: 2.4,
          roughness: 0.35,
          metalness: 0.1,
        });
        mat.userData.neonBase = 2.4;
        materials.push(mat);
        const mesh = new THREE.Mesh(
          new THREE.BoxGeometry(cell * 0.92, cell * 0.92, depth),
          mat,
        );
        const xOff = along + c * cell + cell / 2;
        const yOff = (6 - r) * cell + cell / 2;
        mesh.position
          .copy(origin)
          .addScaledVector(viewerRight, xOff)
          .addScaledVector(up, yOff)
          .addScaledVector(forward, depth * 0.15);
        mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), forward);
        parent.add(mesh);
      }
    }
    along += letterWidth + gap;
  }
}

/** Neon flicker: mostly on, with occasional dips and buzz. */
export function flickerNeon(
  materials: THREE.MeshStandardMaterial[],
  timeMs: number,
  baseIntensity = 2.4,
): void {
  const t = timeMs * 0.001;
  const buzz = 0.12 * Math.sin(t * 37.1) + 0.08 * Math.sin(t * 53.7);
  const pulse = 0.15 * Math.sin(t * 2.3);
  const hash = Math.sin(Math.floor(t * 14) * 12.9898) * 43758.5453;
  const hard = hash - Math.floor(hash);
  let mult = 1 + buzz + pulse;
  if (hard > 0.92) mult *= 0.15;
  else if (hard > 0.85) mult *= 0.55;

  for (const m of materials) {
    const base = (m.userData.neonBase as number | undefined) ?? baseIntensity;
    m.emissiveIntensity = Math.max(0.05, base * mult);
  }
}
