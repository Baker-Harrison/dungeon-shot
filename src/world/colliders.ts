/** Axis-aligned box on the XZ plane (y ignored for collision). */
export interface Aabb {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export function aabbFromCenter(
  cx: number,
  cz: number,
  w: number,
  d: number,
): Aabb {
  const hw = w / 2;
  const hd = d / 2;
  return { minX: cx - hw, maxX: cx + hw, minZ: cz - hd, maxZ: cz + hd };
}

export function resolveCircleAabb(
  x: number,
  z: number,
  radius: number,
  box: Aabb,
): { x: number; z: number } {
  const nearestX = Math.max(box.minX, Math.min(x, box.maxX));
  const nearestZ = Math.max(box.minZ, Math.min(z, box.maxZ));
  const dx = x - nearestX;
  const dz = z - nearestZ;
  const distSq = dx * dx + dz * dz;
  if (distSq >= radius * radius) return { x, z };
  if (distSq <= 1e-8) {
    // Center inside box — push out via smallest overlap
    const left = x - box.minX + radius;
    const right = box.maxX - x + radius;
    const up = z - box.minZ + radius;
    const down = box.maxZ - z + radius;
    const m = Math.min(left, right, up, down);
    if (m === left) return { x: box.minX - radius, z };
    if (m === right) return { x: box.maxX + radius, z };
    if (m === up) return { x, z: box.minZ - radius };
    return { x, z: box.maxZ + radius };
  }
  const dist = Math.sqrt(distSq);
  const push = (radius - dist) / dist;
  return { x: x + dx * push, z: z + dz * push };
}

export function moveWithColliders(
  x: number,
  z: number,
  dx: number,
  dz: number,
  radius: number,
  colliders: Aabb[],
): { x: number; z: number } {
  let nx = x + dx;
  let nz = z;
  for (const c of colliders) {
    const r = resolveCircleAabb(nx, nz, radius, c);
    nx = r.x;
    nz = r.z;
  }
  nz = nz + dz;
  for (const c of colliders) {
    const r = resolveCircleAabb(nx, nz, radius, c);
    nx = r.x;
    nz = r.z;
  }
  return { x: nx, z: nz };
}

export function circleHitsAabb(
  x: number,
  z: number,
  radius: number,
  box: Aabb,
): boolean {
  const nearestX = Math.max(box.minX, Math.min(x, box.maxX));
  const nearestZ = Math.max(box.minZ, Math.min(z, box.maxZ));
  const dx = x - nearestX;
  const dz = z - nearestZ;
  return dx * dx + dz * dz < radius * radius;
}
