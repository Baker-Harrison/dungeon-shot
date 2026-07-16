/** Notable chance an Enemy drops one Relic on death. */
export const RELIC_DROP_CHANCE = 0.15;

/** Roll whether a defeated Enemy drops one Relic. */
export function rollRelicDrop(
  rng: () => number,
  chance: number = RELIC_DROP_CHANCE,
): boolean {
  return rng() < chance;
}
