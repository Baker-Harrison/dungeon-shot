import { DEFAULT_META, type MetaState } from './types';
import type { MetaUpgradeId } from '../data/metaUpgrades';

const SAVE_KEY = 'dungeon-shot-meta-v1';

export function loadMeta(): MetaState {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return structuredClone(DEFAULT_META);
    const parsed = JSON.parse(raw) as Partial<MetaState>;
    return {
      currency: typeof parsed.currency === 'number' ? parsed.currency : 0,
      upgrades: {
        startDamage: parsed.upgrades?.startDamage ?? 0,
        startMaxHp: parsed.upgrades?.startMaxHp ?? 0,
        startMoveSpeed: parsed.upgrades?.startMoveSpeed ?? 0,
      },
    };
  } catch {
    return structuredClone(DEFAULT_META);
  }
}

export function saveMeta(meta: MetaState): void {
  localStorage.setItem(SAVE_KEY, JSON.stringify(meta));
}

export function addCurrency(meta: MetaState, amount: number): MetaState {
  return { ...meta, currency: meta.currency + amount };
}

export function setMetaLevel(
  meta: MetaState,
  id: MetaUpgradeId,
  level: number,
): MetaState {
  return {
    ...meta,
    upgrades: { ...meta.upgrades, [id]: level },
  };
}
