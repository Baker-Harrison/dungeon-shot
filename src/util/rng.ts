/** Seeded mulberry32 RNG for deterministic dungeon/upgrade rolls. */
export function createRng(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function pickN<T>(rng: () => number, items: T[], n: number): T[] {
  const copy = [...items];
  const result: T[] = [];
  while (result.length < n && copy.length > 0) {
    const i = Math.floor(rng() * copy.length);
    result.push(copy.splice(i, 1)[0]!);
  }
  return result;
}

export function makeSeed(): number {
  return (Date.now() ^ (Math.random() * 0xffffffff)) >>> 0;
}
