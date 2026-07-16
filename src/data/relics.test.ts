import { describe, expect, it } from 'vitest';
import { createRng } from '../util/rng';
import { RELIC_DROP_CHANCE, rollRelicDrop } from './relics';

describe('rollRelicDrop', () => {
  it('never drops at chance 0 and always drops at chance 1', () => {
    const rng = createRng(1);
    expect(rollRelicDrop(rng, 0)).toBe(false);
    expect(rollRelicDrop(rng, 1)).toBe(true);
  });

  it('is deterministic for the same RNG sequence', () => {
    const a = createRng(42);
    const b = createRng(42);
    const resultsA = Array.from({ length: 20 }, () =>
      rollRelicDrop(a, RELIC_DROP_CHANCE),
    );
    const resultsB = Array.from({ length: 20 }, () =>
      rollRelicDrop(b, RELIC_DROP_CHANCE),
    );
    expect(resultsA).toEqual(resultsB);
  });

  it('lands near the configured drop rate over many rolls', () => {
    const rng = createRng(7);
    let hits = 0;
    const n = 2000;
    for (let i = 0; i < n; i++) {
      if (rollRelicDrop(rng, RELIC_DROP_CHANCE)) hits += 1;
    }
    const rate = hits / n;
    expect(rate).toBeGreaterThan(0.1);
    expect(rate).toBeLessThan(0.22);
  });
});
